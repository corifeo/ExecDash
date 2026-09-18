/* Section 4, Ongoing initiatives. */

function initRow(cfg, q, prev, pl, it, i) {
  var e = q.initiatives[it.id],
    inote = e.note,
    val0 = initValue(cfg, it),
    c = findCat(cfg, it.categoryId),
    sub =
      c && it.subId
        ? c.subs.filter(function (s) {
            return s.id === it.subId;
          })[0]
        : null;
  var pe = prev && prev.initiatives ? prev.initiatives[it.id] : null,
    pp = pe && pe.include ? num(pe.progress) : null,
    p = num(e.progress);
  var ind = c ? c.indicator : null,
    cv = c ? num(catEntry(q, c).value) : null,
    cs = c ? catStatus(q, c) : null,
    pv = num(it.projected),
    ps = ind && pv != null ? statusFor(ind, pv) : null;
  var rows = [
    tsec('Initiative'),
    ['Type', esc(itName(it.type, cfg))],
    ['Area', esc(c ? c.name : 'None') + (sub ? ', ' + esc(sub.name) : '')],
    it.start ? ['Started', esc(it.start)] : null,
    it.due ? ['Due', esc(it.due)] : null,
    tsec('Delivery'),
    ['Progress', p == null ? 'No data' : p + '%'],
    pl ? [pl, pp == null ? 'No data' : pp + '%'] : null,
    pl && p != null && pp != null ? ['Change', deltaLabel(p - pp, '%')] : null,
    ['Delivery', esc(dsName(e.status))],
    c ? tsec('Indicator') : null,
    c ? ['Current value', esc(fmt(cv, ind.unit)) + tst(cs)] : null,
    c && pv != null ? ['Projected value', esc(fmt(pv, ind.unit)) + tst(ps)] : null,
    c ? ['Indicator', esc(ind.desc)] : null,
    e.milestone ? ['Next milestone', esc(e.milestone)] : null
  ];
  var lr = (it.riskIds || [])
      .map(function (id) {
        return findRisk(cfg, id);
      })
      .filter(Boolean),
    topIds = q.topRisks.map(function (t) {
      return t.riskId;
    });
  if (lr.length)
    rows.push(tsec('Linked risks'), [
      'Risks',
      lr
        .map(function (r) {
          return (
            esc(r.name) +
            (topIds.indexOf(r.id) >= 0
              ? ' <span class="tst">Top ' + (topIds.indexOf(r.id) + 1) + '</span>'
              : '')
          );
        })
        .join('<br>')
    ]);
  var lim = ind
    ? isTarget(ind)
      ? 'target ' + fmt(ind.target, ind.unit)
      : 'appetite ' + fmt(ind.appetite, ind.unit)
    : '';
  var val = initValue(cfg, it),
    done = e.status === 'done';
  var valTip = tip(
    tipHtml(
      (done ? 'Delivered value: ' : 'Projected value: ') + it.name,
      valueRows(val, done),
      AVOID_NOTE,
      'About this figure'
    )
  );
  var roi =
    val.avoided != null || val.cost != null
      ? '<div class="ival" tabindex="0"' +
        valTip +
        '>' +
        '<span class="ivtop">' +
        (val.avoided == null
          ? '<span class="al">No estimate</span>'
          : '<b class="ivsum">' +
            esc(money(val.avoided)) +
            '<small> a year ' +
            (done ? 'avoided' : 'when done') +
            '</small></b>') +
        (val.ratio != null
          ? '<b class="rratio' + (val.ratio < 1 ? ' low' : '') + '">' + esc(ratioTxt(val.ratio)) + '</b>'
          : '') +
        '</span>' +
        valueLine(val.avoided, val.cost) +
        '</div>'
      : '<div class="ival"><span class="al">No estimate</span></div>';
  var impact =
    c && pv != null
      ? '<div class="proj"><span class="al">' +
        esc(c.name + ': ' + ind.desc) +
        '</span><span class="pline" title="' +
        esc(ps ? 'Lands ' + WL[ps].toLowerCase() + (lim ? ', ' + lim : '') : 'Projected') +
        '"><span class="pvals"><b class="pcn" title="' +
        esc(c.name) +
        '">' +
        esc(c.name) +
        '</b><span class="sh ' +
        (cs || '') +
        '" aria-hidden="true"></span>' +
        esc(fmt(cv, ind.unit)) +
        '<small>now</small><span class="arr" aria-hidden="true"></span><span class="sh ' +
        (ps || '') +
        '" aria-hidden="true"></span>' +
        esc(fmt(pv, ind.unit)) +
        '<small>' +
        (it.due ? 'by ' + esc(it.due) : 'projected') +
        '</small></span><span class="plands">' +
        esc(ps ? 'Lands ' + WL[ps].toLowerCase() + (lim ? ', ' + lim : '') : 'Projected') +
        '</span></span></div>'
      : '<div class="proj"><span class="al">No projection set</span></div>';
  // Expanded: where the avoided loss comes from, not a repeat of the row bar.
  var vfig = function (lab, v, cls) {
    return '<div class="vfig"><span>' + lab + '</span><b' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</b></div>';
  };
  var vbar =
    val.avoided != null || val.cost != null
      ? '<div class="idetv">' +
        vfig(
          'Expected loss now',
          val.est ? esc(money(val.base)) + ' a year' : 'No estimate'
        ) +
        vfig(
          done ? 'Since delivery' : 'After delivery',
          val.avoided == null
            ? 'Not available'
            : esc(money(val.base - val.avoided)) + ' a year',
          'good'
        ) +
        vfig(
          'Cost',
          (val.cost == null ? 'Not set' : esc(money(val.cost))) +
            (val.payback != null ? ', back in ' + esc(paybackTxt(val.payback).toLowerCase()) : '')
        ) +
        '</div>'
      : '';
  var isOpen = !!initOpen[it.id];
  var toggle =
    '<button class="iexp" data-act="iexp" data-a="' +
    esc(it.id) +
    '" aria-expanded="' +
    isOpen +
    '" aria-label="Details for ' +
    esc(it.name) +
    '"></button>';
  return (
    '<div class="init stg' +
    (isOpen ? ' open' : '') +
    '" tabindex="0" style="--i:' +
    i +
    '" data-itype="' +
    esc(it.type) +
    '"' +
    (lr.length
      ? ' data-risks="' +
        esc(
          lr
            .map(function (r) {
              return r.id;
            })
            .join(' ')
        ) +
        '"'
      : '') +
    (c ? ' data-link="' + esc(c.id) + '"' : '') +
    tip(tipHtml(it.name, rows, inote)) +
    '>' +
    '<div class="imain"><div class="rn"><span class="nm">' +
    esc(it.name) +
    '</span>' +
    ndot(inote) +
    ' <span class="attr ity t' +
    itIdx(it.type, cfg) +
    '">' +
    esc(itName(it.type, cfg)) +
    '</span></div><div class="ro">' +
    (lr.length
      ? '<span class="rlc" title="Linked risks">' +
        lr.length +
        ' risk' +
        (lr.length > 1 ? 's' : '') +
        '</span>'
      : '') +
    (val0.ratio != null
      ? '<span class="rlc roic" title="Avoided loss against cost">' + esc(ratioTxt(val0.ratio)) + '</span>'
      : '') +
    '</div></div>' +
    impact +
    vbar +
    '<div class="idet">' +
    (c || lr.length
      ? '<div class="ilinks">' +
        (c ? ref('cat', c.name + (sub ? ', ' + sub.name : '')) : '') +
        lr
          .map(function (r) {
            var ti = topIds.indexOf(r.id);
            return ref('risk', r.name, {
              badge: ti >= 0 ? ti + 1 : 'R',
              cls: ti >= 0 ? 'top' : '',
              title: (ti >= 0 ? 'Top risk ' + (ti + 1) + ': ' : '') + r.name
            });
          })
          .join('') +
        '</div>'
      : '') +
    '</div>' +
    '<div class="iprog"><div class="pbar"><span class="pf" style="--w:' +
    (p || 0) +
    '%"></span>' +
    (pp != null ? '<i class="pp" style="left:' + pp + '%"></i>' : '') +
    '</div>' +
    (p == null ? '<span class="al">n/a</span>' : cu(p, '%', 'span', 'pct')) +
    '</div>' +
    roi +
    '<div class="ids"><span class="ds ' +
    esc(e.status) +
    '">' +
    esc(dsName(e.status)) +
    '</span></div>' +
    toggle +
    '</div>'
  );
}
function layer4(cfg, q, prev, pl) {
  var list = activeInits(cfg, q);
  var ctl =
    '<div class="rctl">' +
    viewSeg(4) +
    '<div class="hlchips" role="group" aria-label="Highlight by type"><span class="al">Highlight</span>' +
    [['', 'All']]
      .concat(itypes(cfg))
      .map(function (o) {
        return (
          '<button class="chip" data-act="ifilter" data-a="' +
          o[0] +
          '" aria-pressed="' +
          (initFilter === o[0]) +
          '">' +
          o[1] +
          '</button>'
        );
      })
      .join('') +
    '</div></div>';
  if (!list.length)
    return band(
      4,
      'Ongoing initiatives',
      'What is reducing the risk?',
      '<p class="desc">No initiatives recorded for this quarter.</p>',
      '',
      'No initiatives recorded.'
    );
  var dc = {};
  list.forEach(function (it) {
    var s = q.initiatives[it.id].status;
    dc[s] = (dc[s] || 0) + 1;
  });
  var strip =
    '<div class="dstrip">' +
    DS.filter(function (d) {
      return dc[d[0]];
    })
      .map(function (d) {
        return (
          '<span class="dsc" tabindex="0"' +
          tip(tipHtml(d[1], [['Initiatives', String(dc[d[0]])]])) +
          '><span class="ds ' +
          d[0] +
          '">' +
          d[1] +
          '</span><b>' +
          cu(dc[d[0]], 'count') +
          '</b></span>'
        );
      })
      .join('') +
    '</div>';
  var pvv = portfolioValue(cfg, list);
  var roiSum =
    pvv.avoided != null || pvv.cost != null
      ? '<div class="roisum" tabindex="0"' +
        tip(
          tipHtml(
            'Projected value of these initiatives',
            [
              ['Risks with estimates', String(pvv.risks)],
              ['Their expected loss', esc(money(pvv.base)) + ' a year'],
              [
                'Avoided loss when delivered',
                pvv.avoided == null ? 'Not available' : esc(money(pvv.avoided)) + ' a year'
              ],
              ['Total cost', pvv.cost == null ? 'Not set' : esc(money(pvv.cost))],
              pvv.ratio != null ? ['Avoided loss against cost', esc(ratioTxt(pvv.ratio))] : null,
              ['Shared risks', 'Counted once, with reductions combined']
            ],
            AVOID_NOTE,
            'About this figure'
          )
        ) +
        '><div class="rsh"><span class="name">Projected avoided loss</span>' +
        (pvv.ratio != null
          ? '<b class="rratio' + (pvv.ratio < 1 ? ' low' : '') + '">' + esc(ratioTxt(pvv.ratio)) + '</b>'
          : '') +
        '</div>' +
        valueBars(pvv.avoided, pvv.cost, true) +
        '<p class="al">Estimated fall in expected annual loss on linked risks once delivered. This is avoided loss, not a measure of overall cyber improvement.</p></div>'
      : '';
  var head =
    '<div class="ihead" aria-hidden="true"><span>Initiative</span><span>Progress</span><span class="ihi">Indicator, now and projected</span><span class="ihv">Avoided loss against cost</span><span>Delivery</span></div>';
  var sum4 =
    list.length +
    ' initiatives: ' +
    DS.filter(function (d) {
      return dc[d[0]];
    })
      .map(function (d) {
        return dc[d[0]] + ' ' + d[1].toLowerCase();
      })
      .join(', ') +
    '.';
  return band(
    4,
    'Ongoing initiatives',
    'What is reducing the risk?',
    '<article class="tile">' +
      tileHead('Initiatives', '', 'Progress, avoided loss against cost and delivery status') +
      strip +
      roiSum +
      head +
      '<div id="l4body">' +
      list
        .map(function (it, i) {
          return initRow(cfg, q, prev, pl, it, i);
        })
        .join('') +
      '</div></article>',
    ctl,
    sum4
  ).replace(
    '<article class="tile">',
    '<article class="tile' + (secView(4) === 'compact' ? ' cpt' : '') + '" id="l4view">'
  );
}
