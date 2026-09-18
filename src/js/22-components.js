/* Reusable dashboard building blocks: chips, counters, tile headers, severity grids, value bars and view toggles. */

function ref(kind, text, opts) {
  opts = opts || {};
  var badge = opts.badge != null ? opts.badge : { cat: 'C', risk: 'R', init: 'I', inc: '!' }[kind];
  return (
    '<' +
    (opts.act ? 'button' : 'span') +
    ' class="ref ref-' +
    kind +
    (opts.cls ? ' ' + opts.cls : '') +
    '"' +
    (opts.act ? ' data-act="' + opts.act + '" data-a="' + esc(opts.a || '') + '"' : '') +
    (opts.title ? ' title="' + esc(opts.title) + '"' : ' title="' + esc(text) + '"') +
    '><b class="rb">' +
    esc(String(badge)) +
    '</b><span class="rt">' +
    esc(text) +
    '</span></' +
    (opts.act ? 'button' : 'span') +
    '>'
  );
}
function attr(text, cls) {
  return '<span class="attr' + (cls ? ' ' + cls : '') + '">' + esc(text) + '</span>';
}
function cu(v, u, tag, cls, cmp) {
  tag = tag || 'span';
  if (v == null) return '<' + tag + (cls ? ' class="' + cls + '"' : '') + '>No data</' + tag + '>';
  var pre = u === '£k' ? '£' : '',
    suf = u === '%' ? '%' : u === 'h' ? 'h' : u === '£k' ? 'k' : '',
    d = decOf(v);
  return (
    '<' +
    tag +
    ' class="cu' +
    (cls ? ' ' + cls : '') +
    '" data-to="' +
    +v +
    '" data-dec="' +
    d +
    '" data-pre="' +
    pre +
    '" data-suf="' +
    suf +
    '"' +
    (cmp ? ' data-cmp="1" title="' + nf(+v, d) + '"' : '') +
    '>' +
    pre +
    (ANIM ? nf(0, d) : nf(+v, d, cmp)) +
    suf +
    '</' +
    tag +
    '>'
  );
}
/* Per-section view preference ('detail' or 'compact'), kept in browser storage.
   Section 3 keeps its original key so existing preferences carry over. */
var VIEW_SECTIONS = [1, 2, 3, 4];
function viewKey(n) {
  return n === 3 ? 'cyberdash:l3view' : 'cyberdash:view' + n;
}
function secView(n) {
  try {
    return localStorage.getItem(viewKey(n)) || 'detail';
  } catch (e) {
    return 'detail';
  }
}
function setSecView(n, v) {
  try {
    localStorage.setItem(viewKey(n), v);
  } catch (e) {}
}
function allViews() {
  var v = VIEW_SECTIONS.map(secView);
  return v.every(function (x) {
    return x === v[0];
  })
    ? v[0]
    : 'mixed';
}
function allViewSeg() {
  var v = allViews();
  return (
    '<div class="seg sm allview" role="group" aria-label="View for all sections"' +
    (v === 'mixed' ? ' title="Sections currently use different views"' : '') +
    '><button data-act="allview" data-a="detail" aria-pressed="' +
    (v === 'detail') +
    '">Detailed</button><button data-act="allview" data-a="compact" aria-pressed="' +
    (v === 'compact') +
    '">Compact</button></div>'
  );
}
/* Apply a view to one section without re-rendering the whole dashboard. */
function applySecView(n, v) {
  setSecView(n, v);
  document.querySelectorAll('[data-act="secview"][data-a="' + n + '"]').forEach(function (x) {
    x.setAttribute('aria-pressed', String(x.dataset.d === v));
  });
  if (n === 3) {
    var body = document.getElementById('l3body');
    if (body && CTX) {
      body.innerHTML = l3Body();
      applyHl(hlStatus);
      runAnims(body);
    }
  } else {
    var vb = document.getElementById('l' + n + 'view');
    if (vb) {
      vb.classList.toggle('cpt', v === 'compact');
      runAnims(vb);
    }
  }
}
function syncAllViewSeg() {
  var v = allViews(),
    g = document.querySelector('.allview');
  if (!g) return;
  g.querySelectorAll('button').forEach(function (x) {
    x.setAttribute('aria-pressed', String(x.dataset.a === v));
  });
  if (v === 'mixed') g.title = 'Sections currently use different views';
  else g.removeAttribute('title');
}
function viewSeg(n) {
  var v = secView(n);
  return (
    '<div class="seg sm" role="group" aria-label="View"><button data-act="secview" data-a="' +
    n +
    '" data-d="detail" aria-pressed="' +
    (v === 'detail') +
    '">Detailed</button><button data-act="secview" data-a="' +
    n +
    '" data-d="compact" aria-pressed="' +
    (v === 'compact') +
    '">Compact</button></div>'
  );
}
function valueRows(v, done) {
  var rows = [
    tsec('Avoided loss and cost', 'good'),
    ['Linked risks with estimates', v.est + ' of ' + v.risks],
    ['Their expected loss', esc(money(v.base)) + ' a year'],
    ['Expected reduction', v.red == null ? 'Not set' : v.red + '%'],
    [
      'Avoided loss',
      v.avoided == null
        ? 'Not available'
        : esc(money(v.avoided)) + ' a year' + (done ? '' : ' when delivered')
    ],
    ['Cost', v.cost == null ? 'Not set' : esc(money(v.cost))],
    v.run ? ['Running cost', esc(money(v.run)) + ' a year'] : null,
    v.run && v.net != null ? ['Net avoided loss', esc(money(v.net)) + ' a year'] : null
  ];
  if (v.ratio != null)
    rows.push(
      ['Avoided loss against cost', esc(ratioTxt(v.ratio))],
      ['Return on security investment', Math.round(v.rosi).toLocaleString('en-GB') + '% in the first year'],
      ['Payback', esc(paybackTxt(v.payback))]
    );
  return rows;
}
function valueBars(avoided, cost, big) {
  if (avoided == null && cost == null) return '';
  var mx = Math.max(avoided || 0, cost || 0, 1);
  return (
    '<div class="vbars' +
    (big ? ' big' : '') +
    '"><div class="vbr"><span class="vbl">Avoided a year</span><span class="vbt"><i class="va" style="--w:' +
    ((avoided || 0) / mx) * 100 +
    '%"></i></span><b>' +
    (avoided == null ? 'No estimate' : esc(money(avoided))) +
    '</b></div>' +
    '<div class="vbr"><span class="vbl">Cost</span><span class="vbt"><i class="vc" style="--w:' +
    ((cost || 0) / mx) * 100 +
    '%"></i></span><b>' +
    (cost == null ? 'Not set' : esc(money(cost))) +
    '</b></div></div>'
  );
}
function valueLine(avoided, cost) {
  var mx = Math.max(avoided || 0, cost || 0, 1);
  return (
    '<span class="vline" aria-hidden="true"><i class="va" style="--w:' +
    ((avoided || 0) / mx) * 100 +
    '%"></i>' +
    (cost != null ? '<em class="vcm" style="left:' + (cost / mx) * 100 + '%" title="Cost"></em>' : '') +
    '</span>'
  );
}
function fairRows(bands, r0, res) {
  var f = r0.fair,
    bi = bandIdx(bands, res.mean);
  return [
    tsec('Loss estimate, FAIR', 'good'),
    ['Loss bucket', esc(bands[bi].name) + ' <span class="tst">' + esc(bandRange(bands, bi)) + '</span>'],
    ['Expected annual loss', esc(money(res.mean))],
    [
      '1 in 10 year loss',
      esc(money(res.p90)) + ' <span class="tst">' + esc(bandName(bands, res.p90)) + '</span>'
    ],
    ['Chance of a loss event', Math.round(res.pEvent * 100) + '% a year'],
    ['Event frequency', esc(freqTxt(+f.fMin)) + ' to ' + esc(freqTxt(+f.fMax))],
    ['Loss per event', esc(money(+f.lMin)) + ' to ' + esc(money(+f.lMax)) + ', likely ' + esc(money(+f.lMl))]
  ];
}
function sevGrid(noun, names, cur, prv, q, pl, opts) {
  opts = opts || {};
  var max = Math.max.apply(
    null,
    names
      .map(function (k) {
        return cur[k] || 0;
      })
      .concat([1])
  );
  var longest = Math.max.apply(
    null,
    names
      .map(function (k) {
        var v = cur[k],
          p = prv ? prv[k] : null,
          pc = pctChange(v, p);
        return Math.max(
          v == null ? 0 : nf(v, 0, true).length,
          pc && pc.dir !== 0 && pc.txt !== 'New' ? pc.txt.length - 1 : 0
        );
      })
      .concat([0])
  );
  return (
    '<div class="sev' +
    (names.length >= 4 || longest >= 7 ? ' sev2' : '') +
    '">' +
    names
      .map(function (k, i) {
        var v = cur[k],
          p = prv ? prv[k] : null,
          pc = pctChange(v, p),
          lim = opts.limit ? opts.limit(k) : null,
          st = lim && v != null ? statusFor(lim, v) : null;
        var rows = [[q.label, v == null ? 'No data' : nf(v, 0) + tst(st)]];
        if (lim)
          rows.push(
            ['Appetite limit', String(lim.appetite)],
            ['Tolerance limit', String(lim.tolerance)],
            headroom(lim, v, st) ? ['Position', esc(headroom(lim, v, st))] : null
          );
        rows.push(pl ? [pl, p == null ? 'No data' : nf(p, 0)] : null, changeRow(v, p));
        var extra = opts.extra ? opts.extra(k) : null;
        if (extra) rows.push(extra);
        return (
          '<div tabindex="0" class="stg' +
          (st ? ' st-' + st : '') +
          '" style="--i:' +
          i +
          '"' +
          tip(tipHtml(k + ' ' + noun, rows, opts.note ? opts.note(k) : '')) +
          '><span class="shd"><i class="vs s' +
          i +
          '"></i>' +
          esc(k) +
          '</span><span class="cnt2">' +
          cu(v, 'count', 'b', '', true) +
          (st ? '<span class="stb sh ' + st + '" role="img" aria-label="' + WL[st] + '"></span>' : '') +
          '</span>' +
          (pc ? pctHtml(pc, { tag: 'em', base: 'dl' }) : '<em class="dl">&nbsp;</em>') +
          '<i class="sv s' +
          i +
          '" style="--w:' +
          ((v || 0) / max) * 100 +
          '%"></i></div>'
        );
      })
      .join('') +
    '</div>'
  );
}
function tileHead(name, note, sub, right) {
  return (
    '<div class="head"><div><p class="name">' +
    esc(name) +
    ndot(note) +
    '</p>' +
    (sub ? '<p class="desc">' + esc(sub) + '</p>' : '') +
    '</div>' +
    (right || '') +
    '</div>'
  );
}
function totalLine(tot, ptot, pl, label, tipAttr) {
  var pc = pctChange(tot, ptot);
  return (
    '<p class="value" tabindex="0"' +
    tipAttr +
    '>' +
    cu(tot, 'count', 'span', '', tot != null && tot >= 1e6) +
    ' <small>' +
    esc(label) +
    '</small>' +
    (pc
      ? pctHtml(pc, { tag: 'span', base: 'vd' }, pc.dir !== 0 && pc.txt !== 'New' ? ' since ' + esc(pl) : '')
      : '') +
    '</p>'
  );
}
