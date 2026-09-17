/* Section 1, Programme at a glance: categories against appetite, maturity and the summary box. */

function subCounts(e, cat) {
  var c = counts(
    cat.subs.map(function (s) {
      return e.subs[s.id] || 'g';
    })
  );
  return c.g + ' within, ' + c.a + ' in tolerance, ' + c.r + ' outside';
}
function catTip(cat, q, prev, pl) {
  var e = catEntry(q, cat),
    ind = cat.indicator,
    v = num(e.value),
    s = catStatus(q, cat),
    pe = prev ? catEntry(prev, cat) : null,
    pvv = pe ? num(pe.value) : null,
    ps = catPrev(q, cat, prev);
  var d = useDelta(e.trend, prev ? autoDelta(v, pvv) : null),
    n = activeInits(CTX ? CTX.cfg : config, q, cat.id).length;
  var rows = [['This quarter', esc(fmt(v, ind.unit)) + tst(s)]];
  if (isTarget(ind)) rows.push(['Target', esc(fmt(ind.target, ind.unit))]);
  else
    rows.push(
      ['Appetite limit', esc(fmt(ind.appetite, ind.unit))],
      ['Tolerance limit', esc(fmt(ind.tolerance, ind.unit))]
    );
  if (headroom(ind, v, s)) rows.push(['Position', esc(headroom(ind, v, s))]);
  if (pl) rows.push([pl, esc(fmt(pvv, ind.unit)) + tst(ps)], ['Change', esc(deltaLabel(d, ind.unit))]);
  if (cat.subs.length) rows.push(['Subcategories', esc(subCounts(e, cat))]);
  if (n) rows.push(['Initiatives', n + ' active']);
  return tipHtml(cat.name, rows, e.note);
}
function layer1(cfg, q, prev, pl) {
  var apc = appetiteCats(cfg);
  var vcs = visCats(cfg);
  var cur = vcs.map(function (c) {
      return catStatus(q, c);
    }),
    pv = vcs.map(function (c) {
      return catPrev(q, c, prev);
    });
  var cc = counts(cur),
    pc = counts(pv),
    anyPrev = pv.some(function (x) {
      return x;
    }),
    nT = vcs.length - apc.length;
  var rows = vcs
    .map(function (c, i) {
      var p = pv[i],
        s = cur[i];
      return (
        '<tr class="arow" tabindex="0" data-cat="' +
        esc(c.id) +
        '"' +
        tip(catTip(c, q, prev, pl)) +
        '><td>' +
        esc(c.name) +
        ndot(catEntry(q, c).note) +
        '<span class="al">' +
        (isTarget(c.indicator)
          ? 'Target: ' + esc(fmt(c.indicator.target, c.indicator.unit))
          : c.appetite
            ? 'Appetite: ' + esc(c.appetite.toLowerCase())
            : 'Appetite not set') +
        '</span></td><td class="c q2">' +
        (p
          ? '<span class="sh ' +
            p +
            '" role="img" aria-label="' +
            esc(pl || 'Previous') +
            ' ' +
            WL[p] +
            '"></span>'
          : '<span class="al">n/a</span>') +
        '</td><td class="q3">' +
        (s
          ? '<span class="pill pop ' + s + '" style="--i:' + i + '">' + W[s] + '</span>'
          : '<span class="al">No data</span>') +
        '</td></tr>'
      );
    })
    .join('');
  var vt = tipHtml(
    'Categories against appetite',
    [[q.label, cc.g + ' of ' + apc.length + ' within']]
      .concat(anyPrev ? [[pl, pc.g + ' of ' + apc.length + ' within']] : [], [
        ['Change', deltaLabel(anyPrev ? cc.g - pc.g : null, 'count')]
      ])
      .concat(nT ? [['Target-based', nT + ' categories, ' + cc.on + ' on target']] : [])
  );
  var strip =
    '<div class="sbar" role="img" aria-label="' +
    cc.g +
    ' within, ' +
    cc.a +
    ' in tolerance, ' +
    cc.r +
    ' outside">' +
    ['g', 'a', 'r']
      .map(function (k) {
        return cc[k]
          ? '<span class="' +
              k +
              '" style="--w:' +
              (cc[k] / Math.max(1, apc.length)) * 100 +
              '%"' +
              tip(tipHtml(GROUP[k], [[q.label, String(cc[k])], anyPrev ? [pl, String(pc[k])] : null])) +
              '></span>'
          : '';
      })
      .join('') +
    '</div>';
  var t1 =
    '<article class="tile">' +
    tileHead('Cyber categories', '', 'Headline indicator for each category, against appetite') +
    '<p class="value" tabindex="0"' +
    tip(vt) +
    '>' +
    cu(cc.g, 'count') +
    ' of ' +
    apc.length +
    ' <small>within appetite</small></p>' +
    strip +
    '<table class="areas"><thead><tr><th>Category</th><th class="c">' +
    esc(pl || 'Previous') +
    '</th><th style="text-align:right">' +
    esc(q.label) +
    '</th></tr></thead><tbody>' +
    rows +
    '</tbody></table></article>';
  var fns = cfg.functions,
    avg = avgScores(q, fns),
    pavg = prev ? avgScores(prev, fns) : null,
    tAvg = fns.length
      ? +(
          fns.reduce(function (s, f) {
            return s + (+f.target || 0);
          }, 0) / fns.length
        ).toFixed(2)
      : null;
  var md = useDelta(q.maturity.trend, prev ? autoDelta(avg, pavg) : null);
  var st =
    avg == null || tAvg == null
      ? ''
      : '<span class="pill ' +
        (avg >= tAvg ? 'on' : 'off') +
        '">' +
        (avg >= tAvg ? 'On target' : 'Behind target') +
        '</span>';
  var mt = tipHtml('Average maturity', [
    [q.label, avg == null ? 'No data' : avg.toFixed(2)],
    ['Target', tAvg == null ? 'No data' : tAvg.toFixed(2)],
    pl ? [pl, pavg == null ? 'No data' : pavg.toFixed(2)] : null,
    pl ? ['Change', deltaLabel(md, 'count')] : null,
    ['Framework', esc(cfg.maturityLabel)]
  ]);
  var t2 =
    '<article class="tile">' +
    tileHead('Programme maturity', '', cfg.maturityLabel + ', current score against target', st) +
    '<p class="value" tabindex="0"' +
    tip(mt) +
    '>' +
    (avg == null
      ? 'No data'
      : '<span class="cu" data-to="' +
        avg.toFixed(1) +
        '" data-dec="1">' +
        (ANIM ? '0.0' : avg.toFixed(1)) +
        '</span>') +
    ' <small>of ' +
    esc(cfg.maturityMax) +
    (tAvg != null ? ', target ' + tAvg.toFixed(1) : '') +
    '</small></p>' +
    radar(fns, q, prev, +cfg.maturityMax || 5, pl) +
    matBars(fns, q, prev, +cfg.maturityMax || 5, pl) +
    '<div class="key"><span><i></i>' +
    esc(q.label) +
    '</span><span><i class="t"></i>Target</span>' +
    (pavg != null ? '<span><i class="p"></i>' + esc(pl) + '</span>' : '') +
    '</div></article>';
  var sum1 =
    cc.g +
    ' of ' +
    apc.length +
    ' within appetite, ' +
    cc.a +
    ' within tolerance, ' +
    cc.r +
    ' outside tolerance' +
    (nT ? ', ' + cc.on + ' of ' + nT + ' on target' : '') +
    '. Maturity ' +
    (avg == null ? 'No data' : avg.toFixed(1)) +
    ' of ' +
    cfg.maturityMax +
    '.';
  var t3 = pulseTile(cfg, q, prev, pl);
  return band(
    1,
    'Programme at a glance',
    'Are we where we should be?',
    '<div class="g11' + (secView(1) === 'compact' ? ' cpt' : '') + '" id="l1view">' + t1 + t2 + t3 + '</div>',
    '<div class="rctl">' + viewSeg(1) + '</div>',
    sum1
  );
}
function pulseTile(cfg, q, prev, pl) {
  var rows = [];
  var sims = [],
    nNew = 0;
  q.topRisks.forEach(function (tr) {
    var r = findRisk(cfg, tr.riskId);
    if (!r) return;
    var sm = simRisk(r);
    if (sm) sims.push(sm);
    if (movement(tr, prev, cfg) === 'new') nNew++;
  });
  var port = simPortfolio(sims);
  rows.push({
    sec: 2,
    label: 'Top risks',
    value: String(q.topRisks.length),
    unit: nNew ? nNew + ' new' : '',
    extra: port
      ? '<span class="lbn" style="--c:' +
        bandCol(bandIdx(cfg.lossBands, port.mean), cfg.lossBands.length) +
        '">' +
        esc(bandName(cfg.lossBands, port.mean)) +
        ' loss</span>'
      : '',
    tip: tipHtml('Top risks', [
      ['Risks listed', String(q.topRisks.length)],
      ['New this quarter', String(nNew)],
      port
        ? [
            'Combined expected loss',
            esc(bandName(cfg.lossBands, port.mean)) +
              ' <span class="tst">' +
              esc(money(port.mean)) +
              ' a year</span>'
          ]
        : null
    ])
  });
  var fv = focusSev(cfg.vulnSeverities, cfg.vulnFocus),
    cur = vulnTotals(cfg, q),
    pv = prev ? vulnTotals(cfg, prev) : null;
  if (cfg.vulnGroups.length && cur.any) {
    var et = 0,
      pt = 0;
    fv.forEach(function (k) {
      et += cur.t[k] || 0;
      if (pv) pt += pv.t[k] || 0;
    });
    var sts = fv.map(function (k) {
        var l = sevLimit(cfg, k);
        return l ? statusFor(l, cur.t[k]) : null;
      }),
      ws = worstStatus(sts),
      pc = pv && pv.any ? pctChange(et, pt) : null;
    rows.push({
      sec: 2,
      label: cfg.exposureTitle,
      value: nf(et, 0, true),
      unit: fv.join(', ').toLowerCase(),
      status: ws,
      chg: pc,
      bad: true,
      tip: tipHtml(cfg.exposureTitle, [
        [sevPhrase(fv) + ' open', nf(et, 0)],
        pv && pv.any ? [pl, nf(pt, 0)] : null,
        changeRow(et, pv && pv.any ? pt : null),
        ws ? ['Against appetite', WL[ws]] : null
      ])
    });
  }
  var fi = focusSev(cfg.severities, cfg.incFocus),
    it = totalInc(q, fi),
    ip = prev ? totalInc(prev, fi) : null;
  if (it != null) {
    var ipc = pctChange(it, ip);
    rows.push({
      sec: 2,
      label: 'Incidents',
      value: nf(it, 0, true),
      unit: fi.join(', '),
      chg: ipc,
      bad: true,
      extra: (q.incidents.items || []).length
        ? '<span class="attr">' + plural(q.incidents.items.length, 'described') + '</span>'
        : '',
      tip: tipHtml(sevPhrase(fi) + ' incidents', [
        [q.label, nf(it, 0)],
        pl ? [pl, ip == null ? 'No data' : nf(ip, 0)] : null,
        changeRow(it, ip),
        num(q.incidents.ttc) != null
          ? [
              'Median time to contain',
              fmt(q.incidents.ttc, 'h') + ' (target ' + fmt(cfg.ttcTarget, 'h') + ')'
            ]
          : null
      ])
    });
  }
  var list = activeInits(cfg, q);
  if (list.length) {
    var ok = list.filter(function (x) {
        var st = q.initiatives[x.id].status;
        return st === 'on' || st === 'done';
      }).length,
      bad = list.filter(function (x) {
        return q.initiatives[x.id].status === 'off';
      }).length,
      val = portfolioValue(cfg, list);
    rows.push({
      sec: 4,
      label: 'Initiatives',
      value: ok + '/' + list.length,
      unit: 'on track',
      status: bad ? 'r' : null,
      statusText: bad ? plural(bad, 'off track') : '',
      extra:
        val.ratio != null
          ? '<span class="rratio' +
            (val.ratio < 1 ? ' low' : '') +
            '">' +
            esc(ratioTxt(val.ratio)) +
            '</span>'
          : '',
      tip: tipHtml(
        'Initiatives',
        DS.map(function (d2) {
          var n = list.filter(function (x) {
            return q.initiatives[x.id].status === d2[0];
          }).length;
          return n ? [d2[1], String(n)] : null;
        }).concat([
          val.avoided != null ? ['Projected avoided loss', esc(money(val.avoided)) + ' a year'] : null,
          val.cost != null ? ['Total cost', esc(money(val.cost))] : null
        ]),
        val.avoided != null ? AVOID_NOTE : '',
        'About avoided loss'
      )
    });
  }
  if (!rows.length) return '';
  return (
    '<article class="tile pulse">' +
    tileHead('Across the programme', '', 'Headline figures from the sections below') +
    '<div class="plist">' +
    rows
      .map(function (r, i) {
        var chg = r.chg ? pctHtml(r.chg, { tag: 'span', base: 'pchg' }) : '';
        var st = r.status
          ? '<span class="pill ' + r.status + '">' + esc(r.statusText || W[r.status]) + '</span>'
          : '';
        return (
          '<button class="prow stg" style="--i:' +
          i +
          '" data-act="goto" data-a="' +
          r.sec +
          '"' +
          tip(r.tip) +
          '><span class="pl">' +
          esc(r.label) +
          '</span><span class="pv"><b>' +
          esc(r.value) +
          '</b><small>' +
          esc(r.unit || '') +
          '</small></span><span class="pm">' +
          chg +
          st +
          (r.extra || '') +
          '</span><span class="pgo" aria-hidden="true">&#8594;</span></button>'
        );
      })
      .join('') +
    '</div></article>'
  );
}
