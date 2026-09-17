/* Configure, Quarters tab. */

function cfgQuarters() {
  var qs = sortedQs(),
    c = wcfg,
    y = new Date().getFullYear();
  var out =
    '<section class="csec"><h2>Quarters</h2><div class="rowf" style="margin-bottom:14px">' +
    fld(
      'Dashboard opens on',
      sel(
        'c:defaultQuarter',
        [['', 'Latest quarter']].concat(
          qs
            .slice()
            .reverse()
            .map(function (x) {
              return [x.id, x.label];
            })
        ),
        c.defaultQuarter || '',
        true
      )
    ) +
    '</div><p class="hint">Viewers can switch between quarters on the dashboard.</p><div class="tscroll"><table class="ct"><thead><tr><th>Quarter</th><th>Period</th><th></th></tr></thead><tbody>' +
    qs
      .slice()
      .reverse()
      .map(function (x) {
        return (
          '<tr><td>' +
          esc(x.label) +
          (c.defaultQuarter === x.id ? ' <span class="pill on">Default</span>' : '') +
          '</td><td>' +
          esc(x.period || '') +
          '</td><td><div class="tools"><button class="btn" data-act="editq" data-a="' +
          esc(x.id) +
          '">Edit data</button>' +
          delBtn('q:' + x.id, 'Delete') +
          '</div></td></tr>'
        );
      })
      .join('') +
    '</tbody></table></div></section>';
  out +=
    '<section class="csec"><h2>Add a quarter</h2><div class="rowf">' +
    fld('Year', '<input type="number" id="nq-y" value="' + y + '" style="width:100px">') +
    fld(
      'Quarter',
      '<select id="nq-q">' +
        [1, 2, 3, 4]
          .map(function (n) {
            return opt(n, 'Q' + n, Math.floor(new Date().getMonth() / 3) + 1);
          })
          .join('') +
        '</select>'
    ) +
    fld(
      'Start from',
      '<select id="nq-c">' +
        opt('', 'Blank values', '') +
        qs
          .slice()
          .reverse()
          .map(function (x, i) {
            return opt(x.id, 'Copy of ' + x.label, i === 0 ? x.id : '');
          })
          .join('') +
        '</select>',
      '',
      'Copying brings over values, subcategory status, top risks, exposure counts and initiative progress. Status, trends, movement and commentary start fresh.'
    ) +
    addBtn('newq', 'Add quarter') +
    '</div><p class="hint" style="margin-top:10px">Copying brings over values, subcategory status, top risks and initiative progress. Status, trends and movement reset to auto.</p></section>';
  return out;
}
async function newQuarter() {
  var y = parseInt($('#nq-y').value, 10),
    n = parseInt($('#nq-q').value, 10),
    src = $('#nq-c').value;
  if (!y || y < 2000 || y > 2100) {
    msg = 'Enter a valid year.';
    msgErr = true;
    updateBar();
    return;
  }
  var id = y + '-Q' + n;
  if (quarters[id]) {
    msg = 'Q' + n + ' ' + y + ' already exists.';
    msgErr = true;
    updateBar();
    return;
  }
  var doc = { label: 'Q' + n + ' ' + y, period: PERIODS[n], year: y, q: n };
  if (src && quarters[src]) {
    var s = normalizeQ(clone(quarters[src]), wcfg);
    Object.keys(s.categories).forEach(function (k) {
      var e = s.categories[k];
      doc.categories = doc.categories || {};
      doc.categories[k] = {
        value: e.value,
        status: 'auto',
        prev: 'auto',
        trend: { mode: 'auto', value: null },
        subs: e.subs
      };
    });
    doc.maturity = { scores: s.maturity.scores, trend: { mode: 'auto', value: null } };
    doc.topRisks = s.topRisks.map(function (t) {
      return { riskId: t.riskId, rating: t.rating, movement: 'auto' };
    });
    doc.incidents = { counts: {}, regulatory: null, ttc: null, items: [] };
    doc.vulns = {};
    Object.keys(s.vulns || {}).forEach(function (k) {
      doc.vulns[k] = { counts: clone(s.vulns[k].counts), note: '' };
    });
    doc.initiatives = {};
    Object.keys(s.initiatives).forEach(function (k) {
      var e = s.initiatives[k];
      doc.initiatives[k] = {
        include: e.include,
        progress: e.progress,
        status: e.status,
        milestone: e.milestone
      };
    });
  }
  normalizeQ(doc, wcfg);
  try {
    await DB.doc('quarters/' + id).set(doc);
    if (!dirtyQ) {
      editQ = id;
      wq = null;
    }
    msg = doc.label + ' created.';
    msgErr = false;
    renderConfig();
  } catch (e) {
    writeErr(e);
  }
}
async function deleteQuarter(id) {
  try {
    await DB.doc('quarters/' + id).delete();
    if (editQ === id) {
      editQ = null;
      wq = null;
      dirtyQ = false;
    }
    if (selectedQ === id) selectedQ = null;
    if (wcfg && wcfg.defaultQuarter === id) {
      wcfg.defaultQuarter = null;
      dirtyCfg = true;
    }
    msg = 'Quarter deleted.';
    msgErr = false;
    renderConfig();
  } catch (e) {
    writeErr(e);
  }
}
