/* Referential integrity: usage counts, clean-up rules applied on save, and the Data health check. */

function catUsage(c, id) {
  var r = c.risks.filter(function (x) {
      return x.categoryId === id;
    }).length,
    i = c.initiatives.filter(function (x) {
      return x.categoryId === id;
    }).length,
    n = 0;
  savedQs().forEach(function (q) {
    n += ((q.incidents && q.incidents.items) || []).filter(function (x) {
      return x.categoryId === id;
    }).length;
  });
  return { risks: r, inits: i, incs: n };
}
function riskUsage(c, id) {
  var t = 0,
    n = 0;
  savedQs().forEach(function (q) {
    if (
      (q.topRisks || []).some(function (x) {
        return x.riskId === id;
      })
    )
      t++;
    n += ((q.incidents && q.incidents.items) || []).filter(function (x) {
      return x.riskId === id;
    }).length;
  });
  return {
    tops: t,
    incs: n,
    inits: c.initiatives.filter(function (x) {
      return (x.riskIds || []).indexOf(id) >= 0;
    }).length
  };
}
function usageText(parts) {
  var t = parts
    .filter(function (p) {
      return p[0];
    })
    .map(function (p) {
      return plural(p[0], p[1]);
    });
  return t.length
    ? 'Linked to ' + t.join(', ') + '. These links will be removed when you save.'
    : 'Not linked to anything else.';
}
var QFIX = [];
function cfgFixes(c) {
  var n = 0,
    cats = {},
    subs = {},
    risks = {},
    types = {},
    imps = {};
  c.categories.forEach(function (k) {
    cats[k.id] = 1;
    k.subs.forEach(function (sb) {
      subs[k.id + '/' + sb.id] = 1;
    });
  });
  c.risks.forEach(function (r) {
    risks[r.id] = 1;
  });
  c.initiativeTypes.forEach(function (t) {
    types[t.id] = 1;
  });
  c.impacts.forEach(function (x) {
    imps[x] = 1;
  });
  c.risks.forEach(function (r) {
    if (r.categoryId && !cats[r.categoryId]) {
      r.categoryId = '';
      n++;
    }
    var b = impList(r).length;
    r.impacts = impList(r).filter(function (x) {
      return imps[x];
    });
    n += b - r.impacts.length;
  });
  c.initiatives.forEach(function (it) {
    if (num(it.reduction) != null && !(it.riskIds || []).length) {
      it.reduction = null;
      n++;
    }
    if (it.categoryId && !cats[it.categoryId]) {
      it.categoryId = '';
      it.subId = '';
      n++;
    }
    if (it.subId && !subs[it.categoryId + '/' + it.subId]) {
      it.subId = '';
      n++;
    }
    var b = (it.riskIds || []).length;
    it.riskIds = (it.riskIds || []).filter(function (id) {
      return risks[id];
    });
    n += b - it.riskIds.length;
    if (it.type && !types[it.type] && c.initiativeTypes.length) {
      it.type = c.initiativeTypes[0].id;
      n++;
    }
  });
  Object.keys(c.vulnAppetite || {}).forEach(function (k) {
    if (c.vulnSeverities.indexOf(k) < 0) {
      delete c.vulnAppetite[k];
      n++;
    }
  });
  return n;
}
function qFixes(q, c) {
  var n = 0,
    has = function (list, id) {
      return list.some(function (x) {
        return x.id === id;
      });
    };
  q.categories = q.categories || {};
  Object.keys(q.categories).forEach(function (k) {
    var cat = c.categories.filter(function (x) {
      return x.id === k;
    })[0];
    if (!cat) {
      delete q.categories[k];
      n++;
      return;
    }
    var sb = q.categories[k].subs || {};
    Object.keys(sb).forEach(function (s2) {
      if (!has(cat.subs, s2)) {
        delete sb[s2];
        n++;
      }
    });
  });
  if (q.maturity) {
    ['scores', 'notes'].forEach(function (f) {
      var o = q.maturity[f] || {};
      Object.keys(o).forEach(function (k) {
        if (!has(c.functions, k)) {
          delete o[k];
          n++;
        }
      });
    });
  }
  var tr = q.topRisks || [],
    b = tr.length;
  q.topRisks = tr.filter(function (t) {
    return !t.riskId || has(c.risks, t.riskId);
  });
  n += b - q.topRisks.length;
  q.topRisks.forEach(function (t) {
    if (t.rating && c.ratings.indexOf(t.rating) < 0 && c.ratings.length) {
      t.rating = c.ratings[c.ratings.length - 1];
      n++;
    }
  });
  if (q.incidents) {
    var cn = q.incidents.counts || {};
    Object.keys(cn).forEach(function (k) {
      if (c.severities.indexOf(k) < 0) {
        delete cn[k];
        n++;
      }
    });
    (q.incidents.items || []).forEach(function (x) {
      if (x.categoryId && !has(c.categories, x.categoryId)) {
        x.categoryId = '';
        n++;
      }
      if (x.riskId && !has(c.risks, x.riskId)) {
        x.riskId = '';
        n++;
      }
      if (x.severity && c.severities.indexOf(x.severity) < 0 && c.severities.length) {
        x.severity = c.severities[c.severities.length - 1];
        n++;
      }
    });
  }
  var vv = q.vulns || {};
  Object.keys(vv).forEach(function (k) {
    if (!has(c.vulnGroups, k)) {
      delete vv[k];
      n++;
      return;
    }
    var vc3 = vv[k].counts || {};
    Object.keys(vc3).forEach(function (s3) {
      if (c.vulnSeverities.indexOf(s3) < 0) {
        delete vc3[s3];
        n++;
      }
    });
  });
  var ii = q.initiatives || {};
  Object.keys(ii).forEach(function (k) {
    if (!has(c.initiatives, k)) {
      delete ii[k];
      n++;
    }
  });
  return n;
}
function integrityIssues() {
  if (!config) return [];
  var c = clone(config),
    n1 = cfgFixes(c),
    issues = [];
  if (n1) issues.push(plural(n1, 'broken link') + ' in the structure and registers');
  Object.keys(quarters).forEach(function (k) {
    var q = clone(quarters[k]),
      n = qFixes(q, c);
    if (n) issues.push(plural(n, 'orphaned value') + ' in ' + (quarters[k].label || k));
  });
  return issues;
}
async function fixIntegrity() {
  if (dirtyCfg || dirtyQ) {
    msg = 'Save or discard your changes first.';
    msgErr = true;
    updateBar();
    return;
  }
  try {
    var c = clone(config),
      n = cfgFixes(c),
      total = n;
    if (n) {
      await DB.doc('dashboard/risks').set({ items: clone(c.risks) });
      await DB.doc('dashboard/initiatives').set({ items: clone(c.initiatives) });
      await DB.doc('dashboard/config').set(stripCfg(c));
    }
    var ks = Object.keys(quarters);
    for (var i = 0; i < ks.length; i++) {
      var q = clone(quarters[ks[i]]),
        m = qFixes(q, c);
      if (m) {
        total += m;
        await DB.doc('quarters/' + ks[i]).set(q);
      }
    }
    msg = total ? 'Fixed ' + plural(total, 'problem') + '.' : 'No problems found.';
    msgErr = false;
    editQ = null;
    wq = null;
    renderConfig();
  } catch (e) {
    writeErr(e);
  }
}
function delWarn(kind, id) {
  var c = wcfg;
  if (kind === 'risk') {
    var u = riskUsage(c, id);
    return usageText([
      [u.tops, 'top risk list'],
      [u.inits, 'initiative'],
      [u.incs, 'incident']
    ]);
  }
  if (kind === 'init') {
    var n = 0;
    savedQs().forEach(function (q) {
      if (q.initiatives && q.initiatives[id]) n++;
    });
    return n ? 'Its progress in ' + plural(n, 'quarter') + ' will be removed when you save.' : '';
  }
  if (kind === 'fn') {
    return 'Its scores and commentary will be removed from every quarter when you save.';
  }
  return '';
}
