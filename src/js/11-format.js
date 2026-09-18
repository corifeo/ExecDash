/* Formatting of numbers, money, change and thresholds for display. */

function fmt(v, u) {
  if (v == null) return 'No data';
  var n = +(+v).toFixed(2);
  if (u === 'count' && Math.abs(n) >= 1000) return n.toLocaleString('en-GB');
  return u === '%' ? n + '%' : u === 'h' ? n + 'h' : u === '£k' ? '£' + n + 'k' : String(n);
}
function fmtAbs(v, u) {
  var n = +Math.abs(v).toFixed(2);
  return u === '%' ? n + ' pts' : fmt(n, u);
}
function thrText(ind) {
  var u = ind.unit;
  if (isTarget(ind))
    return 'Target ' + fmt(ind.target, u) + (ind.direction === 'lower' ? ' or less.' : ' or more.');
  var a = +ind.appetite,
    t = +ind.tolerance,
    cnt = u === 'count';
  if (ind.direction === 'higher')
    return 'Appetite ' + fmt(a, u) + ' or more. Tolerance down to ' + fmt(t, u) + '.';
  var ap = a === 0 && cnt ? 'Appetite 0.' : 'Appetite ' + fmt(a, u) + ' or ' + (cnt ? 'fewer' : 'less') + '.';
  return ap + ' Tolerance up to ' + fmt(t, u) + '.';
}
// Plain sentence saying what a category's number measures and which way is better.
function measureText(ind) {
  var u = unitName(ind.unit).toLowerCase(),
    dir = ind.direction === 'higher' ? 'Higher is better' : 'Lower is better';
  return 'Measured in ' + (u === 'count' ? 'counts' : u) + '. ' + dir + '. ' + thrText(ind);
}
function trendHtml(d, prevLabel, u, higherBetter) {
  if (d == null) return '';
  var lab = prevLabel ? ' since ' + esc(prevLabel) : '';
  if (d === 0) return '<span class="trd">No change' + lab + '</span>';
  var good = higherBetter ? d > 0 : d < 0;
  return (
    '<span class="trd ' +
    (good ? 'good' : 'bad') +
    '">' +
    (d > 0 ? '&#8593; ' : '&#8595; ') +
    fmtAbs(d, u) +
    lab +
    '</span>'
  );
}
function deltaLabel(d, u) {
  if (d == null) return 'No data';
  if (d === 0) return 'no change';
  return (d > 0 ? '+' : '-') + fmtAbs(d, u);
}
function tst(s) {
  return s ? ' <span class="tst">' + esc(WL[s] || s) + '</span>' : '';
}
function nf(v, d, cmp) {
  if (cmp && Math.abs(v) >= 10000) {
    var a = Math.abs(v);
    return a >= 1e6 ? +(v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'm' : +(v / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'k';
  }
  return d === 0 ? Math.round(v).toLocaleString('en-GB') : v.toFixed(d);
}
function decOf(v) {
  var s = String(+(+v).toFixed(2));
  return (s.split('.')[1] || '').length;
}
function money(v) {
  if (v == null || isNaN(v)) return 'No data';
  var a = Math.abs(v);
  if (a >= 1e6) return '£' + +(v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'm';
  if (a >= 1e3) return '£' + Math.round(v / 1e3) + 'k';
  return '£' + Math.round(v);
}
function freqTxt(v) {
  if (v == null) return 'No data';
  if (v === 0) return 'Never';
  if (v < 1) return '1 in ' + Math.round(1 / v) + ' yrs';
  return +(+v).toFixed(2) + ' a year';
}
function ratioTxt(x) {
  return x == null ? '' : (x >= 10 ? Math.round(x) : +x.toFixed(1)) + '\u00d7 cost';
}
function paybackTxt(m) {
  if (m == null) return 'Not reached';
  if (m < 1) return 'Under a month';
  if (m < 24) return Math.round(m) + ' months';
  return +(m / 12).toFixed(1) + ' years';
}
function headroom(ind, v, s) {
  if (v == null || !s) return null;
  var u = ind.unit,
    d;
  if (isTarget(ind)) {
    d = v - +ind.target;
    if (d === 0) return 'At target';
    var better = ind.direction === 'lower' ? d < 0 : d > 0;
    return fmtAbs(d, u) + (better ? ' better than target' : ' short of target');
  }
  var a = +ind.appetite,
    t = +ind.tolerance,
    hi = ind.direction === 'higher';
  if (s === 'g') {
    d = hi ? v - a : a - v;
    return d === 0 ? 'At appetite limit' : fmtAbs(d, u) + (hi ? ' above' : ' below') + ' appetite limit';
  }
  if (s === 'a') {
    d = hi ? v - t : t - v;
    return d === 0 ? 'At tolerance limit' : fmtAbs(d, u) + ' inside tolerance limit';
  }
  d = hi ? t - v : v - t;
  return fmtAbs(d, u) + ' beyond tolerance limit';
}
function pctChange(cur, prev) {
  if (cur == null || prev == null) return null;
  if (prev === 0) return cur === 0 ? { dir: 0, txt: 'No change' } : { dir: 1, txt: 'New' };
  var p = ((cur - prev) / prev) * 100;
  if (Math.abs(p) < 0.05) return { dir: 0, txt: 'No change' };
  var a = Math.abs(p);
  return { dir: p > 0 ? 1 : -1, txt: (a < 10 ? a.toFixed(1) : Math.round(a).toLocaleString('en-GB')) + '%' };
}
function pctHtml(pc, cls, suffix) {
  if (!pc) return '';
  if (pc.dir === 0) return '<' + cls.tag + ' class="' + cls.base + '">' + pc.txt + '</' + cls.tag + '>';
  return (
    '<' +
    cls.tag +
    ' class="' +
    cls.base +
    ' ' +
    (pc.dir > 0 ? 'bad' : 'good') +
    '">' +
    (pc.txt === 'New' ? 'New' : (pc.dir > 0 ? '&#8593; ' : '&#8595; ') + pc.txt) +
    (suffix || '') +
    '</' +
    cls.tag +
    '>'
  );
}
function changeRow(cur, prev) {
  if (cur == null || prev == null) return null;
  var pc = pctChange(cur, prev),
    d = cur - prev;
  return [
    'Change',
    (d > 0 ? '+' : d < 0 ? '-' : '') +
      nf(Math.abs(d), 0) +
      (pc && pc.dir !== 0 && pc.txt !== 'New' ? ' (' + (pc.dir > 0 ? '+' : '-') + pc.txt + ')' : '')
  ];
}
function unitName(u) {
  var m = UNITS.filter(function (x) {
    return x[0] === u;
  })[0];
  return m ? m[1] : u;
}
