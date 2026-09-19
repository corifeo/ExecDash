/* Configure, Data tab: export, import, resets and sample data. */

var IMPORT = null,
  importMode = 'merge',
  pasteOpen = false,
  pasteText = '',
  resetArmed = '';
var QID = /^\d{4}-Q[1-4]$/,
  SID = /^[A-Za-z0-9_.~:@+-]{1,80}$/;
function buildExport(type, qsel) {
  var d = { format: 'exec-dashboard', version: 1, type: type, exportedAt: new Date().toISOString() };
  if (type === 'structure' || type === 'backup') d.structure = stripCfg(config);
  if (type === 'risks' || type === 'backup') d.risks = clone(config.risks);
  if (type === 'initiatives' || type === 'backup') {
    d.initiatives = clone(config.initiatives);
    d.initiativeTypes = clone(config.initiativeTypes);
  }
  if (type === 'quarters' || type === 'backup') {
    d.quarters = {};
    Object.keys(quarters).forEach(function (k) {
      if (!qsel || qsel === k) d.quarters[k] = clone(quarters[k]);
    });
  }
  return d;
}
async function doExport(type) {
  if (!config) return;
  var qsel = type === 'quarters' ? ($('#exq') || {}).value || '' : '';
  var d = buildExport(type, qsel);
  var text = JSON.stringify(d, null, 2),
    name =
      'exec-dashboard-' +
      type +
      (qsel ? '-' + qsel : '') +
      '-' +
      new Date().toISOString().slice(0, 10) +
      '.json';
  try {
    browserDownload(name, text);
    msg = 'Downloaded ' + name;
    msgErr = false;
  } catch (e) {
    msg = 'Could not start the download.';
    msgErr = true;
  }
  updateBar();
}
function cleanRisk(r) {
  if (!r || typeof r !== 'object' || !str(r.name).trim()) return null;
  var o = {
    id: SID.test(r.id || '') ? r.id : uid('r'),
    name: str(r.name).trim(),
    categoryId: str(r.categoryId, 80),
    impacts: Array.isArray(r.impacts) ? strList(r.impacts) : r.impact ? [str(r.impact, 80)] : [],
    tags: strList(r.tags),
    enabled: r.enabled !== false,
    source: str(r.source, 40)
  };
  var cf = cleanFair(r.fair);
  if (cf) o.fair = cf;
  return o;
}
function cleanFair(f) {
  if (!f || typeof f !== 'object') return undefined;
  var o = {};
  var ok = ['fMin', 'fMl', 'fMax', 'lMin', 'lMl', 'lMax'].every(function (k) {
    var v = num(f[k]);
    if (v == null || v < 0) return false;
    o[k] = v;
    return true;
  });
  return ok ? o : undefined;
}
function cleanInit(r) {
  if (!r || typeof r !== 'object' || !str(r.name).trim()) return null;
  return {
    id: SID.test(r.id || '') ? r.id : uid('i'),
    name: str(r.name).trim(),
    type: str(r.type, 80),
    categoryId: str(r.categoryId, 80),
    subId: str(r.subId, 80),
    start: str(r.start, 40),
    due: str(r.due, 40),
    projected: num(r.projected),
    cost: num(r.cost),
    runCost: Math.max(0, num(r.runCost) || 0),
    reduction: num(r.reduction) == null ? null : Math.max(0, Math.min(100, num(r.reduction))),
    tags: strList(r.tags),
    riskIds: Array.isArray(r.riskIds)
      ? r.riskIds
          .filter(function (x) {
            return SID.test(x || '');
          })
          .slice(0, 50)
      : [],
    enabled: r.enabled !== false
  };
}
function validateImport(o) {
  if (!o || typeof o !== 'object' || o.format !== 'exec-dashboard')
    throw new Error('This file is not a dashboard export (format field missing).');
  var types = ['structure', 'risks', 'initiatives', 'quarters', 'backup'];
  if (types.indexOf(o.type) < 0) throw new Error('Unknown export type "' + str(o.type, 30) + '".');
  var out = { type: o.type, warnings: [] };
  if (o.type === 'structure' || o.type === 'backup') {
    var st = o.structure;
    if (!st || !Array.isArray(st.categories)) throw new Error('The structure has no categories list.');
    st.categories.forEach(function (k, i) {
      if (!k || !SID.test(k.id || '') || !str(k.name).trim())
        throw new Error('Category ' + (i + 1) + ' needs a valid id and name.');
    });
    out.structure = stripCfg(normalizeConfig(st));
  }
  if (o.type === 'risks' || o.type === 'backup') {
    if (!Array.isArray(o.risks)) throw new Error('The file has no risks list.');
    out.risks = o.risks.map(cleanRisk).filter(Boolean);
    if (out.risks.length < o.risks.length)
      out.warnings.push(o.risks.length - out.risks.length + ' risks without a name were skipped.');
  }
  if (o.type === 'initiatives' || o.type === 'backup') {
    if (!Array.isArray(o.initiatives)) throw new Error('The file has no initiatives list.');
    out.initiatives = o.initiatives.map(cleanInit).filter(Boolean);
    out.initiativeTypes = Array.isArray(o.initiativeTypes)
      ? o.initiativeTypes
          .filter(function (t) {
            return t && SID.test(t.id || '') && str(t.name).trim();
          })
          .map(function (t) {
            return { id: t.id, name: str(t.name, 80) };
          })
      : [];
  }
  if (o.type === 'quarters' || o.type === 'backup') {
    if (!o.quarters || typeof o.quarters !== 'object') throw new Error('The file has no quarters.');
    out.quarters = {};
    Object.keys(o.quarters).forEach(function (k) {
      var q = o.quarters[k];
      if (!QID.test(k) || !q || typeof q !== 'object') {
        out.warnings.push('Skipped quarter "' + str(k, 20) + '": id must look like 2026-Q3.');
        return;
      }
      var qq = clone(q);
      if (qq.incidents && Array.isArray(qq.incidents.items))
        qq.incidents.items = qq.incidents.items
          .filter(function (x) {
            return x && typeof x === 'object';
          })
          .slice(0, 200)
          .map(function (x) {
            return {
              id: SID.test(x.id || '') ? x.id : uid('n'),
              title: str(x.title, 160),
              severity: str(x.severity, 40),
              categoryId: str(x.categoryId, 80),
              riskId: str(x.riskId, 80),
              description: str(x.description, 2000),
              reportable: !!x.reportable,
              ttc: num(x.ttc)
            };
          });
      qq.year = +k.slice(0, 4);
      qq.q = +k.slice(6);
      qq.label = str(qq.label || 'Q' + qq.q + ' ' + qq.year, 40);
      qq.period = str(qq.period || PERIODS[qq.q], 60);
      out.quarters[k] = qq;
    });
  }
  var cats = (out.structure || config || { categories: [] }).categories.map(function (k) {
    return k.id;
  });
  var badR = (out.risks || []).filter(function (r) {
    return r.categoryId && cats.indexOf(r.categoryId) < 0;
  }).length;
  if (badR) out.warnings.push(badR + ' risks point to categories that are not in the structure.');
  var badI = (out.initiatives || []).filter(function (r) {
    return r.categoryId && cats.indexOf(r.categoryId) < 0;
  }).length;
  if (badI) out.warnings.push(badI + ' initiatives point to categories that are not in the structure.');
  return out;
}
function matchIndex(cur, x) {
  for (var i = 0; i < cur.length; i++) {
    if (cur[i].id === x.id) return i;
  }
  var nm = (x.name || '').toLowerCase();
  if (nm)
    for (var j = 0; j < cur.length; j++) {
      if ((cur[j].name || '').toLowerCase() === nm) return j;
    }
  return -1;
}
function diffItems(cur, inc) {
  var n = { add: 0, upd: 0, del: 0 },
    hit = {};
  inc.forEach(function (x) {
    var i = matchIndex(cur, x);
    if (i >= 0) {
      n.upd++;
      hit[i] = 1;
    } else n.add++;
  });
  n.del = cur.length - Object.keys(hit).length;
  return n;
}
function diffIds(cur, inc) {
  return diffItems(
    cur.map(function (x) {
      return { id: x };
    }),
    inc.map(function (x) {
      return { id: x };
    })
  );
}
function importSummary(im) {
  var rows = [],
    replace = im.type === 'backup' || importMode === 'replace';
  function line(label, d) {
    rows.push(
      '<li><b>' +
        esc(label) +
        ':</b> ' +
        d.add +
        ' new, ' +
        d.upd +
        ' updated' +
        (replace
          ? ', ' + d.del + ' removed'
          : ', ' +
            d.del +
            ' kept as they are' +
            (label !== 'Quarters' ? '. Existing items keep their enabled setting' : '')) +
        '</li>'
    );
  }
  if (im.structure)
    rows.push(
      '<li><b>Structure:</b> replaced with ' +
        im.structure.categories.length +
        ' categories and ' +
        im.structure.functions.length +
        ' maturity functions</li>'
    );
  if (im.risks) line('Risks', diffItems(config ? config.risks : [], im.risks));
  if (im.initiatives) line('Initiatives', diffItems(config ? config.initiatives : [], im.initiatives));
  if (im.quarters) line('Quarters', diffIds(Object.keys(quarters), Object.keys(im.quarters)));
  return (
    '<ul class="isum">' +
    rows.join('') +
    '</ul>' +
    (im.warnings.length
      ? '<ul class="iwarn">' +
        im.warnings
          .map(function (w) {
            return '<li>' + esc(w) + '</li>';
          })
          .join('') +
        '</ul>'
      : '')
  );
}
function mergeById(cur, inc) {
  var out = clone(cur);
  inc.forEach(function (x) {
    var i = matchIndex(out, x);
    if (i >= 0) {
      out[i] = Object.assign({}, x, { id: out[i].id, enabled: out[i].enabled });
    } else out.push(x);
  });
  return out;
}
async function scopedReset(scope) {
  if (!DB) return;
  if (dirtyCfg || dirtyQ) {
    msg = 'Save or discard your changes first.';
    msgErr = true;
    updateBar();
    return;
  }
  msg = 'Resetting';
  msgErr = false;
  updateBar();
  try {
    var ks = Object.keys(quarters),
      i;
    if (scope === 'risks') {
      await DB.doc('dashboard/risks').set({ items: [] });
      var its = clone(config.initiatives);
      its.forEach(function (x) {
        x.riskIds = [];
      });
      await DB.doc('dashboard/initiatives').set({ items: its });
      for (i = 0; i < ks.length; i++) {
        var q = clone(quarters[ks[i]]);
        q.topRisks = [];
        ((q.incidents && q.incidents.items) || []).forEach(function (x) {
          x.riskId = '';
        });
        await DB.doc('quarters/' + ks[i]).set(q);
      }
      RF = { q: '', cat: '', impact: '', tag: '', src: '', used: '', en: '', page: 0 };
      SEL.r = {};
      msg = 'Risk register cleared. Import your risks under Data, or add them in the register.';
    } else if (scope === 'inits') {
      await DB.doc('dashboard/initiatives').set({ items: [] });
      for (i = 0; i < ks.length; i++) {
        var q2 = clone(quarters[ks[i]]);
        q2.initiatives = {};
        await DB.doc('quarters/' + ks[i]).set(q2);
      }
      IF = { q: '', cat: '', type: '', tag: '', en: '', risk: '', page: 0 };
      SEL.i = {};
      msg = 'Initiative register cleared.';
    } else if (scope === 'quarters') {
      for (i = 0; i < ks.length; i++) await DB.doc('quarters/' + ks[i]).delete();
      selectedQ = null;
      msg = 'All quarters deleted. Add one under Quarters.';
    }
    resetArmed = '';
    editQ = null;
    wq = null;
    msgErr = false;
    renderConfig();
  } catch (e) {
    writeErr(e);
  }
}
async function factoryReset(mode) {
  if (!DB) return;
  msg = 'Resetting';
  msgErr = false;
  updateBar();
  try {
    var ids = Object.keys(quarters);
    for (var i = 0; i < ids.length; i++) await DB.doc('quarters/' + ids[i]).delete();
    await DB.doc('dashboard/risks').delete();
    await DB.doc('dashboard/initiatives').delete();
    await DB.doc('dashboard/config').delete();
    try {
      [SK + 'collapsed'].concat(VIEW_SECTIONS.map(viewKey)).forEach(function (k) {
        localStorage.removeItem(k);
      });
    } catch (e) {}
    wcfg = null;
    wq = null;
    editQ = null;
    selectedQ = null;
    dirtyCfg = false;
    dirtyQ = false;
    IMPORT = null;
    resetArmed = '';
    SEL = { r: {}, i: {} };
    editRisk = null;
    editInit = null;
    hlStatus = null;
    initFilter = '';
    cfgTab = 'data';
    msg = '';
    view = 'dashboard';
    render();
    window.scrollTo(0, 0);
    if (mode === 'sample') loadSample();
  } catch (e) {
    writeErr(e);
  }
}
async function applyImport() {
  var im = IMPORT;
  if (!im || !DB) return;
  if (dirtyCfg || dirtyQ) {
    msg = 'Save or discard your changes before importing.';
    msgErr = true;
    updateBar();
    return;
  }
  var replace = im.type === 'backup' || importMode === 'replace';
  msg = 'Importing';
  msgErr = false;
  updateBar();
  try {
    var base = im.structure ? clone(im.structure) : stripCfg(config || normalizeConfig({}));
    if (im.risks) {
      var r = replace ? im.risks : mergeById(config ? config.risks : [], im.risks);
      await DB.doc('dashboard/risks').set({ items: r });
    }
    if (im.initiatives) {
      var it = replace ? im.initiatives : mergeById(config ? config.initiatives : [], im.initiatives);
      await DB.doc('dashboard/initiatives').set({ items: it });
      if (im.initiativeTypes.length)
        base.initiativeTypes = replace
          ? im.initiativeTypes
          : mergeById(base.initiativeTypes || [], im.initiativeTypes);
    }
    await DB.doc('dashboard/config').set(base);
    if (im.quarters) {
      var keys = Object.keys(im.quarters);
      if (replace) {
        var old = Object.keys(quarters).filter(function (k) {
          return keys.indexOf(k) < 0;
        });
        for (var i = 0; i < old.length; i++) await DB.doc('quarters/' + old[i]).delete();
      }
      for (var j = 0; j < keys.length; j++) await DB.doc('quarters/' + keys[j]).set(im.quarters[keys[j]]);
    }
    IMPORT = null;
    pasteText = '';
    msg = 'Import applied.';
    msgErr = false;
    editQ = null;
    wq = null;
    renderConfig();
  } catch (e) {
    writeErr(e);
  }
}
function readImportText(text) {
  try {
    var o = JSON.parse(text);
    IMPORT = validateImport(o);
    importMode = IMPORT.type === 'backup' || IMPORT.type === 'structure' ? 'replace' : 'merge';
    msg = '';
    msgErr = false;
  } catch (e) {
    IMPORT = null;
    msg = e instanceof SyntaxError ? 'That is not valid JSON.' : e.message;
    msgErr = true;
  }
  renderConfig();
}
function cfgDataMgmt() {
  var qs = sortedQs(),
    d = dirtyCfg || dirtyQ,
    out = '';
  var cards = [
    {
      k: 'structure',
      t: 'Structure',
      x: 'Title, lists, categories, indicators, maturity functions and appearance.'
    },
    {
      k: 'risks',
      t: 'Risk register',
      x: 'Every risk with its category, impacts, tags, loss estimate and enabled state.',
      r: 'risks',
      rl: 'Clear risk register',
      rw: 'Removes every risk, and their links from initiatives, top risk lists and incidents. The structure, initiatives and quarters stay.'
    },
    {
      k: 'initiatives',
      t: 'Initiative register',
      x: 'Every initiative, its types, value and links.',
      r: 'inits',
      rl: 'Clear initiative register',
      rw: 'Removes every initiative and its progress in each quarter. The structure, risks and quarters stay.'
    },
    {
      k: 'quarters',
      t: 'Quarter data',
      x: 'Values, top risks, incidents, exposure and initiative progress.',
      r: 'quarters',
      rl: 'Delete all quarters',
      rw: 'Removes every quarter of data. The structure and both registers stay.'
    },
    {
      k: 'backup',
      t: 'Everything',
      x: 'A full backup of all of the above in one file.',
      r: 'empty',
      rl: 'Reset everything',
      rw: 'Deletes the structure, both registers, every quarter and view preferences.',
      r2: 'sample',
      rl2: 'Reset to sample data',
      rw2: 'Resets everything, then loads the sample data.'
    }
  ];
  function resetBlock(key, label, warn) {
    if (resetArmed === key)
      return (
        '<div class="rconfirm" role="alert"><b>' +
        esc(label) +
        '?</b><p>' +
        esc(warn) +
        ' This cannot be undone.</p><div class="tools"><button class="btn danger armed" data-act="reset" data-a="' +
        key +
        '">Yes, ' +
        esc(label.charAt(0).toLowerCase() + label.slice(1)) +
        '</button><button class="btn" data-act="resetcancel">Cancel</button></div></div>'
      );
    return '<button class="btn danger" data-act="resetarm" data-a="' + key + '">' + esc(label) + '</button>';
  }
  out +=
    '<section class="csec"><h2>Export and reset' +
    info(
      'Exports download the saved data as JSON files you can import later. Resets ask for confirmation and cannot be undone, so export first.'
    ) +
    '</h2><p class="hint">Data is stored in this browser. Export a full backup regularly. Exports use the saved data' +
    (d ? '. You have unsaved changes that will not be included.' : '.') +
    ' <button class="btn link" data-act="about">About ExecDash</button></p><div class="xgrid">' +
    cards
      .map(function (x) {
        var armedHere = resetArmed && (resetArmed === x.r || resetArmed === x.r2);
        return (
          '<div class="xcard' +
          (armedHere ? ' danger' : '') +
          (x.k === 'backup' ? ' wide' : '') +
          '"><div><b>' +
          x.t +
          '</b><p class="desc">' +
          x.x +
          '</p></div>' +
          (x.k === 'quarters'
            ? '<select id="exq" aria-label="Quarter to export">' +
              opt('', 'All quarters', '') +
              qs
                .slice()
                .reverse()
                .map(function (q) {
                  return opt(q.id, q.label, '');
                })
                .join('') +
              '</select>'
            : '') +
          '<div class="xacts"><button class="btn' +
          (x.k === 'backup' ? ' primary' : '') +
          '" data-act="export" data-a="' +
          x.k +
          '">Export</button>' +
          (x.r && !(resetArmed === x.r2) ? resetBlock(x.r, x.rl, x.rw) : '') +
          (x.r2 && !(resetArmed === x.r) ? resetBlock(x.r2, x.rl2, x.rw2) : '') +
          '</div></div>'
        );
      })
      .join('') +
    '</div></section>';
  out +=
    '<section class="csec"><h2>Import</h2><p class="hint">Choose a file exported from this dashboard, or paste its JSON. You will see what changes before anything is saved.</p>' +
    '<div class="rowf">' +
    fld('JSON file', '<input type="file" id="impfile" accept=".json,application/json">') +
    '</div>' +
    '<details class="paste"' +
    (pasteOpen ? ' open' : '') +
    '><summary>Paste JSON instead</summary><textarea id="imptext" rows="8" placeholder="{ &quot;format&quot;: &quot;exec-dashboard&quot;, ... }">' +
    esc(pasteText) +
    '</textarea><button class="btn" data-act="checkimp">Check JSON</button></details>';
  if (IMPORT) {
    var canMode = IMPORT.type === 'risks' || IMPORT.type === 'initiatives' || IMPORT.type === 'quarters';
    out +=
      '<div class="ipreview"><h3>Ready to import: ' +
      esc(
        {
          structure: 'Structure',
          risks: 'Risk register',
          initiatives: 'Initiative register',
          quarters: 'Quarter data',
          backup: 'Full backup'
        }[IMPORT.type]
      ) +
      '</h3>' +
      (canMode
        ? '<div class="seg sm" role="group" aria-label="Import mode"><button data-act="impmode" data-a="merge" aria-pressed="' +
          (importMode === 'merge') +
          '">Merge, matching id or name</button><button data-act="impmode" data-a="replace" aria-pressed="' +
          (importMode === 'replace') +
          '">Replace all</button></div>'
        : '<p class="desc">' +
          (IMPORT.type === 'backup'
            ? 'A full backup replaces everything.'
            : 'A structure import replaces the current structure. Risks, initiatives and quarters stay.') +
          '</p>') +
      importSummary(IMPORT) +
      '<div class="tools" style="justify-content:flex-start"><button class="btn primary" data-act="applyimp"' +
      (d ? ' disabled title="Save or discard changes first"' : '') +
      '>Apply import</button><button class="btn" data-act="cancelimp">Cancel</button></div></div>';
  }
  out += '</section>';
  var iss = integrityIssues();
  out +=
    '<section class="csec"><h2>Data health' +
    info(
      'Looks for links to things that no longer exist, for example a risk that points to a deleted category, or quarter values for a deleted group. Saving also cleans these up automatically.'
    ) +
    '</h2>' +
    (iss.length
      ? '<ul class="iwarn">' +
        iss
          .map(function (x) {
            return '<li>' + esc(x) + '</li>';
          })
          .join('') +
        '</ul><p class="addrow"><button class="btn" data-act="fixint">Fix these problems</button></p>'
      : '<p class="desc">No broken links found.</p>') +
    '</section>';
  return out;
}
function browserDownload(name, text) {
  var blob = new Blob([text], { type: 'application/json' }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
}
async function loadSample() {
  try {
    var o = window.EXECDASH_SAMPLE ? clone(window.EXECDASH_SAMPLE) : null;
    if (!o) {
      var r = await fetch('data/sample-backup.json', { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      o = await r.json();
    }
    IMPORT = validateImport(o);
    importMode = 'replace';
    await applyImport();
    msg = '';
    view = 'dashboard';
    render();
  } catch (e) {
    var el = $('#dash');
    var p = document.createElement('p');
    p.className = 'notice';
    p.textContent =
      'Could not load the sample data (' +
      (e.message || e) +
      '). Serve the folder over HTTP, or import data/sample-backup.json from Configure, Data.';
    el.prepend(p);
  }
}
