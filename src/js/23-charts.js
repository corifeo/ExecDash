/* SVG and CSS charts: gauges, radar, maturity bars, loss trackers and buckets. */

function P(v, max, r) {
  var th = Math.PI * (1 - Math.max(0, Math.min(v, max)) / max);
  return [90 + r * Math.cos(th), 86 - r * Math.sin(th)];
}
function seg(a, b, max, c) {
  a = Math.max(0, Math.min(a, max));
  b = Math.max(0, Math.min(b, max));
  if (b - a <= 0) return '';
  var p1 = P(a, max, 66),
    p2 = P(b, max, 66);
  return (
    '<path d="M ' +
    p1[0].toFixed(1) +
    ' ' +
    p1[1].toFixed(1) +
    ' A 66 66 0 0 1 ' +
    p2[0].toFixed(1) +
    ' ' +
    p2[1].toFixed(1) +
    '" fill="none" stroke="' +
    c +
    '" stroke-opacity="0.45" stroke-width="13"/>'
  );
}
function gaugeMax(ind, v) {
  var m = num(ind.max);
  if (m && m > 0) return m;
  var base = Math.max(+ind.tolerance || 0, +ind.appetite || 0, +ind.target || 0, v || 0);
  if (ind.unit === '%') return Math.min(100, Math.max(10, Math.ceil(base * 1.5)));
  return Math.max(4, Math.ceil(base * 1.5));
}
function bounds(ind) {
  var cnt = ind.unit === 'count',
    a = +ind.appetite,
    t = +ind.tolerance;
  if (ind.direction === 'higher')
    return { order: ['r', 'a', 'g'], b1: cnt ? t - 0.5 : t, b2: cnt ? a - 0.5 : a };
  return { order: ['g', 'a', 'r'], b1: cnt ? a + 0.5 : a, b2: cnt ? t + 0.5 : t };
}
function appetiteGauge(ind, v, name, tipAttr) {
  var max = gaugeMax(ind, v),
    bd = bounds(ind),
    o = bd.order;
  var s = seg(0, bd.b1, max, C[o[0]]) + seg(bd.b1, bd.b2, max, C[o[1]]) + seg(bd.b2, max, max, C[o[2]]);
  var mk = '';
  if (v != null) {
    var m = P(ANIM ? 0 : v, max, 66);
    mk =
      '<circle class="mk" data-v="' +
      v +
      '" data-max="' +
      max +
      '" cx="' +
      m[0].toFixed(1) +
      '" cy="' +
      m[1].toFixed(1) +
      '" r="9" fill="var(--ink)" stroke="var(--card)" stroke-width="3"/>';
  }
  return (
    '<svg class="gauge" tabindex="0" viewBox="0 0 180 100" role="img" aria-label="' +
    esc(name) +
    ': ' +
    esc(fmt(v, ind.unit)) +
    '. ' +
    esc(thrText(ind)) +
    '"' +
    (tipAttr || '') +
    '>' +
    s +
    mk +
    cu(v, ind.unit, 'text', 'v" x="90" y="84" text-anchor="middle') +
    '</svg>'
  );
}
function targetGauge(ind, v, name, tipAttr) {
  var max = gaugeMax(ind, v),
    len = Math.PI * 66,
    arc = 'M 24 86 A 66 66 0 0 1 156 86';
  var a = P(+ind.target, max, 55),
    b = P(+ind.target, max, 77),
    f = v == null ? 0 : Math.max(0, Math.min(v, max)) / max;
  return (
    '<svg class="gauge" tabindex="0" viewBox="0 0 180 104" role="img" aria-label="' +
    esc(name) +
    ': ' +
    esc(fmt(v, ind.unit)) +
    ', target ' +
    esc(fmt(ind.target, ind.unit)) +
    '"' +
    (tipAttr || '') +
    '>' +
    '<path d="' +
    arc +
    '" fill="none" stroke="var(--track)" stroke-width="13"/>' +
    '<path class="tfill" data-f="' +
    f +
    '" data-len="' +
    len +
    '" d="' +
    arc +
    '" fill="none" stroke="var(--accent)" stroke-width="13" stroke-dasharray="' +
    (ANIM ? 0 : len * f).toFixed(1) +
    ' ' +
    len.toFixed(1) +
    '"/>' +
    '<line x1="' +
    a[0].toFixed(1) +
    '" y1="' +
    a[1].toFixed(1) +
    '" x2="' +
    b[0].toFixed(1) +
    '" y2="' +
    b[1].toFixed(1) +
    '" stroke="var(--ink)" stroke-width="2.5"/>' +
    cu(v, ind.unit, 'text', 'v" x="90" y="80" text-anchor="middle') +
    '<text class="tl" x="90" y="102" text-anchor="middle">Target ' +
    esc(fmt(ind.target, ind.unit)) +
    '</text></svg>'
  );
}
function zoneBar(ind, v, tipAttr) {
  var max = gaugeMax(ind, v),
    bd = bounds(ind),
    o = bd.order;
  function pc(x) {
    return Math.max(0, Math.min(100, (x / max) * 100));
  }
  var w1 = pc(bd.b1),
    w2 = pc(bd.b2) - w1,
    w3 = 100 - pc(bd.b2),
    x = v == null ? null : pc(v);
  return (
    '<div class="zbar" tabindex="0" role="img" aria-label="' +
    esc(fmt(v, ind.unit)) +
    '. ' +
    esc(thrText(ind)) +
    '"' +
    (tipAttr || '') +
    '><span class="z ' +
    o[0] +
    '" style="width:' +
    w1 +
    '%"></span><span class="z ' +
    o[1] +
    '" style="width:' +
    w2 +
    '%"></span><span class="z ' +
    o[2] +
    '" style="width:' +
    w3 +
    '%"></span>' +
    (x == null ? '' : '<i class="bm" style="--x:' + x + '%"></i>') +
    '</div>'
  );
}
function targetBar(ind, v, tipAttr) {
  var max = gaugeMax(ind, v),
    f = v == null ? 0 : Math.max(0, Math.min(100, (v / max) * 100)),
    t = Math.max(0, Math.min(100, (+ind.target / max) * 100));
  return (
    '<div class="zbar tb" tabindex="0" role="img" aria-label="' +
    esc(fmt(v, ind.unit)) +
    ', target ' +
    esc(fmt(ind.target, ind.unit)) +
    '"' +
    (tipAttr || '') +
    '><span class="tf" style="--w:' +
    f +
    '%"></span><i class="tt2" style="left:' +
    t +
    '%"></i></div>'
  );
}
function f1(x) {
  return x.toFixed(1);
}
function radar(fns, q, prev, maxS, pl) {
  var n = fns.length;
  if (n < 3) return '<p class="desc">Add at least three functions to draw the chart.</p>';
  var cx = 300,
    cy = 245,
    R = 185;
  function ang(i) {
    return -Math.PI / 2 + (i * 2 * Math.PI) / n;
  }
  function pt(i, v) {
    var a = ang(i);
    return [cx + (Math.cos(a) * R * v) / maxS, cy + (Math.sin(a) * R * v) / maxS];
  }
  function poly(vals) {
    return vals
      .map(function (v, i) {
        return pt(i, v).map(f1).join(',');
      })
      .join(' ');
  }
  var cur = fns.map(function (f) {
      return num(q.maturity.scores[f.id]) || 0;
    }),
    tg = fns.map(function (f) {
      return +f.target || 0;
    });
  var pv = prev
    ? fns.map(function (f) {
        return num(prev.maturity.scores[f.id]);
      })
    : null;
  if (
    pv &&
    pv.every(function (x) {
      return x == null;
    })
  )
    pv = null;
  var s =
    '<defs><radialGradient id="rgcur" cx="' +
    cx +
    '" cy="' +
    cy +
    '" r="' +
    R +
    '" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.10"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:.38"/></radialGradient></defs>';
  var k, i;
  for (k = maxS; k >= 1; k--) {
    s +=
      '<polygon points="' +
      poly(
        fns.map(function () {
          return k;
        })
      ) +
      '" fill="' +
      (k % 2 ? 'var(--paper)' : 'var(--card)') +
      '" stroke="var(--rule)"/>';
  }
  for (k = 1; k <= maxS; k++) {
    var lp = pt(0, k);
    s += '<text class="scl" x="' + f1(lp[0] + 6) + '" y="' + f1(lp[1] + 4) + '">' + k + '</text>';
  }
  for (i = 0; i < n; i++) {
    var p = pt(i, maxS);
    s +=
      '<line class="ax" data-axis="' +
      i +
      '" x1="' +
      cx +
      '" y1="' +
      cy +
      '" x2="' +
      f1(p[0]) +
      '" y2="' +
      f1(p[1]) +
      '"/>';
  }
  if (pv)
    s +=
      '<g class="rg prvg"><polygon class="prv" points="' +
      poly(
        pv.map(function (x) {
          return x || 0;
        })
      ) +
      '"/></g>';
  s += '<polygon class="tgt" points="' + poly(tg) + '"/>';
  s +=
    '<g class="rg curg"><polygon class="cur" points="' +
    poly(cur) +
    '" fill="url(#rgcur)"/>' +
    cur
      .map(function (v, i) {
        var p = pt(i, v);
        return (
          '<circle class="dot" data-axis="' + i + '" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="5.5"/>'
        );
      })
      .join('') +
    '</g>';
  s += tg
    .map(function (v, i) {
      var p = pt(i, v);
      return (
        '<circle class="tdot" data-axis="' + i + '" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="3.5"/>'
      );
    })
    .join('');
  fns.forEach(function (f, i) {
    var a = ang(i),
      c = Math.cos(a),
      sn = Math.sin(a),
      p = pt(i, (maxS * (R + 26)) / R),
      anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle',
      y1,
      y2;
    if (sn < -0.3) {
      y1 = p[1] - 22;
      y2 = p[1];
    } else if (sn > 0.3) {
      y1 = p[1] + 14;
      y2 = p[1] + 36;
    } else {
      y1 = p[1] - 5;
      y2 = p[1] + 17;
    }
    var v = num(q.maturity.scores[f.id]);
    s +=
      '<g class="lab" data-axis="' +
      i +
      '"><text class="ln" x="' +
      f1(p[0]) +
      '" y="' +
      f1(y1) +
      '" text-anchor="' +
      anchor +
      '">' +
      esc(f.name) +
      (q.maturity.notes[f.id] && String(q.maturity.notes[f.id]).trim()
        ? '<tspan class="rnd" dx="4">●</tspan>'
        : '') +
      '</text><text class="lv" x="' +
      f1(p[0]) +
      '" y="' +
      f1(y2) +
      '" text-anchor="' +
      anchor +
      '"><tspan class="lc">' +
      (v == null ? 'No data' : v.toFixed(1)) +
      '</tspan><tspan class="lt"> / ' +
      (+f.target).toFixed(1) +
      '</tspan></text></g>';
  });
  fns.forEach(function (f, i) {
    var h = maxS * 1.3,
      a0 = pt(i - 0.5, h),
      a1 = pt(i, h),
      a2 = pt(i + 0.5, h),
      v = num(q.maturity.scores[f.id]),
      t = +f.target,
      pvv = pv ? pv[i] : null;
    var rows = [
      ['Current', v == null ? 'No data' : v.toFixed(1)],
      ['Target', t.toFixed(1)],
      [
        'Gap to target',
        v == null
          ? 'No data'
          : t - v > 0
            ? (t - v).toFixed(1) + ' below'
            : t - v < 0
              ? (v - t).toFixed(1) + ' above'
              : 'On target'
      ]
    ];
    if (pl) rows.push([pl, pvv == null ? 'No data' : pvv.toFixed(1)]);
    if (pl && pvv != null && v != null) rows.push(['Change', deltaLabel(+(v - pvv).toFixed(2), 'count')]);
    s +=
      '<polygon class="hit" data-axis="' +
      i +
      '" tabindex="0" aria-label="' +
      esc(f.name) +
      '" points="' +
      cx +
      ',' +
      cy +
      ' ' +
      a0.map(f1).join(',') +
      ' ' +
      a1.map(f1).join(',') +
      ' ' +
      a2.map(f1).join(',') +
      '"' +
      tip(tipHtml(f.name, rows, q.maturity.notes[f.id])) +
      '/>';
  });
  return (
    '<svg class="radar" viewBox="-30 -6 660 520" role="img" aria-label="Maturity by function, current against target">' +
    s +
    '</svg>'
  );
}
function lossTracker(bands, res, opts) {
  opts = opts || {};
  if (!bands.length || !res) return '';
  var x = bandPos(bands, res.mean),
    x9 = bandPos(bands, res.p90);
  return (
    '<div class="lbar' +
    (opts.big ? ' big' : '') +
    '"' +
    (opts.tip || '') +
    (opts.tip ? ' tabindex="0"' : '') +
    ' role="img" aria-label="Expected annual loss ' +
    esc(money(res.mean)) +
    ', 1 in 10 year loss ' +
    esc(money(res.p90)) +
    '">' +
    bands
      .map(function (b, i) {
        return (
          '<span class="lz" style="background:' +
          bandCol(i, bands.length) +
          '"' +
          (opts.bandTips
            ? ' tabindex="0"' +
              tip(
                tipHtml(b.name + ' loss', [
                  ['Range a year', esc(bandRange(bands, i))],
                  i === bandIdx(bands, res.mean) ? ['Typical year', esc(money(res.mean))] : null,
                  i === bandIdx(bands, res.p90) ? ['1 in 10 year', esc(money(res.p90))] : null
                ])
              )
            : '') +
          '></span>'
        );
      })
      .join('') +
    '<i class="lw" style="--x:' +
    x +
    '%;--w:' +
    Math.max(0, x9 - x) +
    '%"' +
    (opts.bandTips ? tip(tipHtml('1 in 10 year loss', [['A bad year', esc(money(res.p90))]])) : '') +
    '></i><i class="lm" style="--x:' +
    x +
    '%"' +
    (opts.bandTips ? tip(tipHtml('Typical year', [['Expected loss', esc(money(res.mean))]])) : '') +
    '></i></div>' +
    (opts.labels
      ? '<div class="lbl">' +
        bands
          .map(function (b) {
            return '<span>' + esc(b.name) + '</span>';
          })
          .join('') +
        '</div>'
      : '')
  );
}
function lossBucket(bands, res, opts) {
  opts = opts || {};
  if (!bands.length || !res) return '';
  var n = bands.length,
    i = bandIdx(bands, res.mean),
    j = bandIdx(bands, res.p90);
  return (
    '<div class="lbk' +
    (opts.big ? ' big' : '') +
    '"' +
    (opts.tip || '') +
    (opts.tip ? ' tabindex="0"' : '') +
    ' role="img" aria-label="Expected annual loss: ' +
    esc(bands[i].name) +
    (opts.big ? '. 1 in 10 year loss: ' + esc(bands[j].name) : '') +
    '">' +
    bands
      .map(function (b, k) {
        return (
          '<span class="lb' +
          (k === i ? ' on' : '') +
          (opts.big && k === j && j !== i ? ' tail' : '') +
          (k < i ? ' past' : '') +
          '" style="--c:' +
          bandCol(k, n) +
          ';--i:' +
          k +
          '"></span>'
        );
      })
      .join('') +
    '</div>' +
    (opts.labels
      ? '<div class="lbl">' +
        bands
          .map(function (b, k) {
            return (
              '<span' +
              (k === i || (k === j && opts.big) ? ' class="lon"' : '') +
              '>' +
              esc(b.name) +
              '</span>'
            );
          })
          .join('') +
        '</div>'
      : '')
  );
}
function matBars(fns, q, prev, mx, pl) {
  return (
    '<div class="mbars">' +
    fns
      .map(function (f, i) {
        var v = num(q.maturity.scores[f.id]),
          pv = prev ? num(prev.maturity.scores[f.id]) : null,
          t = +f.target || 0,
          d = v != null && pv != null ? +(v - pv).toFixed(1) : null;
        return (
          '<div class="mbar" tabindex="0" data-axis="' +
          i +
          '"' +
          tip(
            tipHtml(
              f.name,
              [
                ['Current', v == null ? 'No data' : v.toFixed(1)],
                ['Target', t.toFixed(1)],
                pl ? [pl, pv == null ? 'No data' : pv.toFixed(1)] : null,
                d != null ? ['Change', deltaLabel(d, 'count')] : null
              ],
              q.maturity.notes[f.id]
            )
          ) +
          '><span class="mn">' +
          esc(f.name) +
          ndot(q.maturity.notes[f.id]) +
          '</span><span class="mt"><i class="mf' +
          (v != null && v >= t ? ' ok' : '') +
          '" style="--w:' +
          ((v || 0) / mx) * 100 +
          '%"></i>' +
          (pv != null ? '<em class="mp" style="left:' + (pv / mx) * 100 + '%"></em>' : '') +
          '<em class="mtg" style="left:' +
          (t / mx) * 100 +
          '%"></em></span><b>' +
          (v == null ? 'No data' : v.toFixed(1)) +
          '</b><small>/ ' +
          t.toFixed(1) +
          '</small></div>'
        );
      })
      .join('') +
    '<div class="mkey"><span><i></i>Target</span>' +
    (pl ? '<span><i class="p"></i>' + esc(pl) + '</span>' : '') +
    '</div></div>'
  );
}
