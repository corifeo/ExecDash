/* Data model: defaults, normalisation (the migration point for stored data), lookups and status rules. */

function itypes(c) {
  c = c || (view === 'config' ? wcfg : config) || config;
  return ((c && c.initiativeTypes) || []).map(function (t) {
    return [t.id, t.name];
  });
}
function itName(k, c) {
  var m = itypes(c).filter(function (x) {
    return x[0] === k;
  })[0];
  return m ? m[1] : 'Unknown type';
}
function itIdx(k, c) {
  var l = itypes(c);
  for (var i = 0; i < l.length; i++) if (l[i][0] === k) return i;
  return 9;
}
function defaultConfig() {
  return {
    title: 'Cyber security dashboard',
    committee: 'Executive Risk Committee',
    footer: '',
    appetiteLevels: ['Very low', 'Low', 'Moderate', 'High'],
    ratings: ['Critical', 'High', 'Medium', 'Low'],
    severities: ['P0', 'P1', 'P2', 'P3'],
    incFocus: 2,
    vulnFocus: 2,
    impacts: ['Financial loss', 'Client detriment', 'Regulatory', 'Reputational', 'Operational'],
    topN: 5,
    ttcTarget: 8,
    exposureTitle: 'Exposure',
    maturityLabel: 'NIST CSF 2.0',
    maturityMax: 5,
    defaultQuarter: null,
    categories: [],
    functions: [
      ['gv', 'Govern'],
      ['id', 'Identify'],
      ['pr', 'Protect'],
      ['de', 'Detect'],
      ['rs', 'Respond'],
      ['rc', 'Recover']
    ].map(function (f) {
      return { id: f[0], name: f[1], target: 3.5 };
    }),
    initiativeTypes: [
      { id: 'strategic', name: 'Strategic' },
      { id: 'ci', name: 'Continuous improvement' }
    ],
    lossBands: [
      { id: 'lb1', name: 'Low', upTo: 250000 },
      { id: 'lb2', name: 'Moderate', upTo: 1000000 },
      { id: 'lb3', name: 'Significant', upTo: 5000000 },
      { id: 'lb4', name: 'Major', upTo: 20000000 },
      { id: 'lb5', name: 'Severe', upTo: null }
    ],
    vulnGroups: [
      { id: 'app', name: 'Application' },
      { id: 'infra', name: 'Infrastructure' }
    ],
    vulnSeverities: ['Critical', 'High', 'Medium', 'Low'],
    vulnAppetite: {},
    style: defaultStyle(),
    risks: [],
    initiatives: []
  };
}
function defaultStyle() {
  return {
    accent: '#2F4B7C',
    palette: 'standard',
    theme: 'system',
    headings: 'serif',
    corners: 'rounded',
    density: 'comfortable',
    motion: 'on'
  };
}
function normalizeConfig(c) {
  c = Object.assign(defaultConfig(), clone(c));
  c.categories.forEach(function (k) {
    k.indicator = k.indicator || {};
    k.indicator.type = k.indicator.type || 'appetite';
    k.subs = k.subs || [];
    k.hidden = !!k.hidden;
  });
  c.incFocus = Math.max(1, Math.min(+c.incFocus || 2, c.severities.length || 1));
  c.vulnFocus = Math.max(1, Math.min(+c.vulnFocus || 2, (c.vulnSeverities || []).length || 1));
  delete c.cross;
  delete c.vulnSets;
  c.impacts = c.impacts || [];
  c.risks.forEach(function (r) {
    if (r.enabled === undefined) r.enabled = true;
    r.tags = r.tags || [];
    if (!Array.isArray(r.impacts)) r.impacts = r.impact ? [r.impact] : [];
    delete r.impact;
  });
  c.initiatives.forEach(function (r) {
    if (r.enabled === undefined) r.enabled = true;
    r.tags = r.tags || [];
    if (num(r.runCost) == null) r.runCost = 0;
    r.riskIds = (r.riskIds || []).filter(function (id) {
      return c.risks.some(function (x) {
        return x.id === id;
      });
    });
  });
  if (!c.initiativeTypes || !c.initiativeTypes.length) c.initiativeTypes = defaultConfig().initiativeTypes;
  if (!c.lossBands || !c.lossBands.length) c.lossBands = defaultConfig().lossBands;
  c.lossBands[c.lossBands.length - 1].upTo = null;
  c.style = Object.assign(defaultStyle(), c.style || {});
  c.vulnGroups = (c.vulnGroups || []).map(function (g) {
    return { id: g.id, name: g.name };
  });
  c.vulnAppetite = c.vulnAppetite || {};
  if (!c.vulnSeverities || !c.vulnSeverities.length) c.vulnSeverities = defaultConfig().vulnSeverities;
  return c;
}
function qKey(q) {
  return (q.year || 0) * 10 + (q.q || 0);
}
function sortedQs() {
  return Object.keys(quarters)
    .map(function (id) {
      var o = clone(quarters[id]);
      o.id = id;
      return o;
    })
    .sort(function (a, b) {
      return qKey(a) - qKey(b);
    });
}
function prevOf(id) {
  var l = sortedQs();
  for (var i = 0; i < l.length; i++) {
    if (l[i].id === id) return i > 0 ? l[i - 1] : null;
  }
  return null;
}
function isTarget(ind) {
  return ind && ind.type === 'target';
}
function statusFor(ind, v) {
  if (!ind || v == null) return null;
  if (isTarget(ind)) return (ind.direction === 'lower' ? v <= +ind.target : v >= +ind.target) ? 'on' : 'off';
  var a = +ind.appetite,
    t = +ind.tolerance;
  if (ind.direction === 'higher') return v >= a ? 'g' : v >= t ? 'a' : 'r';
  return v <= a ? 'g' : v <= t ? 'a' : 'r';
}
function catEntry(q, cat) {
  return (q && q.categories && q.categories[cat.id]) || {};
}
function catStatus(q, cat) {
  var e = catEntry(q, cat);
  if (e.status && e.status !== 'auto') return e.status;
  return statusFor(cat.indicator, num(e.value));
}
function catPrev(q, cat, prev) {
  var e = catEntry(q, cat);
  if (e.prev && e.prev !== 'auto') return e.prev === 'none' ? null : e.prev;
  return prev ? catStatus(prev, cat) : null;
}
function autoDelta(cur, pv) {
  return cur == null || pv == null ? null : +(cur - pv).toFixed(2);
}
function useDelta(tr, auto) {
  if (tr && tr.mode === 'manual') return num(tr.value);
  return auto;
}
function avgScores(q, fns) {
  var s = 0,
    n = 0;
  fns.forEach(function (f) {
    var v = num(q && q.maturity && q.maturity.scores && q.maturity.scores[f.id]);
    if (v != null) {
      s += v;
      n++;
    }
  });
  return n ? +(s / n).toFixed(2) : null;
}
function totalInc(q, sevs) {
  if (!q || !q.incidents) return null;
  var t = 0,
    any = false;
  sevs.forEach(function (s) {
    var v = num(q.incidents.counts && q.incidents.counts[s]);
    if (v != null) {
      t += v;
      any = true;
    }
  });
  return any ? t : null;
}
function movement(tr, prev, cfg) {
  if (tr.movement && tr.movement !== 'auto') return tr.movement;
  if (!prev) return null;
  var p = (prev.topRisks || []).filter(function (x) {
    return x.riskId === tr.riskId;
  })[0];
  if (!p) return 'new';
  var ci = cfg.ratings.indexOf(tr.rating),
    pi = cfg.ratings.indexOf(p.rating);
  if (ci < 0 || pi < 0 || ci === pi) return 'stable';
  return ci < pi ? 'rising' : 'falling';
}
function normalizeQ(q, cfg) {
  q = q || {};
  q.categories = q.categories || {};
  cfg.categories.forEach(function (c) {
    var e = (q.categories[c.id] = q.categories[c.id] || {});
    if (e.value === undefined) e.value = null;
    e.status = e.status || 'auto';
    e.prev = e.prev || 'auto';
    e.trend = e.trend || { mode: 'auto', value: null };
    e.subs = e.subs || {};
    c.subs.forEach(function (s) {
      e.subs[s.id] = e.subs[s.id] || 'g';
    });
  });
  q.maturity = q.maturity || {};
  q.maturity.scores = q.maturity.scores || {};
  q.maturity.notes = q.maturity.notes || {};
  q.vulns = q.vulns || {};
  cfg.vulnGroups.forEach(function (g) {
    var e = (q.vulns[g.id] = q.vulns[g.id] || {});
    e.counts = e.counts || {};
    if (e.note === undefined) e.note = '';
  });
  q.maturity.trend = q.maturity.trend || { mode: 'auto', value: null };
  q.topRisks = q.topRisks || [];
  q.incidents = q.incidents || {};
  q.incidents.counts = q.incidents.counts || {};
  delete q.incidents.trend;
  q.incidents.items = q.incidents.items || [];
  if (q.incidents.note && !q.incidents.items.length)
    q.incidents.items.push({
      id: 'n1',
      title: 'Incident summary',
      severity: cfg.severities[0] || '',
      categoryId: '',
      riskId: '',
      description: q.incidents.note,
      reportable: false,
      ttc: null
    });
  delete q.incidents.note;
  if (q.incidents.regulatory === undefined) q.incidents.regulatory = null;
  if (q.incidents.ttc === undefined) q.incidents.ttc = null;
  q.initiatives = q.initiatives || {};
  cfg.initiatives.forEach(function (it) {
    var e = (q.initiatives[it.id] = q.initiatives[it.id] || {});
    if (e.include === undefined) e.include = false;
    if (e.progress === undefined) e.progress = null;
    e.status = e.status || 'on';
    if (e.milestone === undefined) e.milestone = '';
  });
  return q;
}
function findCat(cfg, id) {
  return cfg.categories.filter(function (c) {
    return c.id === id;
  })[0];
}
function findRisk(cfg, id) {
  return cfg.risks.filter(function (r) {
    return r.id === id;
  })[0];
}
function riskInits(cfg, rid, q) {
  return cfg.initiatives.filter(function (it) {
    return (
      (it.riskIds || []).indexOf(rid) >= 0 &&
      (!q || (q.initiatives && q.initiatives[it.id] && q.initiatives[it.id].include))
    );
  });
}
function impList(r) {
  return (r && r.impacts) || [];
}
function visCats(cfg) {
  return cfg.categories.filter(function (c) {
    return !c.hidden;
  });
}
function appetiteCats(cfg) {
  return visCats(cfg).filter(function (c) {
    return !isTarget(c.indicator);
  });
}
function focusSev(list, n) {
  return list.slice(0, Math.max(1, n || 2));
}
function sevPhrase(list) {
  return list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0] || '';
}
function activeInits(cfg, q, catId) {
  return cfg.initiatives.filter(function (it) {
    var e = q.initiatives && q.initiatives[it.id];
    return e && e.include && (!catId || it.categoryId === catId);
  });
}
function counts(list) {
  var c = { g: 0, a: 0, r: 0, n: 0, on: 0, off: 0 };
  list.forEach(function (s) {
    if (c[s] != null) c[s]++;
  });
  return c;
}
function vc(q, g, k) {
  return q && q.vulns && q.vulns[g.id] && q.vulns[g.id].counts ? num(q.vulns[g.id].counts[k]) : null;
}
function sevLimit(cfg, k) {
  var l = cfg.vulnAppetite && cfg.vulnAppetite[k];
  if (!l || num(l.appetite) == null || num(l.tolerance) == null) return null;
  return {
    type: 'appetite',
    unit: 'count',
    direction: 'lower',
    appetite: +l.appetite,
    tolerance: +l.tolerance
  };
}
function worstStatus(list) {
  return list.indexOf('r') >= 0 ? 'r' : list.indexOf('a') >= 0 ? 'a' : list.indexOf('g') >= 0 ? 'g' : null;
}
function vulnTotals(cfg, q) {
  var t = {},
    any = false;
  cfg.vulnSeverities.forEach(function (k) {
    t[k] = 0;
    cfg.vulnGroups.forEach(function (g) {
      var v = vc(q, g, k);
      if (v != null) {
        t[k] += v;
        any = true;
      }
    });
  });
  return { t: t, any: any };
}
function savedQs() {
  return Object.keys(quarters).map(function (k) {
    return quarters[k];
  });
}
function tagList(x) {
  return (x && x.tags) || [];
}
function allTags(list) {
  var m = {};
  list.forEach(function (x) {
    tagList(x).forEach(function (t) {
      m[t] = (m[t] || 0) + 1;
    });
  });
  return Object.keys(m)
    .sort()
    .map(function (t) {
      return [t, m[t]];
    });
}
function riskUse(id) {
  return sortedQs()
    .filter(function (q) {
      return (q.topRisks || []).some(function (t) {
        return t.riskId === id;
      });
    })
    .map(function (q) {
      return q.label;
    });
}
function initUse(id) {
  return sortedQs()
    .filter(function (q) {
      return q.initiatives && q.initiatives[id] && q.initiatives[id].include;
    })
    .map(function (q) {
      return q.label;
    });
}
function stripCfg(c) {
  var x = clone(c);
  delete x.risks;
  delete x.initiatives;
  return x;
}
