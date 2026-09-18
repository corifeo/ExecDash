/* Section 2, What has changed: top risks, exposure and incidents. */

function layer2(cfg, q, prev, pl) {
  var sims = [];
  var items = q.topRisks
    .map(function (tr, i) {
      var r = findRisk(cfg, tr.riskId);
      if (!r) return '';
      var c = findCat(cfg, r.categoryId),
        m = movement(tr, prev, cfg);
      var mv =
        m === 'new'
          ? '<span class="mv new">&#10022; New</span>'
          : m === 'rising'
            ? '<span class="mv up">&#8593; Rising</span>'
            : m === 'falling'
              ? '<span class="mv down">&#8595; Falling</span>'
              : m === 'stable'
                ? '<span class="mv">Stable</span>'
                : '';
      var p = prev
        ? (prev.topRisks || []).filter(function (x) {
            return x.riskId === tr.riskId;
          })[0]
        : null;
      var res = simRisk(r);
      if (res) sims.push(res);
      var t = tipHtml(
        r.name,
        [
          tsec('Risk'),
          ['Category', esc(c ? c.name : 'None')],
          [
            impList(r).length > 1 ? 'Impacts' : 'Impact',
            impList(r).length ? esc(impList(r).join(', ')) : 'Not set'
          ],
          ['Rating', esc(tr.rating || 'No data')],
          pl
            ? [
                pl,
                p
                  ? esc(p.rating) + ', ranked ' + ((prev.topRisks || []).indexOf(p) + 1)
                  : 'Not in top ' + esc(cfg.topN)
              ]
            : null,
          m ? ['Movement', esc(m.charAt(0).toUpperCase() + m.slice(1))] : null
        ].concat(res ? fairRows(cfg.lossBands, r, res) : []),
        tr.note
      );
      var lin = riskInits(cfg, r.id, q);
      var incs = (q.incidents.items || []).filter(function (x) {
        return x.riskId === r.id;
      });
      if (incs.length)
        t = t.replace(
          '</dl>',
          '<dt>Incidents</dt><dd>' +
            incs
              .map(function (x) {
                return esc(x.title || 'Untitled') + ' <span class="tst">' + esc(x.severity || '') + '</span>';
              })
              .join('<br>') +
            '</dd></dl>'
        );
      if (lin.length)
        t = t.replace(
          '</dl>',
          '<dt>Initiatives</dt><dd>' +
            lin
              .map(function (x) {
                return (
                  esc(x.name) + ' <span class="tst">' + esc(dsName(q.initiatives[x.id].status)) + '</span>'
                );
              })
              .join('<br>') +
            '</dd></dl>'
        );
      var tags =
        (c ? ref('cat', c.name) : '') +
        impList(r)
          .map(function (x) {
            return attr(x);
          })
          .join('') +
        (lin.length
          ? ref('init', lin.length + ' initiative' + (lin.length > 1 ? 's' : ''), {
              title: lin
                .map(function (x) {
                  return x.name;
                })
                .join(', ')
            })
          : '') +
        (incs.length
          ? ref('inc', incs.length + ' incident' + (incs.length > 1 ? 's' : ''), {
              title: incs
                .map(function (x) {
                  return x.title;
                })
                .join(', ')
            })
          : '');
      var mini =
        '<span class="rmini">' +
        (res
          ? '<span class="lbn" style="--c:' +
            bandCol(bandIdx(cfg.lossBands, res.mean), cfg.lossBands.length) +
            '">' +
            esc(bandName(cfg.lossBands, res.mean)) +
            '</span>'
          : '') +
        '</span>';
      var loss = res
        ? '<div class="rloss"><span class="rll">Loss estimate</span>' +
          lossBucket(cfg.lossBands, res) +
          '<span class="lv">' +
          esc(bandName(cfg.lossBands, res.mean)) +
          '</span></div>'
        : '';
      return (
        '<li class="stg" tabindex="0" style="--i:' +
        i +
        '" data-rid="' +
        esc(r.id) +
        '"' +
        (c ? ' data-link="' + esc(c.id) + '"' : '') +
        tip(t) +
        '><span class="rk">' +
        (i + 1) +
        '</span><div><div class="rn">' +
        esc(r.name) +
        ndot(tr.note) +
        '</div><div class="ro">' +
        tags +
        '</div>' +
        loss +
        '</div>' +
        mini +
        '<div class="rs">' +
        (tr.rating ? '<span class="pill x">' + esc(tr.rating) + '</span>' : '') +
        mv +
        '</div></li>'
      );
    })
    .join('');
  var port = simPortfolio(sims),
    ptip = port
      ? tip(
          tipHtml('Top risks combined', [
            [
              'Expected bucket',
              esc(bandName(cfg.lossBands, port.mean)) +
                ' <span class="tst">' +
                esc(bandRange(cfg.lossBands, bandIdx(cfg.lossBands, port.mean))) +
                '</span>'
            ],
            [
              '1 in 10 year bucket',
              esc(bandName(cfg.lossBands, port.p90)) +
                ' <span class="tst">' +
                esc(bandRange(cfg.lossBands, bandIdx(cfg.lossBands, port.p90))) +
                '</span>'
            ],
            ['Expected annual loss', esc(money(port.mean))],
            ['1 in 10 year loss', esc(money(port.p90))],
            ['Chance of any loss event', Math.round(port.pEvent * 100) + '% a year'],
            ['Risks with estimates', sims.length + ' of ' + q.topRisks.length],
            ['Method', 'Simplified FAIR, ' + SIMN.toLocaleString('en-GB') + ' simulated years']
          ])
        )
      : '';
  var portHtml = port
    ? '<div class="port"><div class="phead"><span class="name">Combined loss exposure</span><span class="pv">Expected <b>' +
      esc(bandName(cfg.lossBands, port.mean)) +
      '</b>, 1 in 10 year <b>' +
      esc(bandName(cfg.lossBands, port.p90)) +
      '</b></span></div>' +
      lossBucket(cfg.lossBands, port, { big: true, labels: true, tip: ptip }) +
      '<div class="lkey"><span><i class="k1"></i>Expected in a typical year</span><span><i class="k2"></i>1 in 10 year</span></div></div>'
    : '';
  var t1 =
    '<article class="tile span">' +
    tileHead('Top cyber risks', '', 'Residual rating, movement and loss bucket') +
    (items
      ? '<ol class="risks">' + items + '</ol>'
      : '<p class="desc">No top risks recorded for this quarter.</p>') +
    portHtml +
    '</article>';
  var t2 = vulnTile(cfg, q, prev, pl);
  var sevs = focusSev(cfg.severities, cfg.incFocus),
    tot = totalInc(q, sevs),
    ptot = prev ? totalInc(prev, sevs) : null;
  var t3 = incTile(cfg, q, prev, pl, tot, ptot);
  var mvs = q.topRisks.map(function (tr) {
      return movement(tr, prev, cfg);
    }),
    nNew = mvs.filter(function (m) {
      return m === 'new';
    }).length,
    nUp = mvs.filter(function (m) {
      return m === 'rising';
    }).length;
  var vt = vulnTotals(cfg, q);
  var sum2 =
    q.topRisks.length +
    ' top risks (' +
    nNew +
    ' new, ' +
    nUp +
    ' rising)' +
    (port ? ', combined loss expected ' + bandName(cfg.lossBands, port.mean).toLowerCase() : '') +
    '. ' +
    (tot == null ? 'No incident data' : nf(tot, 0) + ' ' + sevPhrase(sevs) + ' incidents') +
    '.' +
    (vt.any
      ? ' ' +
        focusSev(cfg.vulnSeverities, cfg.vulnFocus)
          .map(function (k) {
            return nf(vt.t[k], 0) + ' ' + k.toLowerCase();
          })
          .join(', ') +
        ' vulnerabilities.'
      : '');
  return band(
    2,
    'What has changed',
    'What is new or moving?',
    '<div class="g2' + (secView(2) === 'compact' ? ' cpt' : '') + '" id="l2view">' + t1 + t2 + t3 + '</div>',
    '<div class="rctl">' + viewSeg(2) + '</div>',
    sum2
  );
}
function incLinks(cfg, it) {
  var c = findCat(cfg, it.categoryId),
    r = findRisk(cfg, it.riskId);
  return { c: c, r: r };
}
function incRows(cfg, it) {
  var l = incLinks(cfg, it);
  return [
    ['Priority', esc(it.severity || 'Not set')],
    l.c ? ['Domain', esc(l.c.name)] : null,
    l.r ? ['Risk', esc(l.r.name)] : null,
    num(it.ttc) != null ? ['Time to contain', fmt(it.ttc, 'h')] : null,
    ['Regulatory notification', it.reportable ? 'Yes' : 'No']
  ];
}
function incTile(cfg, q, prev, pl, tot, ptot) {
  var all = cfg.severities,
    sevs = focusSev(all, cfg.incFocus),
    cur = {},
    pr = prev ? {} : null,
    items = q.incidents.items || [];
  var allRows = all.map(function (k) {
    var v = num(q.incidents.counts[k]);
    return [k, v == null ? 'No data' : nf(v, 0)];
  });
  sevs.forEach(function (k) {
    cur[k] = num(q.incidents.counts[k]);
    if (pr) pr[k] = num(prev.incidents.counts[k]);
  });
  var allTot = totalInc(q, all);
  var it = tip(
    tipHtml(
      sevPhrase(sevs) + ' incidents',
      [
        [q.label, tot == null ? 'No data' : nf(tot, 0)],
        pl ? [pl, ptot == null ? 'No data' : nf(ptot, 0)] : null,
        changeRow(tot, ptot)
      ].concat(allRows, [
        ['All priorities', allTot == null ? 'No data' : nf(allTot, 0)],
        items.length ? ['Described', String(items.length)] : null
      ])
    )
  );
  var ttc =
    num(q.incidents.ttc) != null
      ? '<div class="drow" tabindex="0"' +
        tip(
          tipHtml('Median time to contain', [
            [q.label, fmt(q.incidents.ttc, 'h')],
            ['Target', fmt(cfg.ttcTarget, 'h')],
            pl && num(prev.incidents.ttc) != null ? [pl, fmt(prev.incidents.ttc, 'h')] : null
          ])
        ) +
        '><span>Median time to contain</span><b>' +
        fmt(q.incidents.ttc, 'h') +
        '</b><small>target ' +
        fmt(cfg.ttcTarget, 'h') +
        '</small></div>'
      : '';
  var reg =
    num(q.incidents.regulatory) != null
      ? '<div class="drow" tabindex="0"' +
        tip(
          tipHtml('Regulatory notifications', [
            [q.label, String(num(q.incidents.regulatory))],
            pl && num(prev.incidents.regulatory) != null ? [pl, String(num(prev.incidents.regulatory))] : null
          ])
        ) +
        '><span>Regulatory notifications</span><b>' +
        num(q.incidents.regulatory) +
        '</b><small>&nbsp;</small></div>'
      : '';
  // Only the most severe described incidents are listed, so the section does not grow; the rest go in a tooltip.
  var ranked = items
    .map(function (x, i) {
      return [x, i];
    })
    .sort(function (a, b) {
      var sa = all.indexOf(a[0].severity),
        sb = all.indexOf(b[0].severity);
      return (sa < 0 ? all.length : sa) - (sb < 0 ? all.length : sb) || a[1] - b[1];
    })
    .map(function (x) {
      return x[0];
    });
  var shown = ranked.slice(0, INC_LIST_MAX),
    rest = ranked.slice(INC_LIST_MAX);
  var more = rest.length
    ? '<div class="irow imore stg" tabindex="0" style="--i:' +
      (shown.length + 3) +
      '"' +
      tip(
        tipHtml(
          rest.length + ' more described',
          rest.map(function (x) {
            return [esc(x.severity || 'Not set'), esc(x.title || 'Untitled incident')];
          })
        )
      ) +
      '><span class="it">+' +
      rest.length +
      ' more</span></div>'
    : '';
  var list =
    shown
      .map(function (x, i) {
        var l = incLinks(cfg, x),
          si = sevs.indexOf(x.severity);
        return (
          '<div class="irow stg" tabindex="0" style="--i:' +
          (i + 3) +
          '"' +
          (l.c ? ' data-link="' + esc(l.c.id) + '"' : '') +
          (l.r ? ' data-risks="' + esc(l.r.id) + '"' : '') +
          tip(tipHtml(x.title || 'Incident', incRows(cfg, x), x.description, 'Description')) +
          '><i class="vs s' +
          (si < 0 ? 4 : si) +
          '" aria-hidden="true"></i><span class="it">' +
          esc(x.title || 'Untitled incident') +
          '</span></div>'
        );
      })
      .join('') + more;
  return (
    '<article class="tile">' +
    tileHead('Incidents', '', 'Security incidents this quarter, by priority') +
    totalLine(tot, ptot, pl, sevPhrase(sevs) + ' this quarter', it) +
    sevGrid('incidents', sevs, cur, pr, q, pl, {
      extra: function (k) {
        var n = items.filter(function (x) {
          return x.severity === k;
        });
        return n.length
          ? [
              'Described',
              n
                .map(function (x) {
                  return esc(x.title || 'Untitled');
                })
                .join('<br>')
            ]
          : null;
      }
    }) +
    (list ? '<div class="ilist"><span class="al">Notable incidents</span>' + list + '</div>' : '') +
    '<div class="details">' +
    reg +
    ttc +
    '</div></article>'
  );
}
function vulnTile(cfg, q, prev, pl) {
  var allSev = cfg.vulnSeverities,
    sev = focusSev(allSev, cfg.vulnFocus),
    groups = cfg.vulnGroups;
  if (!groups.length)
    return (
      '<article class="tile">' +
      tileHead(cfg.exposureTitle, '', 'Open vulnerabilities, by severity') +
      '<div class="ph"><span>Add exposure groups under Configure, Structure.</span></div></article>'
    );
  var cur = vulnTotals(cfg, q),
    pv = prev ? vulnTotals(cfg, prev) : null,
    tot = 0,
    ptot = 0;
  sev.forEach(function (k) {
    tot += cur.t[k];
    if (pv) ptot += pv.t[k];
  });
  var gt = function (qq, g) {
    var t = 0,
      a = false;
    sev.forEach(function (k) {
      var v = vc(qq, g, k);
      if (v != null) {
        t += v;
        a = true;
      }
    });
    return a ? t : null;
  };
  var max = Math.max.apply(
    null,
    groups
      .map(function (g) {
        return gt(q, g) || 0;
      })
      .concat([1])
  );
  var allT = 0;
  allSev.forEach(function (k) {
    allT += cur.t[k] || 0;
  });
  var ttip = tip(
    tipHtml(
      sevPhrase(sev) + ' open',
      [
        [q.label, nf(tot, 0)],
        pv && pv.any ? [pl, nf(ptot, 0)] : null,
        pv && pv.any ? changeRow(tot, ptot) : null
      ].concat(
        allSev.map(function (k) {
          return [k, nf(cur.t[k] || 0, 0)];
        }),
        [['All severities', nf(allT, 0)]]
      )
    )
  );
  var rows = groups
    .map(function (g, gi) {
      var t = gt(q, g),
        pt = prev ? gt(prev, g) : null,
        note = q.vulns[g.id] && q.vulns[g.id].note;
      var segs = sev
        .map(function (k, i) {
          var v = vc(q, g, k) || 0,
            p = prev ? vc(prev, g, k) : null;
          if (!v) return '';
          return (
            '<span class="vseg s' +
            i +
            '" style="flex:' +
            v +
            '" tabindex="0"' +
            tip(
              tipHtml(
                g.name + ', ' + k,
                [[q.label, nf(v, 0)], pl ? [pl, p == null ? 'No data' : nf(p, 0)] : null, changeRow(v, p)],
                note
              )
            ) +
            '></span>'
          );
        })
        .join('');
      var gtip = tip(
        tipHtml(
          g.name,
          allSev
            .map(function (k) {
              return [k, nf(vc(q, g, k) || 0, 0)];
            })
            .concat([
              [sevPhrase(sev), nf(t || 0, 0)],
              pl ? [pl + ' total', pt == null ? 'No data' : nf(pt, 0)] : null,
              changeRow(t, pt)
            ]),
          note
        )
      );
      var pc = pctChange(t, pt);
      return (
        '<div class="drow vrow stg" style="--i:' +
        (gi + 2) +
        '" tabindex="0"' +
        gtip +
        '><span>' +
        esc(g.name) +
        ndot(note) +
        '</span><b>' +
        cu(t, 'count', 'span', '', t != null && t >= 1e6) +
        '</b>' +
        (pc ? pctHtml(pc, { tag: 'small', base: '' }) : '<small>&nbsp;</small>') +
        '<div class="vbar"><div class="vfill" style="--w:' +
        ((t || 0) / max) * 100 +
        '%">' +
        segs +
        '</div></div></div>'
      );
    })
    .join('');
  var sts = sev.map(function (k) {
      var l = sevLimit(cfg, k);
      return l && cur.any ? statusFor(l, cur.t[k]) : null;
    }),
    ws = worstStatus(sts);
  var pill = ws ? '<span class="pill ' + ws + '">' + W[ws] + '</span>' : '';
  return (
    '<article class="tile" id="vtile">' +
    tileHead(
      cfg.exposureTitle,
      '',
      ws ? 'Open vulnerabilities against appetite' : 'Open vulnerabilities, by severity',
      pill
    ) +
    totalLine(tot, pv && pv.any ? ptot : null, pl, sevPhrase(sev).toLowerCase() + ' open', ttip) +
    sevGrid('vulnerabilities', sev, cur.any ? cur.t : {}, pv && pv.any ? pv.t : null, q, pl, {
      limit: function (k) {
        return sevLimit(cfg, k);
      }
    }) +
    '<div class="details">' +
    rows +
    '</div></article>'
  );
}
