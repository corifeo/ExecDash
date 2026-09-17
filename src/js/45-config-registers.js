/* Configure, Risks and initiatives tab: registers, filters, bulk actions, loss and value editors. */

var regView = 'risks',
  RF = { q: '', cat: '', impact: '', tag: '', src: '', used: '', en: '', page: 0 },
  IF = { q: '', cat: '', type: '', tag: '', en: '', risk: '', page: 0 },
  editRisk = null,
  editInit = null,
  PAGE = 12,
  SEL = { r: {}, i: {} };
function pager(total, page, key) {
  var pages = Math.max(1, Math.ceil(total / PAGE));
  if (page >= pages) page = pages - 1;
  if (page < 0) page = 0;
  var from = total ? page * PAGE + 1 : 0,
    to = Math.min(total, (page + 1) * PAGE);
  return {
    page: page,
    html:
      '<div class="pager"><span class="al">' +
      from +
      ' to ' +
      to +
      ' of ' +
      total +
      '</span>' +
      (pages > 1
        ? '<button class="btn" data-act="page" data-k="' +
          key +
          '" data-a="' +
          (page - 1) +
          '"' +
          (page <= 0 ? ' disabled' : '') +
          '>Previous</button><span class="al">Page ' +
          (page + 1) +
          ' of ' +
          pages +
          '</span><button class="btn" data-act="page" data-k="' +
          key +
          '" data-a="' +
          (page + 1) +
          '"' +
          (page >= pages - 1 ? ' disabled' : '') +
          '>Next</button>'
        : '') +
      '</div>'
  };
}
function chipRow(act, key, cur, opts) {
  return (
    '<div class="fchips" role="group">' +
    opts
      .map(function (o) {
        return (
          '<button class="chip" data-act="' +
          act +
          '" data-k="' +
          key +
          '" data-a="' +
          esc(o[0]) +
          '" aria-pressed="' +
          (String(cur) === String(o[0])) +
          '">' +
          esc(o[1]) +
          (o[2] != null ? ' <span class="cnt">' + o[2] + '</span>' : '') +
          '</button>'
        );
      })
      .join('') +
    '</div>'
  );
}
function cfgRegister() {
  var c = wcfg,
    er = c.risks.filter(function (r) {
      return r.enabled;
    }).length,
    ei = c.initiatives.filter(function (r) {
      return r.enabled;
    }).length;
  var sw =
    '<div class="regsw seg"><button data-act="regview" data-a="risks" aria-pressed="' +
    (regView === 'risks') +
    '">Risk register <span class="cnt">' +
    er +
    ' of ' +
    c.risks.length +
    ' enabled</span></button><button data-act="regview" data-a="inits" aria-pressed="' +
    (regView === 'inits') +
    '">Initiative register <span class="cnt">' +
    ei +
    ' of ' +
    c.initiatives.length +
    ' enabled</span></button></div>';
  return (
    '<section class="csec">' +
    sw +
    '<p class="hint">Only enabled items are offered in Quarter data. Disabling an item never removes it from quarters that already use it.</p>' +
    (regView === 'risks' ? riskReg(c) : initReg(c)) +
    '</section>'
  );
}
var LASTIDS = { r: [], i: [] };
function bulkBar(k, list) {
  LASTIDS[k] = list.map(function (o) {
    return o.id;
  });
  var sel = SEL[k],
    n = Object.keys(sel).length,
    ids = list.map(function (o) {
      return o.id;
    }),
    allOn =
      ids.length &&
      ids.every(function (id) {
        return sel[id];
      });
  return (
    '<div class="bulk' +
    (n ? ' on' : '') +
    '"><label class="selall"><input type="checkbox" data-selall="' +
    k +
    '"' +
    (allOn ? ' checked' : '') +
    '> Select all ' +
    ids.length +
    ' matching</label>' +
    (n
      ? '<span class="bcount">' +
        n +
        ' selected</span><button class="btn" data-act="bulk" data-k="' +
        k +
        '" data-a="enable">Enable</button><button class="btn" data-act="bulk" data-k="' +
        k +
        '" data-a="disable">Disable</button>' +
        '<button class="btn danger' +
        (armed === 'bulk:' + k ? ' armed' : '') +
        '" data-act="bulk" data-k="' +
        k +
        '" data-a="delete">' +
        (armed === 'bulk:' + k ? 'Confirm delete ' + n : 'Delete') +
        '</button>' +
        (armed === 'bulk:' + k
          ? '<span class="delwarn">' +
            (k === 'r'
              ? 'Their links in initiatives, top risk lists and incidents will be removed when you save.'
              : 'Their progress in every quarter will be removed when you save.') +
            '</span>'
          : '') +
        '<button class="btn link" data-act="bulk" data-k="' +
        k +
        '" data-a="clear">Clear selection</button>'
      : '<span class="al">Tick items to enable, disable or delete several at once.</span>') +
    '</div>'
  );
}
function rowHead(k, id, enabled, name, chips, open, editAct) {
  return (
    '<div class="rhead"><input type="checkbox" class="rsel" data-sel="' +
    k +
    ':' +
    esc(id) +
    '"' +
    (SEL[k][id] ? ' checked' : '') +
    ' aria-label="Select ' +
    esc(name) +
    '">' +
    '<button class="sw' +
    (enabled ? ' on' : '') +
    '" data-act="toggle" data-k="' +
    k +
    '" data-a="' +
    esc(id) +
    '" role="switch" aria-checked="' +
    !!enabled +
    '" aria-label="' +
    (enabled ? 'Disable ' : 'Enable ') +
    esc(name) +
    '"><i></i></button>' +
    '<div class="rmain' +
    (enabled ? '' : ' off') +
    '"><div class="rn">' +
    esc(name) +
    '</div><div class="rtags">' +
    chips +
    '</div></div><button class="btn" data-act="' +
    editAct +
    '" data-a="' +
    esc(id) +
    '" aria-expanded="' +
    open +
    '">' +
    (open ? 'Done' : 'Edit') +
    '</button></div>'
  );
}
function fairEditor(c, r, i) {
  var p = 'c:risks.' + i + '.fair',
    f = r.fair;
  if (!f)
    return (
      '<div class="fair empty"><div><b>Quantified loss</b><p class="desc">No estimate yet. Add one to show this risk on the loss tracker.</p></div>' +
      addBtn('addfair', 'Add loss estimate', ' data-a="' + i + '"') +
      '</div>'
    );
  var res = simRisk(r);
  return (
    '<div class="fair"><div class="fhead"><b>Quantified loss' +
    info(
      'Simplified FAIR. Event frequency is how often a loss event happens in a year. Loss per event is the total cost of one event. Low, most likely and high form a range, and 5,000 simulated years give the expected annual loss and the 1 in 10 year loss.'
    ) +
    '</b><span class="desc">Simplified FAIR. Set a low, most likely and high value for each factor.</span><button class="btn danger" data-act="clearfair" data-a="' +
    i +
    '">Delete estimate</button></div>' +
    '<div class="fgroups"><div class="fgrp"><span class="al">How often a loss event happens</span><div class="dials">' +
    knob(p + '.fMin', f.fMin, 'freq', 'Low', { small: true }) +
    knob(p + '.fMl', f.fMl, 'freq', 'Most likely', { small: true }) +
    knob(p + '.fMax', f.fMax, 'freq', 'High', { small: true }) +
    '</div></div>' +
    '<div class="fgrp"><span class="al">Loss per event</span><div class="dials">' +
    knob(p + '.lMin', f.lMin, 'money', 'Low', { small: true }) +
    knob(p + '.lMl', f.lMl, 'money', 'Most likely', { small: true }) +
    knob(p + '.lMax', f.lMax, 'money', 'High', { small: true }) +
    '</div></div></div>' +
    (res
      ? '<div class="fres"><div class="fnums"><span><b>' +
        esc(money(res.mean)) +
        '</b> expected a year</span><span><b>' +
        esc(money(res.p90)) +
        '</b> in a 1 in 10 year</span><span><b>' +
        Math.round(res.pEvent * 100) +
        '%</b> chance of an event each year</span></div>' +
        lossTracker(c.lossBands, res, { big: true, labels: true }) +
        '</div>'
      : '<p class="desc">Set all six dials to see the result.</p>') +
    '</div>'
  );
}
function riskReg(c) {
  var catOpts = [['', 'None']].concat(
    c.categories.map(function (x) {
      return [x.id, x.name];
    })
  );
  var tags = allTags(c.risks),
    f = RF,
    qq = f.q.trim().toLowerCase();
  var list = c.risks
    .map(function (r, i) {
      return { r: r, i: i, id: r.id };
    })
    .filter(function (o) {
      var r = o.r,
        k = findCat(c, r.categoryId);
      if (f.en === 'on' && !r.enabled) return false;
      if (f.en === 'off' && r.enabled) return false;
      if (f.cat && (f.cat === '_none' ? k : r.categoryId !== f.cat)) return false;
      if (f.impact && (f.impact === '_none' ? impList(r).length : impList(r).indexOf(f.impact) < 0))
        return false;
      if (f.tag && tagList(r).indexOf(f.tag) < 0) return false;
      if (f.src === 'lib' && r.source !== 'library') return false;
      if (f.src === 'custom' && r.source === 'library') return false;
      if (f.used === 'yes' && !riskUse(r.id).length) return false;
      if (f.used === 'linked' && !riskInits(c, r.id).length) return false;
      if (f.used === 'unlinked' && riskInits(c, r.id).length) return false;
      if (
        qq &&
        (r.name + ' ' + (k ? k.name : '') + ' ' + impList(r).join(' ') + ' ' + tagList(r).join(' '))
          .toLowerCase()
          .indexOf(qq) < 0
      )
        return false;
      return true;
    });
  if (
    editRisk &&
    !list.some(function (o) {
      return o.id === editRisk;
    })
  ) {
    var ix = c.risks.findIndex(function (r) {
      return r.id === editRisk;
    });
    if (ix >= 0) list.unshift({ r: c.risks[ix], i: ix, id: editRisk });
  }
  var pg = pager(list.length, f.page, 'risk');
  f.page = pg.page;
  var nOn = c.risks.filter(function (r) {
    return r.enabled;
  }).length;
  var out =
    '<div class="fbar"><div class="rowf">' +
    fld(
      'Search',
      '<input type="search" id="rsearch" value="' +
        esc(f.q) +
        '" placeholder="Name, category, impact or tag">',
      'wide'
    ) +
    fld(
      'Impact',
      '<select id="rf-impact">' +
        opt('', 'All impacts', f.impact) +
        c.impacts
          .map(function (x) {
            return opt(x, x, f.impact);
          })
          .join('') +
        opt('_none', 'No impact set', f.impact) +
        '</select>'
    ) +
    fld(
      'Tag',
      '<select id="rf-tag">' +
        opt('', 'All tags', f.tag) +
        tags
          .map(function (t) {
            return opt(t[0], t[0] + ' (' + t[1] + ')', f.tag);
          })
          .join('') +
        '</select>'
    ) +
    fld(
      'Source',
      '<select id="rf-src">' +
        opt('', 'All', f.src) +
        opt('lib', 'Library', f.src) +
        opt('custom', 'Custom', f.src) +
        '</select>'
    ) +
    fld(
      'Usage',
      '<select id="rf-used">' +
        opt('', 'All risks', f.used) +
        opt('yes', 'Used in a top risks list', f.used) +
        opt('linked', 'Linked to an initiative', f.used) +
        opt('unlinked', 'No linked initiative', f.used) +
        '</select>'
    ) +
    '<button class="btn link" data-act="rfclear">Clear filters</button></div>' +
    chipRow('rf', 'en', f.en, [
      ['', 'All', c.risks.length],
      ['on', 'Enabled', nOn],
      ['off', 'Disabled', c.risks.length - nOn]
    ]) +
    chipRow(
      'rf',
      'cat',
      f.cat,
      [['', 'All categories', c.risks.length]]
        .concat(
          c.categories
            .map(function (k) {
              return [
                k.id,
                k.name,
                c.risks.filter(function (r) {
                  return r.categoryId === k.id;
                }).length
              ];
            })
            .filter(function (x) {
              return x[2];
            })
        )
        .concat(
          c.risks.some(function (r) {
            return !findCat(c, r.categoryId);
          })
            ? [
                [
                  '_none',
                  'No category',
                  c.risks.filter(function (r) {
                    return !findCat(c, r.categoryId);
                  }).length
                ]
              ]
            : []
        )
    ) +
    bulkBar('r', list) +
    '</div>';
  out +=
    '<div class="addbar">' +
    addBtn('addrisk', 'Add risk') +
    '<span class="al">To load a curated library, import data/cyber-risk-library.json under Data.</span></div>';
  var rows = list
    .slice(pg.page * PAGE, (pg.page + 1) * PAGE)
    .map(function (o) {
      var r = o.r,
        i = o.i,
        k = findCat(c, r.categoryId),
        use = riskUse(r.id),
        p = 'c:risks.' + i;
      var chips =
        (k
          ? '<button class="tg cat" data-act="rf" data-k="cat" data-a="' +
            esc(k.id) +
            '">' +
            esc(k.name) +
            '</button>'
          : '<span class="tg warn">No category</span>') +
        impList(r)
          .map(function (x) {
            return (
              '<button class="tg imp" data-act="rf" data-k="impact" data-a="' +
              esc(x) +
              '">' +
              esc(x) +
              '</button>'
            );
          })
          .join('') +
        tagList(r)
          .map(function (t) {
            return (
              '<button class="tg" data-act="rf" data-k="tag" data-a="' + esc(t) + '">#' + esc(t) + '</button>'
            );
          })
          .join('') +
        (function () {
          var res = simRisk(r);
          return res
            ? '<span class="tg loss" title="' +
                esc(money(res.mean)) +
                ' expected a year"><span class="sw2" style="background:' +
                bandCol(bandIdx(c.lossBands, res.mean), c.lossBands.length) +
                '"></span>' +
                esc(bandName(c.lossBands, res.mean)) +
                ' loss</span>'
            : '';
        })() +
        (function () {
          var n = riskInits(c, r.id).length;
          return n
            ? '<button class="tg lnk" data-act="showlinked" data-a="' +
                esc(r.id) +
                '" title="Show linked initiatives">' +
                n +
                ' linked initiative' +
                (n > 1 ? 's' : '') +
                '</button>'
            : '';
        })() +
        (r.source === 'library' ? '' : '<span class="tg src">Custom</span>') +
        (use.length
          ? '<span class="tg use" title="' +
            esc(use.join(', ')) +
            '">Top risk in ' +
            use.length +
            ' quarter' +
            (use.length > 1 ? 's' : '') +
            '</span>'
          : '');
      var open = editRisk === r.id;
      return (
        '<div class="rrow' +
        (open ? ' open' : '') +
        '">' +
        rowHead('r', r.id, r.enabled, r.name, chips, open, 'editrisk') +
        (open
          ? '<div class="redit"><div class="rowf">' +
            fld('Risk', inp(p + '.name', r.name, 'text', ' data-rr style="width:100%"'), 'wide') +
            '</div><div class="rowf">' +
            fld('Category', sel(p + '.categoryId', catOpts, r.categoryId, true)) +
            fld(
              'Impacts',
              multiPick('c:risks.' + i + '.impacts', c.impacts, impList(r), 'Impacts'),
              'wide',
              'Select every type of impact the risk could have. The list is set under Structure.'
            ) +
            fld(
              'Tags',
              tagEditor(p + '.tags', tagList(r), {
                label: 'Risk tags',
                placeholder: 'Add tag',
                suggest: allTags(c.risks).map(function (t) {
                  return t[0];
                })
              }),
              'wide'
            ) +
            '<div class="tools" style="align-self:flex-end">' +
            delBtn('risk:' + r.id, 'Delete', delWarn('risk', r.id)) +
            '</div></div>' +
            fairEditor(c, r, i) +
            '</div>'
          : '') +
        '</div>'
      );
    })
    .join('');
  return (
    out +
    '<div class="rlist">' +
    (rows || '<p class="desc" style="padding:14px">No risks match these filters.</p>') +
    '</div>' +
    pg.html
  );
}
function linkEditor(c, it, i) {
  var ids = (it.riskIds || []).filter(function (id) {
    return findRisk(c, id);
  });
  var cands = c.risks.filter(function (r) {
    return r.enabled && ids.indexOf(r.id) < 0;
  });
  var own = cands.filter(function (r) {
      return r.categoryId === it.categoryId;
    }),
    other = cands.filter(function (r) {
      return r.categoryId !== it.categoryId;
    });
  var o = function (r) {
    var k = findCat(c, r.categoryId);
    return (
      '<option value="' +
      esc(r.id) +
      '">' +
      esc(r.name) +
      (k && r.categoryId !== it.categoryId ? ' (' + esc(k.name) + ')' : '') +
      '</option>'
    );
  };
  return (
    '<div class="tagedit linked" role="group" aria-label="Linked risks">' +
    ids
      .map(function (id) {
        var r = findRisk(c, id),
          k = findCat(c, r.categoryId);
        return (
          '<span class="tchip rlink">' +
          esc(r.name) +
          (k ? '<span class="tcount">' + esc(k.name) + '</span>' : '') +
          (r.enabled ? '' : '<span class="tcount">disabled</span>') +
          '<button class="tx" data-act="ilink-del" data-a="' +
          i +
          '" data-d="' +
          esc(id) +
          '" aria-label="Unlink ' +
          esc(r.name) +
          '">&#215;</button></span>'
        );
      })
      .join('') +
    (cands.length
      ? '<span class="tnew"><select id="il:' +
        i +
        '" aria-label="Risk to link"><option value="">Link an enabled risk</option>' +
        (own.length ? '<optgroup label="Same category">' + own.map(o).join('') + '</optgroup>' : '') +
        (other.length ? '<optgroup label="Other categories">' + other.map(o).join('') + '</optgroup>' : '') +
        '</select><button class="btn tplus" data-act="ilink-add" data-a="' +
        i +
        '" aria-label="Link risk">+</button></span>'
      : '<span class="al">No more enabled risks to link.</span>') +
    (ids.length ? '' : '<span class="al">Not linked. Links are optional.</span>') +
    '</div>'
  );
}
function valueEditor(c, it, i) {
  var p = 'c:initiatives.' + i,
    v = initValue(c, it);
  var msg2 = !v.risks
    ? 'Link at least one risk to calculate avoided loss.'
    : !v.est
      ? 'None of the linked risks has a loss estimate yet. Add one in the risk register.'
      : '';
  return (
    '<div class="fair"><div class="fhead"><b>Value' +
    info(AVOID_NOTE) +
    '</b><span class="desc">Uses the loss estimates of the linked risks.</span></div>' +
    '<div class="fgroups"><div class="fgrp"><span class="al">Cost' +
    info('The one-off cost of delivering the initiative, used to compare against avoided loss.') +
    '</span><div class="dials">' +
    knob(p + '.cost', it.cost, 'money', 'One-off cost', { small: true }) +
    '</div></div>' +
    '<div class="fgrp" style="flex:1;min-width:240px"><span class="al">Expected reduction in the linked risks\u2019 annual loss once delivered' +
    info('How much of the linked risks\u2019 expected annual loss this initiative removes once delivered.') +
    '</span>' +
    slider(p + '.reduction', it.reduction, {
      max: 100,
      step: 5,
      rr: true,
      label: 'Expected loss reduction'
    }) +
    '<p class="al" style="margin-top:6px">Linked risks with estimates: ' +
    v.est +
    ' of ' +
    v.risks +
    (v.est ? ', expected loss ' + esc(money(v.base)) + ' a year' : '') +
    '</p></div></div>' +
    (msg2
      ? '<p class="desc">' + esc(msg2) + '</p>'
      : '<div class="fres">' +
        (v.ratio != null
          ? '<div class="fnums"><span><b>' +
            esc(money(v.avoided)) +
            '</b> avoided a year</span><span><b>' +
            esc(ratioTxt(v.ratio)) +
            '</b></span><span>Payback <b>' +
            esc(paybackTxt(v.payback)) +
            '</b></span></div>'
          : '') +
        valueBars(v.avoided, v.cost, true) +
        '</div>') +
    '<p class="al">' +
    esc(AVOID_NOTE) +
    '</p></div>'
  );
}
function initReg(c) {
  var catOpts = [['', 'None']].concat(
    c.categories.map(function (x) {
      return [x.id, x.name];
    })
  );
  var f = IF,
    qq = f.q.trim().toLowerCase(),
    tags = allTags(c.initiatives),
    types = itypes(c);
  var list = c.initiatives
    .map(function (it, i) {
      return { it: it, i: i, id: it.id };
    })
    .filter(function (o) {
      var it = o.it,
        k = findCat(c, it.categoryId);
      if (f.en === 'on' && !it.enabled) return false;
      if (f.en === 'off' && it.enabled) return false;
      if (f.risk === '_none' && (it.riskIds || []).length) return false;
      if (f.risk && f.risk !== '_none' && (it.riskIds || []).indexOf(f.risk) < 0) return false;
      if (f.cat && it.categoryId !== f.cat) return false;
      if (f.type && it.type !== f.type) return false;
      if (f.tag && tagList(it).indexOf(f.tag) < 0) return false;
      if (
        qq &&
        (it.name + ' ' + (k ? k.name : '') + ' ' + itName(it.type, c) + ' ' + tagList(it).join(' '))
          .toLowerCase()
          .indexOf(qq) < 0
      )
        return false;
      return true;
    });
  if (
    editInit &&
    !list.some(function (o) {
      return o.id === editInit;
    })
  ) {
    var ix = c.initiatives.findIndex(function (x) {
      return x.id === editInit;
    });
    if (ix >= 0) list.unshift({ it: c.initiatives[ix], i: ix, id: editInit });
  }
  var pg = pager(list.length, f.page || 0, 'init');
  f.page = pg.page;
  var nOn = c.initiatives.filter(function (r) {
    return r.enabled;
  }).length;
  var out =
    '<div class="fbar"><div class="rowf">' +
    fld(
      'Search',
      '<input type="search" id="isearch" value="' + esc(f.q) + '" placeholder="Name, category, type or tag">',
      'wide'
    ) +
    fld(
      'Linked risk',
      '<select id="if-risk">' +
        opt('', 'Any', f.risk) +
        opt('_none', 'No linked risk', f.risk) +
        c.risks
          .filter(function (r) {
            return (
              r.enabled ||
              c.initiatives.some(function (x) {
                return (x.riskIds || []).indexOf(r.id) >= 0;
              })
            );
          })
          .map(function (r) {
            return opt(r.id, r.name, f.risk);
          })
          .join('') +
        '</select>'
    ) +
    fld(
      'Tag',
      '<select id="if-tag">' +
        opt('', 'All tags', f.tag) +
        tags
          .map(function (t) {
            return opt(t[0], t[0] + ' (' + t[1] + ')', f.tag);
          })
          .join('') +
        '</select>'
    ) +
    '<button class="btn link" data-act="ifclear">Clear filters</button></div>' +
    chipRow('if', 'en', f.en, [
      ['', 'All', c.initiatives.length],
      ['on', 'Enabled', nOn],
      ['off', 'Disabled', c.initiatives.length - nOn]
    ]) +
    chipRow(
      'if',
      'type',
      f.type,
      [['', 'All types', c.initiatives.length]].concat(
        types.map(function (t) {
          return [
            t[0],
            t[1],
            c.initiatives.filter(function (x) {
              return x.type === t[0];
            }).length
          ];
        })
      )
    ) +
    chipRow(
      'if',
      'cat',
      f.cat,
      [['', 'All categories', c.initiatives.length]].concat(
        c.categories
          .map(function (k) {
            return [
              k.id,
              k.name,
              c.initiatives.filter(function (x) {
                return x.categoryId === k.id;
              }).length
            ];
          })
          .filter(function (x) {
            return x[2];
          })
      )
    ) +
    bulkBar('i', list) +
    '</div>';
  out += '<div class="addbar">' + addBtn('addinit', 'Add initiative') + '</div>';
  var rows = list
    .slice(pg.page * PAGE, (pg.page + 1) * PAGE)
    .map(function (o) {
      var it = o.it,
        i = o.i,
        k = findCat(c, it.categoryId),
        sub =
          k && it.subId
            ? k.subs.filter(function (s) {
                return s.id === it.subId;
              })[0]
            : null,
        use = initUse(it.id),
        p = 'c:initiatives.' + i;
      var pv = num(it.projected),
        ps = k && pv != null ? statusFor(k.indicator, pv) : null;
      var nl = (it.riskIds || []).filter(function (id) {
        return findRisk(c, id);
      }).length;
      var chips =
        '<button class="tg typ t' +
        itIdx(it.type, c) +
        '" data-act="if" data-k="type" data-a="' +
        esc(it.type) +
        '">' +
        esc(itName(it.type, c)) +
        '</button>' +
        (k
          ? '<button class="tg cat" data-act="if" data-k="cat" data-a="' +
            esc(k.id) +
            '">' +
            esc(k.name) +
            (sub ? ', ' + esc(sub.name) : '') +
            '</button>'
          : '<span class="tg warn">No category</span>') +
        (it.due ? '<span class="tg">Due ' + esc(it.due) + '</span>' : '') +
        (k && pv != null
          ? '<span class="tg">Projected ' +
            esc(fmt(pv, k.indicator.unit)) +
            (ps ? ' <span class="sh ' + ps + '" aria-label="' + WL[ps] + '"></span>' : '') +
            '</span>'
          : '') +
        tagList(it)
          .map(function (t) {
            return (
              '<button class="tg" data-act="if" data-k="tag" data-a="' + esc(t) + '">#' + esc(t) + '</button>'
            );
          })
          .join('') +
        (function () {
          var vv = initValue(c, it);
          return vv.ratio != null
            ? '<span class="tg loss" title="Projected avoided loss ' +
                esc(money(vv.avoided)) +
                ' a year for ' +
                esc(money(vv.cost)) +
                '">' +
                esc(ratioTxt(vv.ratio)) +
                '</span>'
            : '';
        })() +
        (nl
          ? '<span class="tg lnk" title="' +
            esc(
              (it.riskIds || [])
                .map(function (id) {
                  var r = findRisk(c, id);
                  return r ? r.name : '';
                })
                .filter(Boolean)
                .join(', ')
            ) +
            '">' +
            nl +
            ' linked risk' +
            (nl > 1 ? 's' : '') +
            '</span>'
          : '') +
        (use.length
          ? '<span class="tg use" title="' +
            esc(use.join(', ')) +
            '">Shown in ' +
            use.length +
            ' quarter' +
            (use.length > 1 ? 's' : '') +
            '</span>'
          : '');
      var open = editInit === it.id,
        subOpts = [['', 'Whole category']].concat(
          k
            ? k.subs.map(function (s) {
                return [s.id, s.name];
              })
            : []
        );
      return (
        '<div class="rrow' +
        (open ? ' open' : '') +
        '">' +
        rowHead('i', it.id, it.enabled, it.name, chips, open, 'editinit') +
        (open
          ? '<div class="redit"><div class="rowf">' +
            fld('Initiative', inp(p + '.name', it.name, 'text', ' data-rr style="width:100%"'), 'wide') +
            '</div><div class="rowf">' +
            fld('Type', sel(p + '.type', types, it.type, true)) +
            fld('Category', sel(p + '.categoryId', catOpts, it.categoryId, true)) +
            fld('Subcategory', sel(p + '.subId', subOpts, it.subId || '', true)) +
            fld(
              'Started',
              inp(
                p + '.start',
                it.start,
                'text',
                ' data-rr placeholder="Q1 2026" style="min-width:0;width:110px"'
              )
            ) +
            fld(
              'Due',
              inp(
                p + '.due',
                it.due,
                'text',
                ' data-rr placeholder="Q2 2027" style="min-width:0;width:110px"'
              )
            ) +
            fld(
              'Projected value' + (k ? ' (' + unitName(k.indicator.unit) + ')' : ''),
              inp(p + '.projected', it.projected, 'number', ' data-rr'),
              '',
              'The value you expect the category indicator to reach once this initiative is delivered.'
            ) +
            (ps ? '<span class="pill ' + ps + '" style="align-self:center">' + WL[ps] + '</span>' : '') +
            '</div><div class="rowf">' +
            fld(
              'Linked risks (optional)',
              linkEditor(c, it, i),
              'wide',
              'Optional. Links let the dashboard highlight related items and calculate avoided loss from the risks\u2019 loss estimates.'
            ) +
            '</div>' +
            valueEditor(c, it, i) +
            '<div class="rowf">' +
            fld(
              'Tags',
              tagEditor(p + '.tags', tagList(it), {
                label: 'Initiative tags',
                placeholder: 'Add tag',
                suggest: allTags(c.initiatives).map(function (t) {
                  return t[0];
                })
              }),
              'wide'
            ) +
            '<div class="tools" style="align-self:flex-end">' +
            delBtn('init:' + it.id, 'Delete', delWarn('init', it.id)) +
            '</div></div></div>'
          : '') +
        '</div>'
      );
    })
    .join('');
  return (
    out +
    '<div class="rlist">' +
    (rows || '<p class="desc" style="padding:14px">No initiatives match these filters.</p>') +
    '</div>' +
    pg.html
  );
}
