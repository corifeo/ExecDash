/* Section 3, State of the programme: category cards. */

function subChips(e, cat, compact) {
  if (!cat.subs.length) return '';
  return (
    '<div class="subs' +
    (compact ? ' dots' : '') +
    '">' +
    cat.subs
      .map(function (x) {
        var st = e.subs[x.id] || 'g';
        var t = tip(tipHtml(x.name, [['Status', WL[st]]]));
        return compact
          ? '<span class="sh ' +
              st +
              '" tabindex="0" role="img" aria-label="' +
              esc(x.name) +
              ': ' +
              WL[st] +
              '"' +
              t +
              '></span>'
          : '<span class="subc" tabindex="0"' +
              t +
              '><span class="sh ' +
              st +
              '" aria-hidden="true"></span>' +
              esc(x.name) +
              '</span>';
      })
      .join('') +
    '</div>'
  );
}
function catCard(cfg, q, prev, pl, c, i, compact) {
  var e = catEntry(q, c),
    ind = c.indicator,
    v = num(e.value),
    s = catStatus(q, c),
    tg = isTarget(ind);
  var d = useDelta(e.trend, prev ? autoDelta(v, num(catEntry(prev, c).value)) : null);
  var hb = tg ? ind.direction !== 'lower' : ind.direction === 'higher';
  var t = tip(catTip(c, q, prev, pl)),
    pill = s ? '<span class="pill ' + s + '">' + W[s] + '</span>' : '';
  var n = activeInits(cfg, q, c.id).length;
  var tr = d != null ? '<p class="trend">' + trendHtml(d, pl, ind.unit, hb) + '</p>' : '';
  var open =
    '<article class="tile kcard stg' +
    (compact ? ' cpt' : '') +
    '" data-cat="' +
    esc(c.id) +
    '" data-st="' +
    (s || '') +
    '" style="--i:' +
    i +
    '"><div class="head"><p class="name">' +
    esc(c.name) +
    '</p>' +
    pill +
    '</div>';
  var ib = n
    ? ref('init', n + ' initiative' + (n > 1 ? 's' : '') + ' \u2193', {
        act: 'gotoinit',
        a: c.id,
        cls: 'jump',
        title: 'Show the linked initiatives'
      })
    : '';
  if (compact)
    return (
      open +
      '<div class="crow">' +
      cu(v, ind.unit, 'span', 'cval') +
      (tg ? targetBar(ind, v, t) : zoneBar(ind, v, t)) +
      '</div>' +
      tr +
      subChips(e, c, true) +
      ib +
      '</article>'
    );
  return (
    open +
    '<p class="desc gd">' +
    esc(ind.desc) +
    '</p>' +
    (tg
      ? targetGauge(ind, v, c.name, t)
      : appetiteGauge(ind, v, c.name, t) + '<p class="thr">' + esc(thrText(ind)) + '</p>') +
    tr +
    subChips(e, c, false) +
    ib +
    '</article>'
  );
}
function l3Body() {
  var c = CTX,
    compact = secView(3) === 'compact',
    cfg = c.cfg;
  return (
    '<div class="gauges' +
    (compact ? ' cptg' : '') +
    '">' +
    visCats(cfg)
      .map(function (cat, i) {
        return catCard(cfg, c.q, c.prev, c.pl, cat, i, compact);
      })
      .join('') +
    '</div>'
  );
}
function layer3(cfg, q) {
  var hasT = visCats(cfg).some(function (c) {
    return isTarget(c.indicator);
  });
  var chips = [
    ['', 'All'],
    ['r', 'Outside'],
    ['a', 'Tolerance'],
    ['g', 'Within']
  ].concat(hasT ? [['off', 'Behind target']] : []);
  var ctl =
    '<div class="rctl">' +
    viewSeg(3) +
    '<div class="hlchips" role="group" aria-label="Highlight by status"><span class="al">Highlight</span>' +
    chips
      .map(function (o) {
        return (
          '<button class="chip" data-act="hl" data-a="' +
          o[0] +
          '" aria-pressed="' +
          ((hlStatus || '') === o[0]) +
          '">' +
          (o[0] ? '<span class="sh ' + o[0] + '" aria-hidden="true"></span>' : '') +
          o[1] +
          '</button>'
        );
      })
      .join('') +
    '</div></div>';
  var c3 = counts(
    visCats(cfg).map(function (c) {
      return catStatus(q, c);
    })
  );
  var sum3 =
    c3.r +
    ' outside tolerance, ' +
    c3.a +
    ' within tolerance, ' +
    c3.g +
    ' within appetite' +
    (hasT ? ', ' + c3.off + ' behind target' : '') +
    '.';
  return band(
    3,
    'State of the programme',
    'How is each category doing?',
    '<div id="l3body">' + l3Body() + '</div>',
    ctl,
    sum3
  );
}
