/* Timeline view: delivery gantt, linked risk detail and the cumulative cost against avoided loss. */

// Quarter strings on initiatives are free text such as "Q2 2026". Unparseable values are ignored.
function qIdx(s) {
  var m = /^\s*Q([1-4])\s+(\d{4})\s*$/.exec(str(s));
  return m ? +m[2] * 4 + +m[1] - 1 : null;
}
function qLbl(n) {
  return 'Q' + ((n % 4) + 1) + ' ' + Math.floor(n / 4);
}
function qLblShort(n) {
  return 'Q' + ((n % 4) + 1);
}
function qYear(n) {
  return String(Math.floor(n / 4));
}
// One row per initiative in the quarter, with its window, progress and value.
function tlRows(cfg, q) {
  return activeInits(cfg, q)
    .map(function (it) {
      var e = q.initiatives[it.id] || {},
        s = qIdx(it.start),
        d = qIdx(it.due);
      return {
        it: it,
        s: s,
        d: d,
        dated: s != null && d != null && d >= s,
        prog: num(e.progress),
        status: e.status || 'ns',
        milestone: e.milestone,
        note: e.note,
        val: initValue(cfg, it)
      };
    })
    .sort(function (a, b) {
      if (a.dated !== b.dated) return a.dated ? -1 : 1;
      return a.d - b.d || a.s - b.s;
    });
}
// Money out when a cost falls, then avoided loss less running cost each quarter after delivery.
function tlSeries(rows, from, to) {
  var out = [],
    cum = 0;
  for (var k = from; k <= to; k++) {
    var cost = 0,
      run = 0,
      ben = 0;
    rows.forEach(function (r) {
      if (!r.dated) return;
      if (r.s === k && num(r.it.cost) != null) cost += +r.it.cost;
      if (k > r.d) {
        run += (num(r.it.runCost) || 0) / 4;
        if (r.val.avoided != null) ben += r.val.avoided / 4;
      }
    });
    cum += ben - cost - run;
    out.push({ q: k, cost: cost, run: run, ben: ben, cum: cum });
  }
  return out;
}
function tlRange() {
  try {
    return localStorage.getItem(SK + 'tlrange') || 'all';
  } catch (e) {
    return 'all';
  }
}
function setTlRange(v) {
  tlRangeV = v;
  try {
    localStorage.setItem(SK + 'tlrange', v);
  } catch (e) {}
}
function tlView() {
  try {
    return localStorage.getItem(SK + 'tlview') === 'compact' ? 'compact' : 'detail';
  } catch (e) {
    return 'detail';
  }
}
function tlRiskRows(cfg, r) {
  var ids = r.it.riskIds || [],
    red = num(r.it.reduction);
  if (!ids.length) return '<p class="fq">No risks linked. Avoided loss needs at least one linked risk.</p>';
  var tops = (CTX && CTX.q ? CTX.q.topRisks || [] : []).map(function (t) {
    return t.riskId;
  });
  return ids
    .map(function (id) {
      var rk = findRisk(cfg, id);
      if (!rk) return '';
      var c = findCat(cfg, rk.categoryId),
        sm = simRisk(rk),
        ti = tops.indexOf(id),
        cut = sm && red != null ? (sm.mean * red) / 100 : null;
      return (
        '<div class="grisk"><span class="grn">' +
        ref('risk', rk.name, { badge: ti >= 0 ? ti + 1 : 'R', cls: ti >= 0 ? 'top' : '' }) +
        (c ? attr(c.name) : '') +
        '</span><span class="grv"><b>' +
        (sm ? esc(money(sm.mean)) : 'No estimate') +
        '</b><small>' +
        (sm ? 'expected loss a year' : 'add one in the risk register') +
        '</small></span><span class="grv good"><b>' +
        (cut == null ? '&ndash;' : '−' + esc(money(cut))) +
        '</b><small>' +
        (red == null ? 'no reduction set' : red + '% removed') +
        '</small></span></div>'
      );
    })
    .join('');
}
function tlDetail(cfg, r) {
  var v = r.val,
    win = r.dated ? qLbl(r.s) + ' to ' + qLbl(r.d) : 'No dates set';
  var rows =
    '<div class="gdrow"><span>Window</span><b>' +
    esc(win) +
    '</b></div>' +
    (r.milestone
      ? '<div class="gdrow"><span>Next milestone</span><b>' + esc(r.milestone) + '</b></div>'
      : '') +
    '<div class="gdrow"><span>Delivery</span><b>' +
    esc(dsName(r.status)) +
    ', ' +
    (r.prog == null ? 'no progress' : r.prog + '%') +
    '</b></div>' +
    '<div class="gdrow"><span>Cost</span><b>' +
    (num(r.it.cost) == null ? 'Not set' : esc(money(r.it.cost))) +
    (v.run ? ' and ' + esc(money(v.run)) + ' a year' : '') +
    '</b></div>' +
    (v.payback != null
      ? '<div class="gdrow"><span>Payback</span><b>' + esc(paybackTxt(v.payback)) + '</b></div>'
      : '');
  return (
    '<div class="gdet"><div class="gdcol"><span class="al">Linked risks</span>' +
    tlRiskRows(cfg, r) +
    '</div><div class="gdcol gdside"><span class="al">Delivery and cost</span>' +
    rows +
    (r.note ? '<div class="gdnote"><span class="al">Commentary</span>' + esc(r.note) + '</div>' : '') +
    '</div></div>'
  );
}
function tlGantt(cfg, rows, from, to) {
  var span = to - from + 1;
  var head =
    '<div class="ghead" aria-hidden="true"><span>Initiative</span><span class="gaxis">' +
    (function () {
      var out = '';
      for (var k = from; k <= to; k++)
        out +=
          '<i' +
          (k === CTXQ ? ' class="now"' : '') +
          '><b>' +
          qLblShort(k) +
          '</b><u>' +
          qYear(k) +
          '</u></i>';
      return out;
    })() +
    '</span><span class="gval">Avoided a year</span><span></span></div>';
  var body = rows
    .map(function (r) {
      var it = r.it,
        v = r.val,
        open = !!tlOpen[it.id],
        prog = r.prog == null ? 0 : r.prog;
      var bar = r.dated
        ? '<i class="gbar ' +
          esc(r.status) +
          (prog >= 35 ? ' inb' : '') +
          '" style="--s:' +
          ((Math.max(from, r.s) - from) / span) * 100 +
          '%;--w:' +
          ((Math.min(to, r.d) - Math.max(from, r.s) + 1) / span) * 100 +
          '%"><b style="width:' +
          prog +
          '%"></b><em>' +
          prog +
          '%</em></i>'
        : '';
      return (
        '<div class="grow' +
        (open ? ' open' : '') +
        '" data-tlrow="' +
        esc(it.id) +
        '" data-itype="' +
        esc(it.type) +
        '" tabindex="0">' +
        '<span class="gname"><span class="nm">' +
        esc(it.name) +
        '</span>' +
        ndot(r.note) +
        '<span class="attr ity t' +
        itIdx(it.type, cfg) +
        '">' +
        esc(itName(it.type, cfg)) +
        '</span></span>' +
        '<span class="gwin">' +
        (r.dated ? esc(qLbl(r.s) + ' to ' + qLbl(r.d)) : 'No dates set') +
        '<b>' +
        (r.prog == null ? '' : prog + '%') +
        '</b></span>' +
        '<span class="gtrack"><i class="gnowline" aria-hidden="true"></i>' +
        bar +
        '</span>' +
        '<span class="gval">' +
        (v.net == null
          ? '<span class="al">No estimate</span>'
          : '<b>' +
            esc(money(v.net)) +
            '</b><small>' +
            (v.ratio != null ? esc(ratioTxt(v.ratio)) : '') +
            '</small>') +
        '</span>' +
        '<button class="iexp" data-act="tlexp" data-a="' +
        esc(it.id) +
        '" aria-expanded="' +
        open +
        '" aria-label="Details for ' +
        esc(it.name) +
        '"></button>' +
        tlDetail(cfg, r) +
        '</div>'
      );
    })
    .join('');
  return (
    '<div class="gantt" style="--qw:' +
    (100 / span).toFixed(4) +
    '%;--nowx:' +
    (((Math.min(Math.max(CTXQ, from), to) - from + 0.5) / span) * 100).toFixed(3) +
    '%">' +
    head +
    body +
    '</div>'
  );
}
function tlChart(series, beIdx) {
  var W = 1180,
    PADL = 60,
    PADR = 30,
    HA = 190,
    HB = 96,
    PADT = 34,
    GAP = 40,
    PADB = 40;
  var cums = series.map(function (x) {
    return x.cum;
  });
  var loA = Math.min.apply(null, cums.concat([0])),
    hiA = Math.max.apply(null, cums.concat([0])),
    spanA = hiA - loA || 1,
    plotA = HA - PADT - 8;
  var flows = series.map(function (x) {
    return [-(x.cost + x.run), x.ben];
  });
  var loB = Math.min.apply(
      null,
      flows
        .map(function (f) {
          return f[0];
        })
        .concat([0])
    ),
    hiB = Math.max.apply(
      null,
      flows
        .map(function (f) {
          return f[1];
        })
        .concat([0])
    ),
    spanB = hiB - loB || 1;
  var topB = HA + GAP,
    H = topB + HB + PADB;
  var n = series.length,
    step = n > 1 ? (W - PADL - PADR) / (n - 1) : 0;
  var x = function (i) {
      return PADL + i * step;
    },
    ya = function (v) {
      return PADT + plotA * (1 - (v - loA) / spanA);
    },
    yb = function (v) {
      return topB + HB * (1 - (v - loB) / spanB);
    };
  var line = series
    .map(function (p, i) {
      return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + ya(p.cum).toFixed(1);
    })
    .join(' ');
  var zeroA = ya(0),
    zeroB = yb(0);
  var bw = Math.max(3, step * 0.34);
  var bars = series
    .map(function (p, i) {
      var out = '',
        o = -(p.cost + p.run);
      if (o)
        out +=
          '<rect class="qcost" x="' +
          (x(i) - bw / 2).toFixed(1) +
          '" y="' +
          zeroB.toFixed(1) +
          '" width="' +
          bw.toFixed(1) +
          '" height="' +
          (yb(o) - zeroB).toFixed(1) +
          '"></rect>';
      if (p.ben)
        out +=
          '<rect class="qben" x="' +
          (x(i) - bw / 2).toFixed(1) +
          '" y="' +
          yb(p.ben).toFixed(1) +
          '" width="' +
          bw.toFixed(1) +
          '" height="' +
          (zeroB - yb(p.ben)).toFixed(1) +
          '"></rect>';
      return out;
    })
    .join('');
  var marks = '';
  var nowI = series
    .map(function (p) {
      return p.q;
    })
    .indexOf(CTXQ);
  [
    [nowI, 'Now', 'nowline'],
    [beIdx, beIdx >= 0 ? 'Breaks even ' + qLbl(series[beIdx] ? series[beIdx].q : 0) : '', 'beline']
  ].forEach(function (m) {
    if (m[0] < 0) return;
    marks +=
      '<line class="' +
      m[2] +
      '" x1="' +
      x(m[0]).toFixed(1) +
      '" x2="' +
      x(m[0]).toFixed(1) +
      '" y1="' +
      (PADT - 14) +
      '" y2="' +
      (topB + HB).toFixed(1) +
      '"></line><text class="' +
      m[2] +
      'lab" x="' +
      (x(m[0]) + 6).toFixed(1) +
      '" y="' +
      (PADT - 20) +
      '">' +
      esc(m[1]) +
      '</text>';
  });
  var labels = series
    .map(function (p, i) {
      var cls = p.q === CTXQ ? ' now' : '';
      return (
        '<text class="qlab' +
        cls +
        '" x="' +
        x(i).toFixed(1) +
        '" y="' +
        (H - 24) +
        '">' +
        qLblShort(p.q) +
        '</text><text class="qlab yr' +
        cls +
        '" x="' +
        x(i).toFixed(1) +
        '" y="' +
        (H - 9) +
        '">' +
        qYear(p.q) +
        '</text>'
      );
    })
    .join('');
  return (
    '<svg class="cumchart" viewBox="0 0 ' +
    W +
    ' ' +
    H +
    '" role="img" aria-label="Cumulative position and quarterly flows">' +
    '<text class="ax pt" x="' +
    (PADL - 8) +
    '" y="' +
    (ya(hiA) + 4).toFixed(1) +
    '" text-anchor="end">' +
    esc(money(hiA)) +
    '</text><text class="ax" x="' +
    (PADL - 8) +
    '" y="' +
    (zeroA + 4).toFixed(1) +
    '" text-anchor="end">0</text><text class="ax pt" x="' +
    (PADL - 8) +
    '" y="' +
    (ya(loA) + 4).toFixed(1) +
    '" text-anchor="end">' +
    esc(money(loA)) +
    '</text>' +
    '<text class="ax pt" x="' +
    (PADL - 8) +
    '" y="' +
    (yb(hiB) + 4).toFixed(1) +
    '" text-anchor="end">' +
    esc(money(hiB)) +
    '</text><text class="ax pt" x="' +
    (PADL - 8) +
    '" y="' +
    (yb(loB) + 4).toFixed(1) +
    '" text-anchor="end">' +
    esc(money(loB)) +
    '</text>' +
    '<text class="plab" x="0" y="' +
    (PADT - 20) +
    '">Cumulative</text><text class="plab" x="0" y="' +
    (topB - 16).toFixed(1) +
    '">Each quarter</text>' +
    '<line class="grid" x1="' +
    PADL +
    '" x2="' +
    (W - PADR) +
    '" y1="' +
    zeroA.toFixed(1) +
    '" y2="' +
    zeroA.toFixed(1) +
    '"></line>' +
    marks +
    '<path class="cumarea" d="' +
    line +
    ' L' +
    x(n - 1).toFixed(1) +
    ' ' +
    zeroA.toFixed(1) +
    ' L' +
    PADL +
    ' ' +
    zeroA.toFixed(1) +
    ' Z"></path><path class="cumline" d="' +
    line +
    '"></path>' +
    bars +
    '<line class="grid" x1="' +
    PADL +
    '" x2="' +
    (W - PADR) +
    '" y1="' +
    zeroB.toFixed(1) +
    '" y2="' +
    zeroB.toFixed(1) +
    '"></line>' +
    labels +
    '</svg>'
  );
}
var CTXQ = 0;
function renderTimeline() {
  var el = $('#tl');
  if (!config || !selectedQ || !quarters[selectedQ]) {
    el.innerHTML = '<p class="empty">No quarter selected. Add one under Configure, Quarters.</p>';
    return;
  }
  TIPS = [];
  var cfg = config,
    q = normalizeQ(clone(quarters[selectedQ]), cfg);
  CTX = { cfg: cfg, q: q };
  CTXQ = q.year * 4 + q.q - 1;
  var rows = tlRows(cfg, q),
    dated = rows.filter(function (r) {
      return r.dated;
    });
  var cpt = tlView() === 'compact';
  if (!rows.length) {
    el.innerHTML =
      '<div class="tlmain"><p class="empty">No initiatives in this quarter. Add them under Configure, Risks and initiatives.</p></div>';
    return;
  }
  // Window: every dated initiative, then a year past the last delivery for the payback to show.
  var from = dated.length
      ? Math.min.apply(
          null,
          dated.map(function (r) {
            return r.s;
          })
        )
      : CTXQ,
    lastDue = dated.length
      ? Math.max.apply(
          null,
          dated.map(function (r) {
            return r.d;
          })
        )
      : CTXQ,
    to = lastDue + 4;
  from = Math.min(from, CTXQ);
  // Shorter ranges sit around the current quarter, not just trimmed at the end.
  if (tlRangeV === '1y') {
    from = Math.max(from, CTXQ - 2);
    to = Math.min(to, CTXQ + 4);
  }
  if (tlRangeV === '3y') {
    from = Math.max(from, CTXQ - 4);
    to = Math.min(to, CTXQ + 8);
  }
  to = Math.max(to, CTXQ + 1);
  var series = tlSeries(rows, from, to),
    beIdx = -1;
  for (var i = 0; i < series.length; i++)
    if (series[i].cum > 0) {
      beIdx = i;
      break;
    }
  var totNet = 0,
    totRun = 0,
    totCost = 0,
    doneNet = 0,
    nDone = 0,
    spent = 0;
  rows.forEach(function (r) {
    if (r.val.net != null) totNet += r.val.net;
    totRun += r.val.run || 0;
    totCost += num(r.it.cost) || 0;
    if (r.status === 'done') {
      nDone++;
      if (r.val.net != null) doneNet += r.val.net;
    }
    if (!r.dated || r.s <= CTXQ) spent += num(r.it.cost) || 0;
  });
  var low = series.reduce(
    function (a, b) {
      return b.cum < a.cum ? b : a;
    },
    series[0] || { cum: 0, q: CTXQ }
  );
  var stat = function (v, lab, sub, cls) {
    return (
      '<div class="fstat' +
      (cls ? ' ' + cls : '') +
      '"><b>' +
      v +
      '</b><span>' +
      lab +
      '</span>' +
      (sub ? '<em>' + sub + '</em>' : '') +
      '</div>'
    );
  };
  var seg = function (act, cur, opts) {
    return (
      '<span class="seg">' +
      opts
        .map(function (o) {
          return (
            '<button data-act="' +
            act +
            '" data-a="' +
            o[0] +
            '" aria-pressed="' +
            (cur === o[0]) +
            '">' +
            esc(o[1]) +
            '</button>'
          );
        })
        .join('') +
      '</span>'
    );
  };
  var types = itypes(cfg);
  el.innerHTML =
    '<div class="tlmain' +
    (cpt ? ' cpt' : '') +
    '"><div class="tlhead"><div><h2>Delivery timeline</h2><p class="desc">When does each initiative land, and when does the programme pay for itself?</p></div>' +
    '<div class="tlctl">' +
    '<span class="ctlgrp"><span class="al">Range</span>' +
    seg('tlrange', tlRangeV, [
      ['all', 'All'],
      ['3y', '3 years'],
      ['1y', '1 year']
    ]) +
    '</span>' +
    (types.length > 1
      ? '<span class="ctlgrp"><span class="al">Highlight</span><span class="hlchips">' +
        [['', 'All']]
          .concat(types)
          .map(function (o) {
            return (
              '<button class="chip" data-act="ifilter" data-a="' +
              o[0] +
              '" aria-pressed="' +
              (initFilter === o[0]) +
              '">' +
              esc(o[1]) +
              '</button>'
            );
          })
          .join('') +
        '</span></span>'
      : '') +
    '<span class="ctlgrp"><span class="al">View</span>' +
    seg('tlview', cpt ? 'compact' : 'detail', [
      ['detail', 'Detailed'],
      ['compact', 'Compact']
    ]) +
    '</span></div></div>' +
    '<div class="fstats tlsum">' +
    stat(
      totNet ? esc(money(totNet)) : '&ndash;',
      'a year avoided once all land',
      totRun ? 'Net of ' + esc(money(totRun)) + ' a year to run' : 'No running costs',
      'on'
    ) +
    stat(esc(money(doneNet)), 'a year avoided already', nDone + ' of ' + rows.length + ' complete') +
    stat(esc(money(spent)), 'spent so far', 'of ' + esc(money(totCost)) + ' committed') +
    stat(
      beIdx >= 0 ? esc(qLbl(series[beIdx].q)) : 'Not yet',
      'programme breaks even',
      beIdx >= 0 ? plural(series[beIdx].q - CTXQ, 'quarter') + ' from now' : 'on these estimates'
    ) +
    stat(
      totCost ? (totNet / totCost).toFixed(1) + '×' : '&ndash;',
      'avoided loss against cost',
      'Across all ' + rows.length
    ) +
    stat(
      dated.length ? esc(qLbl(lastDue)) : '&ndash;',
      'last initiative lands',
      dated.length
        ? esc(
            (
              dated.filter(function (r) {
                return r.d === lastDue;
              })[0] || {}
            ).it.name
          )
        : 'No dates set'
    ) +
    '</div>' +
    '<article class="tile"><div class="tilehead"><h3>Delivery and avoided loss</h3><p class="desc">' +
    plural(rows.length, 'initiative') +
    ', by due date.' +
    (cpt ? '' : ' Open a row for its linked risks and delivery detail.') +
    '</p></div>' +
    tlGantt(cfg, rows, from, to) +
    '</article>' +
    '<article class="tile"><div class="tilehead"><h3>Cumulative position</h3><p class="desc">Money out when costs fall, then avoided loss less running costs each quarter after delivery</p></div>' +
    '<div class="chartscroll">' +
    tlChart(series, beIdx) +
    '</div><div class="lkey"><span><i class="k5"></i>Cost in the quarter</span><span><i class="k6"></i>Avoided loss in the quarter, after running costs</span><span><i class="k7"></i>Cumulative position</span></div>' +
    '<p class="al">Deepest point ' +
    esc(money(Math.abs(Math.min(0, low.cum)))) +
    ' out in ' +
    esc(qLbl(low.q)) +
    '. Avoided loss counts only once an initiative is complete. A year of avoided loss is spread evenly across four quarters, as are running costs.</p></article></div>';
  applyInitFilter();
}
