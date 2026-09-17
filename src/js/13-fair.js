/* Simplified FAIR simulation, loss bands and initiative value (avoided loss). */

function hashStr(s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function tri(r, a, m, b) {
  if (b <= a) return a;
  var u = r(),
    c = (m - a) / (b - a);
  return u < c ? a + Math.sqrt(u * (b - a) * (m - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - m));
}
function pois(r, l) {
  if (l <= 0) return 0;
  if (l > 30) {
    var g = Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
    return Math.max(0, Math.round(l + Math.sqrt(l) * g));
  }
  var L = Math.exp(-l),
    k = 0,
    p = 1;
  do {
    k++;
    p *= r();
  } while (p > L);
  return k - 1;
}
function fairOk(f) {
  return (
    !!f &&
    ['fMin', 'fMl', 'fMax', 'lMin', 'lMl', 'lMax'].every(function (x) {
      return num(f[x]) != null;
    }) &&
    +f.fMax > 0 &&
    +f.lMax > 0
  );
}
var SIMN = 5000,
  SIMC = {};
function summ(arr) {
  var s = Array.prototype.slice.call(arr).sort(function (a, b) {
      return a - b;
    }),
    sum = 0;
  for (var i = 0; i < s.length; i++) sum += s[i];
  return { mean: sum / s.length, p50: s[Math.floor(s.length * 0.5)], p90: s[Math.floor(s.length * 0.9)] };
}
function simRisk(r0) {
  var f = r0 && r0.fair;
  if (!fairOk(f)) return null;
  var key = r0.id + '|' + [f.fMin, f.fMl, f.fMax, f.lMin, f.lMl, f.lMax].join(',');
  if (SIMC[key]) return SIMC[key];
  var r = rng(hashStr(key)),
    arr = new Float64Array(SIMN),
    ev = 0;
  for (var i = 0; i < SIMN; i++) {
    var n = pois(r, tri(r, +f.fMin, +f.fMl, +f.fMax)),
      t = 0;
    for (var j = 0; j < n; j++) t += tri(r, +f.lMin, +f.lMl, +f.lMax);
    arr[i] = t;
    if (n) ev++;
  }
  var res = summ(arr);
  res.pEvent = ev / SIMN;
  res.arr = arr;
  SIMC[key] = res;
  return res;
}
function simPortfolio(list) {
  if (!list.length) return null;
  var arr = new Float64Array(SIMN),
    ev = 0;
  list.forEach(function (x) {
    for (var i = 0; i < SIMN; i++) arr[i] += x.arr[i];
  });
  for (var i = 0; i < SIMN; i++) if (arr[i] > 0) ev++;
  var s = summ(arr);
  s.pEvent = ev / SIMN;
  return s;
}
function bandIdx(bands, v) {
  for (var i = 0; i < bands.length; i++) {
    var u = num(bands[i].upTo);
    if (u == null || v <= u) return i;
  }
  return bands.length - 1;
}
function bandPos(bands, v) {
  var n = bands.length;
  if (!n || v == null) return 0;
  if (v <= 0) return 0;
  var i = bandIdx(bands, v),
    lo = i ? +bands[i - 1].upTo : 0,
    hi = num(bands[i].upTo);
  if (hi == null) hi = Math.max(lo * 5, 1);
  var loL = Math.log10(Math.max(lo, hi / 20, 1)),
    hiL = Math.log10(Math.max(hi, 1)),
    vL = Math.log10(Math.max(v, 1));
  var fr = hiL > loL ? Math.max(0, Math.min(1, (vL - loL) / (hiL - loL))) : 0.5;
  return Math.min(100, ((i + fr) / n) * 100);
}
function bandCol(i, n) {
  var x = n > 1 ? i / (n - 1) : 0;
  return x <= 0.5
    ? 'color-mix(in srgb,var(--amber) ' + Math.round(x * 200) + '%,var(--green))'
    : 'color-mix(in srgb,var(--red) ' + Math.round((x - 0.5) * 200) + '%,var(--amber))';
}
function bandRange(bands, i) {
  var lo = i ? num(bands[i - 1].upTo) : null,
    hi = num(bands[i].upTo);
  if (lo == null && hi != null) return 'Under ' + money(hi);
  if (hi == null) return 'Above ' + money(lo || 0);
  return money(lo) + ' to ' + money(hi);
}
var AVOID_NOTE =
  'Avoided loss is the estimated fall in expected annual loss on the linked risks if the initiative delivers as planned. It is not a measure of overall cyber improvement, and it relies on the linked risks having loss estimates.';
function initValue(cfg, it) {
  var red = num(it.reduction),
    cost = num(it.cost),
    risks = (it.riskIds || [])
      .map(function (id) {
        return findRisk(cfg, id);
      })
      .filter(Boolean),
    base = 0,
    est = 0;
  risks.forEach(function (r) {
    var sm = simRisk(r);
    if (sm) {
      base += sm.mean;
      est++;
    }
  });
  var v = { risks: risks.length, est: est, base: base, cost: cost, red: red, avoided: null };
  if (red != null && est) {
    v.avoided = (base * red) / 100;
    if (cost) {
      v.ratio = v.avoided / cost;
      v.rosi = ((v.avoided - cost) / cost) * 100;
      v.payback = v.avoided > 0 ? (cost / v.avoided) * 12 : null;
    }
  }
  return v;
}
function portfolioValue(cfg, list) {
  var red = {},
    cost = 0,
    anyCost = false;
  list.forEach(function (it) {
    var r = num(it.reduction);
    if (num(it.cost) != null) {
      cost += +it.cost;
      anyCost = true;
    }
    if (r == null) return;
    (it.riskIds || []).forEach(function (id) {
      red[id] = (red[id] == null ? 1 : red[id]) * (1 - r / 100);
    });
  });
  var base = 0,
    avoided = 0,
    n = 0;
  Object.keys(red).forEach(function (id) {
    var rk = findRisk(cfg, id),
      sm = rk ? simRisk(rk) : null;
    if (!sm) return;
    n++;
    base += sm.mean;
    avoided += sm.mean * (1 - red[id]);
  });
  return {
    avoided: n ? avoided : null,
    base: base,
    cost: anyCost ? cost : null,
    risks: n,
    ratio: n && anyCost && cost ? avoided / cost : null
  };
}
function bandName(bands, v) {
  return bands.length && v != null ? bands[bandIdx(bands, v)].name : '';
}
