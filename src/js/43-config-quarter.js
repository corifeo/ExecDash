/* Configure, Quarter data tab. */

function cfgData() {
  if (!ensureWq()) return '<p class="empty">No quarters yet. Create one in the Quarters tab.</p>';
  var c = wcfg,
    q = wq,
    prev = prevOf(editQ);
  if (prev) prev = normalizeQ(prev, c);
  var qs = sortedQs();
  var out =
    '<section class="csec"><div class="rowf">' +
    fld(
      'Quarter to edit',
      '<select id="editq">' +
        qs
          .map(function (x) {
            return opt(x.id, x.label, editQ);
          })
          .join('') +
        '</select>'
    ) +
    fld('Label', inp('q:label', q.label)) +
    fld('Period', inp('q:period', q.period)) +
    '</div>' +
    (prev
      ? '<p class="hint" style="margin-top:10px">Auto values compare with ' + esc(prev.label) + '.</p>'
      : '<p class="hint" style="margin-top:10px">This is the first quarter, so auto trends have nothing to compare with.</p>') +
    '</section>';
  out += '\u0001cats\u0001';
  out +=
    '<section class="csec"><h2>Cyber categories</h2><p class="hint">Status and previous status follow the limits set under Structure unless overridden.</p>';
  if (!c.categories.length) out += '<p class="desc">No categories yet. Add them under Structure.</p>';
  else
    out +=
      '<div class="qcats">' +
      c.categories
        .map(function (cat) {
          var e = q.categories[cat.id],
            v = num(e.value),
            p = 'q:categories.' + cat.id,
            pe = prev ? catEntry(prev, cat) : null,
            ind = cat.indicator,
            st = statusFor(ind, v);
          var cnote = noteCtl(
            p + '.note',
            e.note,
            prev
              ? chgLabel(
                  useDelta(e.trend, autoDelta(v, num(pe.value))),
                  ind.unit,
                  catStatus(q, cat),
                  catStatus(prev, cat)
                )
              : ''
          );
          var valueCtl =
            ind.unit === '%'
              ? (function () {
                  var mx = gaugeMax(ind, v);
                  return slider(p + '.value', e.value, {
                    max: mx,
                    step: 0.5,
                    rr: true,
                    zones: zoneGradient(ind, mx),
                    label: cat.name + ' value',
                    mark: pe && num(pe.value) != null ? num(pe.value) : null,
                    markLabel: prev ? prev.label : ''
                  });
                })()
              : '<span class="unitin">' +
                inp(p + '.value', e.value, 'number', ' data-rr aria-label="' + esc(cat.name) + ' value"') +
                '<span class="al">' +
                esc(unitName(ind.unit)) +
                '</span></span>';
          var cur = catStatus(q, cat);
          return (
            '<div class="qcat">' +
            '<div class="qc-name"><div class="qc-title">' +
            esc(cat.name) +
            '<label class="swlab qsw" title="Show this category on the dashboard">' +
            swb(
              'c:categories.' + c.categories.indexOf(cat) + '.hidden',
              !cat.hidden,
              'Show ' + cat.name + ' on the dashboard'
            ) +
            '<span>On dashboard</span></label>' +
            (cat.hidden
              ? '<span class="pill off" title="Kept in the data, not shown on the dashboard">Hidden</span>'
              : '') +
            (cur ? '<span class="pill ' + cur + '">' + W[cur] + '</span>' : '') +
            '</div><span class="al">' +
            esc(ind.desc) +
            '</span>' +
            cnote +
            '</div>' +
            '<div class="qc-val">' +
            fld('Value', valueCtl + prevHint(prev, pe ? num(pe.value) : null, ind.unit)) +
            fld(
              'Change',
              trendCtl(p + '.trend', e.trend, prev ? autoDelta(v, num(pe.value)) : null, ind.unit),
              '',
              'Auto is the difference from last quarter. Manual lets you set the change shown on the dashboard.'
            ) +
            '</div>' +
            '<div class="qc-st">' +
            fld(
              'Status',
              sel(p + '.status', statusOpts(ind, st, false), e.status, true),
              '',
              'Auto follows the limits set under Structure. Choose a value only to override it, for example while data is being corrected.'
            ) +
            fld(
              'Previous status',
              sel(p + '.prev', statusOpts(ind, prev ? catStatus(prev, cat) : null, true), e.prev, true),
              '',
              'Auto uses last quarter\u2019s status. Override it if last quarter\u2019s data was incomplete or has since been corrected.'
            ) +
            '</div>' +
            '<div class="qc-subs"><span class="al">Subcategories</span>' +
            (cat.subs.length
              ? '<div class="ragrows">' +
                cat.subs
                  .map(function (sb) {
                    return (
                      '<div class="ragrow"><span title="' +
                      esc(sb.name) +
                      '">' +
                      esc(sb.name) +
                      '</span>' +
                      ragPick(p + '.subs.' + sb.id, e.subs[sb.id] || 'g', sb.name) +
                      '</div>'
                    );
                  })
                  .join('') +
                '</div>'
              : '<span class="al">None</span>') +
            '</div>' +
            '</div>'
          );
        })
        .join('') +
      '</div>';
  out += '</section>';
  var avg = avgScores(q, c.functions),
    pavg = prev ? avgScores(prev, c.functions) : null;
  out += '\u0001mat\u0001';
  out +=
    '<section class="csec"><h2>Programme maturity</h2><p class="hint">Scores out of ' +
    esc(c.maturityMax) +
    '. Current average: ' +
    (avg == null ? 'No data' : avg.toFixed(2)) +
    '.</p><p class="hint">Drag each dial to set the score. The tick on each dial marks the target.</p><div class="dialgrid">' +
    c.functions
      .map(function (f) {
        var v = num(q.maturity.scores[f.id]),
          pvv = prev ? num(prev.maturity.scores[f.id]) : null,
          d = v != null && pvv != null ? +(v - pvv).toFixed(1) : null;
        return (
          '<div class="dialcell">' +
          knob('q:maturity.scores.' + f.id, v, 'score', f.name, {
            max: +c.maturityMax || 5,
            mark: +f.target
          }) +
          '<span class="al">Target ' +
          (+f.target).toFixed(1) +
          '</span>' +
          (pvv != null ? prevHint(prev, pvv.toFixed(1), 'count') : '') +
          noteCtl(
            'q:maturity.notes.' + f.id,
            q.maturity.notes[f.id],
            d ? (d > 0 ? 'Up ' : 'Down ') + Math.abs(d).toFixed(1) : ''
          ) +
          '</div>'
        );
      })
      .join('') +
    '</div><div class="rowf" style="margin-top:12px">' +
    fld(
      'Change in average',
      trendCtl('q:maturity.trend', q.maturity.trend, prev ? autoDelta(avg, pavg) : null, 'count'),
      '',
      'Auto is the difference from last quarter. Manual lets you set the change shown on the dashboard.'
    ) +
    '</div></section>';
  var nEn = c.risks.filter(function (r) {
    return r.enabled;
  }).length;
  function riskSel(path, val) {
    var groups = c.categories
      .map(function (k) {
        return [
          k,
          c.risks.filter(function (r) {
            return r.categoryId === k.id && (r.enabled || r.id === val);
          })
        ];
      })
      .filter(function (g) {
        return g[1].length;
      });
    var loose = c.risks.filter(function (r) {
      return !findCat(c, r.categoryId) && (r.enabled || r.id === val);
    });
    var o = function (r) {
      return (
        '<option value="' +
        esc(r.id) +
        '"' +
        (r.id === val ? ' selected' : '') +
        '>' +
        esc(r.name) +
        (r.enabled ? '' : ' (disabled)') +
        '</option>'
      );
    };
    return (
      '<select data-b="' +
      path +
      '" data-rr style="max-width:440px"><option value="">Select a risk</option>' +
      groups
        .map(function (g) {
          return '<optgroup label="' + esc(g[0].name) + '">' + g[1].map(o).join('') + '</optgroup>';
        })
        .join('') +
      (loose.length ? '<optgroup label="No category">' + loose.map(o).join('') + '</optgroup>' : '') +
      '</select>'
    );
  }
  var rateOpts = c.ratings.map(function (r) {
    return [r, r];
  });
  out += '\u0001risks\u0001';
  out +=
    '<section class="csec"><h2>Top risks</h2><p class="hint">Pick from the ' +
    nEn +
    ' enabled risks in the register. Movement is worked out from the previous quarter unless set here.</p>';
  if (q.topRisks.length)
    out +=
      '<div class="tscroll"><table class="ct"><thead><tr><th>#</th><th>Risk</th><th>Residual rating' +
      info(
        'Rating after current controls. The order of ratings is set under Structure and drives Rising and Falling.'
      ) +
      '</th><th>Movement' +
      info(
        'Auto shows New if the risk was not in last quarter\u2019s list, otherwise Rising, Falling or Stable from the rating order.'
      ) +
      '</th><th></th></tr></thead><tbody>' +
      q.topRisks
        .map(function (tr, i) {
          var am = tr.riskId
            ? movement({ riskId: tr.riskId, rating: tr.rating, movement: 'auto' }, prev, c)
            : null;
          return (
            '<tr><td>' +
            (i + 1) +
            '</td><td>' +
            riskSel('q:topRisks.' + i + '.riskId', tr.riskId) +
            noteCtl('q:topRisks.' + i + '.note', tr.note, '') +
            '</td><td>' +
            sel('q:topRisks.' + i + '.rating', rateOpts, tr.rating, true) +
            (function () {
              if (!prev || !tr.riskId) return '';
              var pr = (prev.topRisks || []).filter(function (x) {
                return x.riskId === tr.riskId;
              })[0];
              return (
                '<span class="al phint">' +
                esc(prev.label) +
                ': ' +
                (pr
                  ? esc(pr.rating) + ', ranked ' + ((prev.topRisks || []).indexOf(pr) + 1)
                  : 'not in top ' + esc(c.topN)) +
                '</span>'
              );
            })() +
            '</td><td>' +
            sel(
              'q:topRisks.' + i + '.movement',
              [
                ['auto', 'Auto: ' + (am ? am.charAt(0).toUpperCase() + am.slice(1) : 'No data')],
                ['new', 'New'],
                ['rising', 'Rising'],
                ['stable', 'Stable'],
                ['falling', 'Falling']
              ],
              tr.movement || 'auto',
              true
            ) +
            '</td><td><div class="tools">' +
            moveBtns('mvtop', i, q.topRisks.length) +
            '<button class="btn danger" data-act="deltop" data-a="' +
            i +
            '">Remove</button></div></td></tr>'
          );
        })
        .join('') +
      '</tbody></table></div>';
  out +=
    '<p class="addrow">' +
    addBtn('addtop', 'Add top risk', q.topRisks.length >= (+c.topN || 5) ? ' disabled' : '') +
    '<span class="al">' +
    q.topRisks.length +
    ' of ' +
    (+c.topN || 5) +
    ' shown</span></p></section>';
  out += '\u0001inc\u0001';
  out +=
    '<section class="csec"><h2>Incidents</h2><p class="hint">Log every priority. The dashboard shows the top ' +
    c.incFocus +
    ' (' +
    esc(sevPhrase(focusSev(c.severities, c.incFocus))) +
    ') and calculates movement on those. Describe notable incidents below and link each to a cyber domain or a risk. The description is shown on hover.</p><div class="rowf top">' +
    c.severities
      .map(function (s) {
        var n = (q.incidents.items || []).filter(function (x) {
          return x.severity === s;
        }).length;
        return fld(
          s,
          inp('q:incidents.counts.' + s, q.incidents.counts[s], 'number', ' data-rr min="0"') +
            prevHint(prev, prev ? num(prev.incidents.counts[s]) : null, 'count') +
            (n ? '<span class="al phint">' + n + ' described</span>' : '')
        );
      })
      .join('') +
    fld(
      'Regulatory notifications',
      inp('q:incidents.regulatory', q.incidents.regulatory, 'number', ' min="0"') +
        prevHint(prev, prev ? num(prev.incidents.regulatory) : null, 'count'),
      '',
      'How many incidents were reported to a regulator this quarter.'
    ) +
    fld(
      'Median time to contain (hours)',
      inp('q:incidents.ttc', q.incidents.ttc, 'number', ' min="0"') +
        prevHint(prev, prev ? num(prev.incidents.ttc) : null, 'h'),
      '',
      'The median time, in hours, from detection to containment across this quarter\u2019s incidents.'
    ) +
    '</div>' +
    '<h3 class="subh2">Notable incidents</h3>' +
    incEditor(c, q) +
    '</section>';
  out += '\u0001exp\u0001';
  out += cfgVulns(c, q, prev);
  out += '\u0001init\u0001';
  out +=
    '<section class="csec"><h2>Initiatives</h2><p class="hint">Enabled initiatives from the register are listed here. Switch on the ones to show this quarter.</p>';
  if (
    !c.initiatives.some(function (it) {
      return it.enabled || q.initiatives[it.id].include;
    })
  )
    out += '<p class="desc">No enabled initiatives. Enable them under Risks and initiatives.</p>';
  else
    out +=
      '<div class="tscroll"><table class="ct"><thead><tr><th>Show' +
      info('Switch on to include the initiative on the dashboard for this quarter.') +
      '</th><th>Initiative</th><th>Progress</th><th>Delivery</th><th>Next milestone</th></tr></thead><tbody>' +
      c.initiatives
        .filter(function (it) {
          return it.enabled || q.initiatives[it.id].include;
        })
        .map(function (it) {
          var e = q.initiatives[it.id],
            p = 'q:initiatives.' + it.id,
            k = findCat(c, it.categoryId);
          var pe = prev && prev.initiatives ? prev.initiatives[it.id] : null;
          var inote = noteCtl(
            p + '.note',
            e.note,
            (function () {
              var parts = [];
              if (pe && pe.include) {
                if (pe.status !== e.status) parts.push('Now ' + dsName(e.status).toLowerCase());
                var dp =
                  num(e.progress) != null && num(pe.progress) != null
                    ? num(e.progress) - num(pe.progress)
                    : null;
                if (dp) parts.push((dp > 0 ? 'Up ' : 'Down ') + Math.abs(dp) + ' pts');
              } else if (e.include && prev) parts.push('New this quarter');
              return parts.join(', ');
            })()
          );
          return (
            '<tr><td>' +
            swb(p + '.include', e.include, 'Show ' + it.name) +
            '</td><th scope="row">' +
            esc(it.name) +
            '<span class="al">' +
            (it.enabled ? '' : 'Disabled in register. ') +
            esc(itName(it.type, c)) +
            (k ? ', ' + esc(k.name) : '') +
            '</span>' +
            ((it.riskIds || []).length
              ? '<span class="al">Linked to ' +
                esc(
                  (it.riskIds || [])
                    .map(function (id) {
                      var r = findRisk(c, id);
                      return r ? r.name : '';
                    })
                    .filter(Boolean)
                    .join(', ')
                ) +
                '</span>'
              : '') +
            inote +
            '</th><td>' +
            slider(p + '.progress', e.progress, {
              max: 100,
              step: 5,
              label: it.name + ' progress',
              mark: pe && pe.include && num(pe.progress) != null ? num(pe.progress) : null,
              markLabel: prev ? prev.label : '',
              width: '180px'
            }) +
            prevHint(pe && pe.include ? prev : null, pe ? num(pe.progress) : null, '%') +
            '</td><td>' +
            sel(p + '.status', DS, e.status) +
            (pe && pe.include
              ? '<span class="al phint">' + esc(prev.label) + ': ' + esc(dsName(pe.status)) + '</span>'
              : '') +
            '</td><td>' +
            inp(p + '.milestone', e.milestone, 'text', ' style="min-width:220px"') +
            '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table></div>';
  out += '</section>';
  return qdTabs(out, c, q);
}
var qdTab = 'cats';
function qdTabs(out, c, q) {
  var parts = out.split('\u0001'),
    head = parts[0],
    secs = {},
    order = [];
  for (var i = 1; i < parts.length; i += 2) {
    secs[parts[i]] = parts[i + 1];
    order.push(parts[i]);
  }
  if (!secs[qdTab]) qdTab = order[0];
  var vc2 = visCats(c),
    cc = counts(
      vc2.map(function (k) {
        return catStatus(q, k);
      })
    ),
    fi = focusSev(c.severities, c.incFocus),
    fv = focusSev(c.vulnSeverities, c.vulnFocus);
  var incT = totalInc(q, fi),
    expT = 0,
    expAny = false;
  c.vulnGroups.forEach(function (g) {
    fv.forEach(function (k) {
      var v = vc(q, g, k);
      if (v != null) {
        expT += v;
        expAny = true;
      }
    });
  });
  var avg = avgScores(q, c.functions),
    shown = c.initiatives.filter(function (it) {
      return q.initiatives[it.id] && q.initiatives[it.id].include;
    }).length;
  var nh = c.categories.length - vc2.length;
  var meta = {
    cats: [
      'Categories',
      vc2.length + ' shown' + (nh ? ', ' + nh + ' hidden' : ''),
      cc.r ? 'r' : cc.a ? 'a' : ''
    ],
    mat: ['Maturity', avg == null ? 'No data' : avg.toFixed(1), ''],
    risks: ['Top risks', q.topRisks.length + ' of ' + (+c.topN || 5), ''],
    inc: [
      'Incidents',
      incT == null
        ? 'No data'
        : nf(incT, 0) +
          ' ' +
          fi.join('/') +
          ((q.incidents.items || []).length ? ', ' + q.incidents.items.length + ' described' : ''),
      ''
    ],
    exp: ['Exposure', expAny ? nf(expT, 0) + ' ' + fv.join('/').toLowerCase() : 'No data', ''],
    init: ['Initiatives', shown + ' shown', '']
  };
  var tabs =
    '<nav class="qtabs" aria-label="Quarter data sections">' +
    order
      .map(function (k, n) {
        var m = meta[k] || [k, '', ''];
        return (
          '<button data-act="qdtab" data-a="' +
          k +
          '" aria-current="' +
          (qdTab === k) +
          '"><span class="qn">' +
          (n + 1) +
          '</span><span class="qt">' +
          esc(m[0]) +
          '<small>' +
          esc(m[1]) +
          '</small></span>' +
          (m[2]
            ? '<span class="sh ' + m[2] + '" aria-label="' + WL[m[2]] + ' in this section"></span>'
            : '') +
          '</button>'
        );
      })
      .join('') +
    '</nav>';
  var idx = order.indexOf(qdTab),
    nav =
      '<div class="qnext">' +
      (idx > 0
        ? '<button class="btn" data-act="qdtab" data-a="' +
          order[idx - 1] +
          '">&#8592; ' +
          esc((meta[order[idx - 1]] || [''])[0]) +
          '</button>'
        : '<span></span>') +
      (idx < order.length - 1
        ? '<button class="btn" data-act="qdtab" data-a="' +
          order[idx + 1] +
          '">' +
          esc((meta[order[idx + 1]] || [''])[0]) +
          ' &#8594;</button>'
        : '') +
      '</div>';
  return head + tabs + '<div class="qpanel">' + secs[qdTab] + nav + '</div>';
}
function incEditor(c, q) {
  var items = q.incidents.items || [];
  var catOpts = [['', 'No domain']].concat(
    c.categories.map(function (x) {
      return [x.id, x.name];
    })
  );
  var out = items
    .map(function (x, i) {
      var p = 'q:incidents.items.' + i;
      var rOpts = [['', 'No linked risk']].concat(
        c.risks
          .filter(function (r) {
            return r.enabled || r.id === x.riskId;
          })
          .map(function (r) {
            var k = findCat(c, r.categoryId);
            return [r.id, r.name + (k ? ' (' + k.name + ')' : '')];
          })
      );
      return (
        '<div class="incard"><div class="rowf">' +
        fld(
          'Title',
          inp(p + '.title', x.title, 'text', ' data-rr placeholder="Short name for the incident"'),
          'wide'
        ) +
        fld(
          'Priority',
          sel(
            p + '.severity',
            c.severities.map(function (k) {
              return [k, k];
            }),
            x.severity,
            true
          )
        ) +
        '<div class="tools" style="align-self:flex-end">' +
        moveBtns('mvinc', i, items.length) +
        '<button class="btn danger" data-act="delinc" data-a="' +
        i +
        '">Remove</button></div></div>' +
        '<div class="rowf">' +
        fld(
          'Cyber domain',
          sel(p + '.categoryId', catOpts, x.categoryId || '', true),
          '',
          'Optional. The cyber category the incident belongs to.'
        ) +
        fld(
          'Linked risk',
          sel(p + '.riskId', rOpts, x.riskId || '', true, ' style="max-width:360px"'),
          '',
          'Optional. Links the incident to a risk so they highlight together on the dashboard.'
        ) +
        fld('Time to contain (hours)', inp(p + '.ttc', x.ttc, 'number', ' min="0"')) +
        fld('Regulatory notification', swb(p + '.reportable', x.reportable, 'Regulatory notification')) +
        '</div>' +
        '<label class="fld wide"><span>Description, shown on hover</span><textarea data-b="' +
        p +
        '.description" rows="2" placeholder="What happened, the impact and the response">' +
        esc(x.description || '') +
        '</textarea></label></div>'
      );
    })
    .join('');
  return (
    (out || '<p class="desc">No incidents described for this quarter.</p>') +
    '<p class="addrow">' +
    addBtn('addinc', 'Add incident') +
    '</p>'
  );
}
function cfgVulns(c, q, prev) {
  var sev = c.vulnSeverities;
  var out =
    '<section class="csec"><h2>' +
    esc(c.exposureTitle) +
    '</h2><p class="hint">Open vulnerabilities by group and severity. Groups and appetite are set under Structure.</p>';
  if (!c.vulnGroups.length) return out + '<p class="desc">No exposure groups yet.</p></section>';
  out +=
    '<div class="tscroll"><table class="ct"><thead><tr><th>Group</th>' +
    sev
      .map(function (k, i) {
        return (
          '<th>' + esc(k) + (i >= c.vulnFocus ? ' <span class="al">not on dashboard</span>' : '') + '</th>'
        );
      })
      .join('') +
    '</tr></thead><tbody>' +
    c.vulnGroups
      .map(function (g) {
        var e = q.vulns[g.id],
          p = 'q:vulns.' + g.id;
        var tot = 0,
          ptot = 0,
          hasP = false;
        sev.forEach(function (k) {
          tot += num(e.counts[k]) || 0;
          var pv = prev ? vc(prev, g, k) : null;
          if (pv != null) {
            ptot += pv;
            hasP = true;
          }
        });
        var pc = hasP ? pctChange(tot, ptot) : null;
        return (
          '<tr><th scope="row">' +
          esc(g.name) +
          '<span class="al">Total ' +
          tot +
          (hasP ? ', ' + esc(prev.label) + ': ' + ptot : '') +
          '</span>' +
          noteCtl(
            p + '.note',
            e.note,
            pc && pc.dir !== 0 ? (pc.txt === 'New' ? 'New' : (pc.dir > 0 ? 'Up ' : 'Down ') + pc.txt) : ''
          ) +
          '</th>' +
          sev
            .map(function (k) {
              var pv = prev ? vc(prev, g, k) : null;
              return (
                '<td>' +
                inp(
                  p + '.counts.' + k,
                  e.counts[k],
                  'number',
                  ' data-rr min="0" aria-label="' + esc(g.name + ' ' + k) + '"'
                ) +
                prevHint(pv != null ? prev : null, pv, 'count') +
                '</td>'
              );
            })
            .join('') +
          '</tr>'
        );
      })
      .join('') +
    '</tbody></table></div>';
  return out + '</section>';
}
