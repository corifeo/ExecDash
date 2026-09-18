/* Configure, Risks and initiatives tab: registers, filters, bulk actions, loss and value editors and their guides. */

var regView = 'risks',
  RF = { q: '', cat: '', impact: '', tag: '', src: '', used: '', en: '', page: 0 },
  IF = { q: '', cat: '', type: '', tag: '', en: '', risk: '', page: 0 },
  editRisk = null,
  editInit = null,
  PAGE = 12,
  SEL = { r: {}, i: {} };
function pager(total, page, key) {
  var pages = Math.max(1, Math.ceil(total / PAGE));
  if (page >= pages) page = pages - 1;
  if (page < 0) page = 0;
  var from = total ? page * PAGE + 1 : 0,
    to = Math.min(total, (page + 1) * PAGE);
  return {
    page: page,
    html:
      '<div class="pager"><span class="al">' +
      from +
      ' to ' +
      to +
      ' of ' +
      total +
      '</span>' +
      (pages > 1
        ? '<button class="btn" data-act="page" data-k="' +
          key +
          '" data-a="' +
          (page - 1) +
          '"' +
          (page <= 0 ? ' disabled' : '') +
          '>Previous</button><span class="al">Page ' +
          (page + 1) +
          ' of ' +
          pages +
          '</span><button class="btn" data-act="page" data-k="' +
          key +
          '" data-a="' +
          (page + 1) +
          '"' +
          (page >= pages - 1 ? ' disabled' : '') +
          '>Next</button>'
        : '') +
      '</div>'
  };
}
function chipRow(act, key, cur, opts) {
  return (
    '<div class="fchips" role="group">' +
    opts
      .map(function (o) {
        return (
          '<button class="chip" data-act="' +
          act +
          '" data-k="' +
          key +
          '" data-a="' +
          esc(o[0]) +
          '" aria-pressed="' +
          (String(cur) === String(o[0])) +
          '">' +
          esc(o[1]) +
          (o[2] != null ? ' <span class="cnt">' + o[2] + '</span>' : '') +
          '</button>'
        );
      })
      .join('') +
    '</div>'
  );
}
function cfgRegister() {
  var c = wcfg,
    er = c.risks.filter(function (r) {
      return r.enabled;
    }).length,
    ei = c.initiatives.filter(function (r) {
      return r.enabled;
    }).length;
  var sw =
    '<div class="regsw seg"><button data-act="regview" data-a="risks" aria-pressed="' +
    (regView === 'risks') +
    '">Risk register <span class="cnt">' +
    er +
    ' of ' +
    c.risks.length +
    ' enabled</span></button><button data-act="regview" data-a="inits" aria-pressed="' +
    (regView === 'inits') +
    '">Initiative register <span class="cnt">' +
    ei +
    ' of ' +
    c.initiatives.length +
    ' enabled</span></button></div>';
  return (
    '<section class="csec">' +
    sw +
    '<p class="hint">Only enabled items are offered in Quarter data. Disabling an item never removes it from quarters that already use it.</p>' +
    (regView === 'risks' ? riskReg(c) : initReg(c)) +
    '</section>'
  );
}
var LASTIDS = { r: [], i: [] };
function bulkBar(k, list) {
  LASTIDS[k] = list.map(function (o) {
    return o.id;
  });
  var sel = SEL[k],
    n = Object.keys(sel).length,
    ids = list.map(function (o) {
      return o.id;
    }),
    allOn =
      ids.length &&
      ids.every(function (id) {
        return sel[id];
      });
  return (
    '<div class="bulk' +
    (n ? ' on' : '') +
    '"><label class="selall"><input type="checkbox" data-selall="' +
    k +
    '"' +
    (allOn ? ' checked' : '') +
    '> Select all ' +
    ids.length +
    ' matching</label>' +
    (n
      ? '<span class="bcount">' +
        n +
        ' selected</span><button class="btn" data-act="bulk" data-k="' +
        k +
        '" data-a="enable">Enable</button><button class="btn" data-act="bulk" data-k="' +
        k +
        '" data-a="disable">Disable</button>' +
        '<button class="btn danger' +
        (armed === 'bulk:' + k ? ' armed' : '') +
        '" data-act="bulk" data-k="' +
        k +
        '" data-a="delete">' +
        (armed === 'bulk:' + k ? 'Confirm delete ' + n : 'Delete') +
        '</button>' +
        (armed === 'bulk:' + k
          ? '<span class="delwarn">' +
            (k === 'r'
              ? 'Their links in initiatives, top risk lists and incidents will be removed when you save.'
              : 'Their progress in every quarter will be removed when you save.') +
            '</span>'
          : '') +
        '<button class="btn link" data-act="bulk" data-k="' +
        k +
        '" data-a="clear">Clear selection</button>'
      : '<span class="al">Tick items to enable, disable or delete several at once.</span>') +
    '</div>'
  );
}
function rowHead(k, id, enabled, name, chips, open, editAct) {
  return (
    '<div class="rhead"><input type="checkbox" class="rsel" data-sel="' +
    k +
    ':' +
    esc(id) +
    '"' +
    (SEL[k][id] ? ' checked' : '') +
    ' aria-label="Select ' +
    esc(name) +
    '">' +
    '<button class="sw' +
    (enabled ? ' on' : '') +
    '" data-act="toggle" data-k="' +
    k +
    '" data-a="' +
    esc(id) +
    '" role="switch" aria-checked="' +
    !!enabled +
    '" aria-label="' +
    (enabled ? 'Disable ' : 'Enable ') +
    esc(name) +
    '"><i></i></button>' +
    '<div class="rmain' +
    (enabled ? '' : ' off') +
    '"><div class="rn">' +
    esc(name) +
    '</div><div class="rtags">' +
    chips +
    '</div></div><button class="btn" data-act="' +
    editAct +
    '" data-a="' +
    esc(id) +
    '" aria-expanded="' +
    open +
    '">' +
    (open ? 'Done' : 'Edit') +
    '</button></div>'
  );
}
// Worked examples for the loss estimate guide. Values sit on the dial steps so they apply exactly.
// Tags use the register vocabulary, so the guide can suggest the example that fits the risk being edited.
var FAIR_EX = [
  {
    key: 'gdpr',
    title: 'Personal data breach',
    tags: ['Data loss', 'Regulatory', 'Encryption', 'Retention', 'Non-production', 'Human error'],
    when: 'Client personal data is exposed or stolen and the breach must be reported to the ICO within 72 hours.',
    anchor:
      'UK GDPR fines reach \u00a317.5m or 4% of global annual turnover. The ICO fined British Airways \u00a320m and Marriott \u00a318.4m in 2020, and Ticketmaster \u00a31.25m. Most breaches end with no fine but still cost hundreds of thousands to handle.',
    f: [0.1, 0.3, 1],
    l: [100000, 1000000, 20000000]
  },
  {
    key: 'ato',
    title: 'Stolen customer accounts',
    tags: ['Identity', 'Client-facing', 'Session security'],
    when: 'Attackers take over client accounts, usually with reused passwords, and move money or change details.',
    anchor:
      'The FCA fined Tesco Bank \u00a316.4m in 2018 after a 2016 attack took about \u00a32.26m from customer accounts. That was an extreme case; most account takeover waves cost far less.',
    f: [0.5, 1, 3],
    l: [50000, 250000, 3000000]
  },
  {
    key: 'ransom',
    title: 'Ransomware outage',
    tags: ['Ransomware', 'Malware', 'Endpoints', 'Network', 'Privileged access'],
    when: 'Systems are encrypted and key services are down for days while they are rebuilt.',
    anchor:
      'Recovery usually takes weeks, and the outage, not any ransom, drives most of the cost. Firms must also show they stayed within impact tolerances for important business services.',
    f: [0.05, 0.2, 0.5],
    l: [500000, 3000000, 15000000]
  },
  {
    key: 'bec',
    title: 'Payment diversion or fraud',
    tags: ['Fraud', 'Phishing', 'AI', 'Social engineering'],
    when: 'A mailbox is spoofed or taken over, or a caller impersonates an executive, and a payment goes to the wrong account.',
    anchor:
      'Individual losses are often tens of thousands of pounds, occasionally over a million when a large supplier payment is redirected.',
    f: [0.5, 1, 3],
    l: [25000, 100000, 1000000]
  },
  {
    key: 'supplier',
    title: 'Breach at a critical supplier',
    tags: [
      'Third party',
      'Supply chain',
      'Open source',
      'Build pipeline',
      'Release integrity',
      'Integrations',
      'Shadow IT'
    ],
    when: 'A supplier or software you depend on is compromised, and your data or service is caught up in it.',
    anchor:
      'In 2023 a flaw in the MOVEit file transfer tool exposed data at hundreds of organisations. Staff at British Airways, the BBC and Boots were affected through their payroll provider.',
    f: [0.05, 0.2, 1],
    l: [100000, 750000, 10000000]
  },
  {
    key: 'insider',
    title: 'Insider takes client data',
    tags: ['Insider', 'Joiners and leavers'],
    when: 'An employee or contractor copies client data out of the firm, for gain or out of grievance.',
    anchor:
      'The Supreme Court ruled in 2020 that Morrisons was not liable for an employee who leaked payroll data on about 100,000 staff, but the case took six years to settle.',
    f: [0.05, 0.2, 0.5],
    l: [50000, 500000, 5000000]
  },
  {
    key: 'vuln',
    title: 'Exploited internet-facing flaw',
    tags: ['Patching', 'Attack surface', 'Legacy', 'Cloud', 'API', 'Asset inventory', 'Secrets'],
    when: 'A known weakness in an exposed system is used to get in before it is fixed.',
    anchor:
      'Flaws such as Log4j in 2021 and MOVEit in 2023 were exploited within days of being published, so the patching window is short.',
    f: [0.2, 0.5, 2],
    l: [100000, 750000, 7500000]
  },
  {
    key: 'detect',
    title: 'Intrusion found late',
    tags: ['Detection', 'Logging', 'Incident response', 'Assurance', 'Control failure', 'Evidence', 'Change'],
    when: 'An attacker is inside for weeks before anyone notices, so the damage and the clean-up are larger.',
    anchor:
      'The longer an intrusion runs, the more it costs: more systems to rebuild, more data to review and a harder conversation with the regulator.',
    f: [0.1, 0.3, 1],
    l: [100000, 1000000, 10000000]
  }
];
// Log-scale position, so a range from \u00a310k to \u00a320m reads evenly.
function logPos(v, lo, hi) {
  var x = Math.log10(Math.max(v, lo)),
    a = Math.log10(lo),
    b = Math.log10(hi);
  return Math.max(0, Math.min(100, ((x - a) / (b - a)) * 100));
}
// A range bar: shaded from low to worst, a dot at the typical value.
function rangeViz(label, vals, lo, hi, fmtFn, cls) {
  var a = logPos(vals[0], lo, hi),
    m = logPos(vals[1], lo, hi),
    b = logPos(vals[2], lo, hi);
  return (
    '<div class="rviz ' +
    cls +
    '"><span class="rvl">' +
    label +
    '</span><span class="rvt"><i class="rvr" style="left:' +
    a +
    '%;width:' +
    Math.max(1, b - a) +
    '%"></i><i class="rvm" style="left:' +
    m +
    '%"></i></span><span class="rvv"><span>' +
    esc(fmtFn(vals[0])) +
    '</span><b>' +
    esc(fmtFn(vals[1])) +
    '</b><span>' +
    esc(fmtFn(vals[2])) +
    '</span></span></div>'
  );
}
var GICON = {
  freq: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  cost: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6.5A3.5 3.5 0 0 0 9 9v9M7 13h6M7 18h10"/></svg>',
  who: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 14c3 0 6 1.5 6 4.5"/></svg>',
  cut: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h5"/></svg>',
  ratio:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18l6-6 4 4 6-8"/><path d="M15 8h5v5"/></svg>'
};
// The example whose tags overlap most with the record being edited, or null.
function bestExample(list, tags) {
  var best = null,
    top = 0;
  list.forEach(function (x) {
    var n = x.tags.filter(function (t) {
      return tags.indexOf(t) >= 0;
    }).length;
    if (n > top) {
      top = n;
      best = x;
    }
  });
  return best;
}
// Shared guide template: a lead line, three icon cards, then one example at a time.
// o: { lead, steps: [[icon, title, text]], examples, pane(x), current: { name, tags }, useAct, idx, note }
function guideModal(o) {
  var pick = o.current ? bestExample(o.examples, o.current.tags) : null,
    on = pick ? pick.key : o.examples[0].key;
  var match = pick
    ? '<div class="gmatch"><span><b>Closest example for \u201c' +
      esc(o.current.name) +
      '\u201d:</b> ' +
      esc(pick.title) +
      '</span><button class="btn primary" data-act="' +
      o.useAct +
      '" data-a="' +
      o.idx +
      '" data-d="' +
      pick.key +
      '">Fill in this ' +
      esc(o.kind) +
      '</button></div>'
    : '';
  return (
    '<p class="glead">' +
    o.lead +
    '</p><div class="gsteps">' +
    o.steps
      .map(function (x) {
        return (
          '<div class="gstep"><span class="gi">' +
          GICON[x[0]] +
          '</span><b>' +
          x[1] +
          '</b><span>' +
          x[2] +
          '</span></div>'
        );
      })
      .join('') +
    '</div>' +
    match +
    '<div class="gex2"><span class="al">Examples</span><div class="gtabs" role="tablist">' +
    o.examples
      .map(function (x) {
        return (
          '<button class="chip' +
          (pick && x.key === pick.key ? ' gbest' : '') +
          '" role="tab" data-act="gtab" data-a="' +
          x.key +
          '" aria-pressed="' +
          (x.key === on) +
          '">' +
          esc(x.title) +
          '</button>'
        );
      })
      .join('') +
    '</div>' +
    o.examples
      .map(function (x) {
        return (
          '<div class="gpane' +
          (x.key === on ? ' on' : '') +
          '" data-g="' +
          x.key +
          '"><p class="gwhen">' +
          esc(x.when) +
          '</p>' +
          o.pane(x) +
          '<p class="gscale"><b>For scale.</b> ' +
          esc(x.anchor) +
          '</p>' +
          (o.idx != null
            ? '<button class="btn" data-act="' +
              o.useAct +
              '" data-a="' +
              o.idx +
              '" data-d="' +
              x.key +
              '">Use these values</button>'
            : '') +
          '</div>'
        );
      })
      .join('') +
    '</div><p class="al gnote">' +
    o.note +
    '</p>'
  );
}
function fairGuide(i) {
  var r = i != null && wcfg ? wcfg.risks[i] : null;
  return guideModal({
    kind: 'risk',
    lead: '<b>Give a range, not one number:</b> the lowest you would believe, the most likely, and the worst you can reasonably imagine.',
    steps: [
      ['freq', 'How often', 'Only events that cost money. A blocked phish is not one; a refund is.'],
      ['cost', 'What it costs', 'One event, end to end: response, recovery, redress and fines.'],
      ['who', 'Who knows', 'Security for how often. Finance, legal and op risk for cost.']
    ],
    examples: FAIR_EX,
    pane: function (x) {
      return (
        rangeViz('How often', x.f, 0.02, 20, freqTxt, 'rvf') +
        rangeViz('Each time', x.l, 10000, 50000000, money, 'rvc')
      );
    },
    current: r ? { name: r.name, tags: tagList(r) } : null,
    useAct: 'fairex',
    idx: i,
    note: 'Illustrative. Fines and incidents are public outcomes; check current figures before relying on them.'
  });
}
function fairEditor(c, r, i) {
  var p = 'c:risks.' + i + '.fair',
    f = r.fair;
  if (!f)
    return (
      '<div class="fair empty"><div><b>Quantified loss</b><p class="desc">No estimate yet. Add one to show this risk on the loss tracker.</p></div>' +
      '<span class="fbtns"><button class="btn" data-act="fairguide" data-a="' +
      i +
      '">How to estimate</button>' +
      addBtn('addfair', 'Add loss estimate', ' data-a="' + i + '"') +
      '</span>' +
      '</div>'
    );
  var res = simRisk(r);
  var fr = function (v) {
      return v == null ? '?' : freqTxt(+v);
    },
    mo = function (v) {
      return v == null ? '?' : money(+v);
    };
  // Each step reads its answer back as a sentence, so mistakes show as they are made.
  var freqSay =
    f.fMin != null && f.fMl != null && f.fMax != null
      ? 'Between ' + fr(f.fMin) + ' and ' + fr(f.fMax) + ', most likely ' + fr(f.fMl) + '.'
      : 'Set all three dials.';
  var costSay =
    f.lMin != null && f.lMl != null && f.lMax != null
      ? 'Between ' + mo(f.lMin) + ' and ' + mo(f.lMax) + ' each time, most likely ' + mo(f.lMl) + '.'
      : 'Set all three dials.';
  var step = function (n, title, q, dials, say, cls) {
    return (
      '<div class="fstep' +
      (cls ? ' ' + cls : '') +
      '"><div class="fsh"><span class="fsn">' +
      n +
      '</span><b>' +
      title +
      '</b></div><p class="fq">' +
      q +
      '</p><div class="dials">' +
      dials +
      '</div><p class="fsay">' +
      esc(say) +
      '</p></div>'
    );
  };
  var result = res
    ? '<div class="fstep fout"><div class="fsh"><span class="fsn">3</span><b>What this means</b>' +
      info(
        'The tool simulates ' +
          SIMN.toLocaleString('en-GB') +
          ' years. In each year it draws how many loss events happen from your frequency range, then a cost for each event from your cost range. The results are averaged. Expected loss is the average year; the 1 in 10 year figure is a bad year that is beaten only one year in ten.'
      ) +
      '</div><div class="fstats">' +
      '<div class="fstat on"><b>' +
      esc(money(res.mean)) +
      '</b><span>typical year</span><em>On dashboard</em></div>' +
      '<div class="fstat"><b>' +
      esc(money(res.p90)) +
      '</b><span>1 in 10 year</span></div>' +
      '<div class="fstat"><b>' +
      Math.round(res.pEvent * 100) +
      '%</b><span>chance of a loss</span></div></div>' +
      lossTracker(c.lossBands, res, { big: true, labels: true, bandTips: true }) +
      '</div>'
    : '<div class="fstep fout"><div class="fsh"><span class="fsn">3</span><b>What this means</b></div><p class="fq">Set all six dials to see the result.</p></div>';
  return (
    '<div class="fair"><div class="fhead"><b>Quantified loss</b><span class="desc">Estimate how often this risk costs money and how much, as a range. The dashboard uses the result.</span><span class="fbtns"><button class="btn" data-act="fairguide" data-a="' +
    i +
    '">How to estimate</button>' +
    delBtn('fair:' + i, 'Delete estimate', 'Removes this loss estimate. The risk stays.') +
    '</span></div>' +
    '<div class="fsteps">' +
    step(
      1,
      'How often does it cause a loss?',
      'Count events that cost money, not every attempt.',
      knob(p + '.fMin', f.fMin, 'freq', 'Rarely', { small: true }) +
        knob(p + '.fMl', f.fMl, 'freq', 'Typically', { small: true }) +
        knob(p + '.fMax', f.fMax, 'freq', 'At worst', { small: true }),
      freqSay
    ) +
    step(
      2,
      'What does each loss cost?',
      'End to end: response, recovery, compensation and fines.',
      knob(p + '.lMin', f.lMin, 'money', 'Low', { small: true }) +
        knob(p + '.lMl', f.lMl, 'money', 'Typical', { small: true }) +
        knob(p + '.lMax', f.lMax, 'money', 'Worst', { small: true }),
      costSay,
      'fcost'
    ) +
    result +
    '</div></div>'
  );
}
function riskReg(c) {
  var catOpts = [['', 'None']].concat(
    c.categories.map(function (x) {
      return [x.id, x.name];
    })
  );
  var tags = allTags(c.risks),
    f = RF,
    qq = f.q.trim().toLowerCase();
  var list = c.risks
    .map(function (r, i) {
      return { r: r, i: i, id: r.id };
    })
    .filter(function (o) {
      var r = o.r,
        k = findCat(c, r.categoryId);
      if (f.en === 'on' && !r.enabled) return false;
      if (f.en === 'off' && r.enabled) return false;
      if (f.cat && (f.cat === '_none' ? k : r.categoryId !== f.cat)) return false;
      if (f.impact && (f.impact === '_none' ? impList(r).length : impList(r).indexOf(f.impact) < 0))
        return false;
      if (f.tag && tagList(r).indexOf(f.tag) < 0) return false;
      if (f.src === 'lib' && r.source !== 'library') return false;
      if (f.src === 'custom' && r.source === 'library') return false;
      if (f.used === 'yes' && !riskUse(r.id).length) return false;
      if (f.used === 'linked' && !riskInits(c, r.id).length) return false;
      if (f.used === 'unlinked' && riskInits(c, r.id).length) return false;
      if (
        qq &&
        (r.name + ' ' + (k ? k.name : '') + ' ' + impList(r).join(' ') + ' ' + tagList(r).join(' '))
          .toLowerCase()
          .indexOf(qq) < 0
      )
        return false;
      return true;
    });
  if (
    editRisk &&
    !list.some(function (o) {
      return o.id === editRisk;
    })
  ) {
    var ix = c.risks.findIndex(function (r) {
      return r.id === editRisk;
    });
    if (ix >= 0) list.unshift({ r: c.risks[ix], i: ix, id: editRisk });
  }
  var pg = pager(list.length, f.page, 'risk');
  f.page = pg.page;
  var nOn = c.risks.filter(function (r) {
    return r.enabled;
  }).length;
  var out =
    '<div class="fbar"><div class="rowf">' +
    fld(
      'Search',
      '<input type="search" id="rsearch" value="' +
        esc(f.q) +
        '" placeholder="Name, category, impact or tag">',
      'wide'
    ) +
    fld(
      'Impact',
      '<select id="rf-impact">' +
        opt('', 'All impacts', f.impact) +
        c.impacts
          .map(function (x) {
            return opt(x, x, f.impact);
          })
          .join('') +
        opt('_none', 'No impact set', f.impact) +
        '</select>'
    ) +
    fld(
      'Tag',
      '<select id="rf-tag">' +
        opt('', 'All tags', f.tag) +
        tags
          .map(function (t) {
            return opt(t[0], t[0] + ' (' + t[1] + ')', f.tag);
          })
          .join('') +
        '</select>'
    ) +
    fld(
      'Source',
      '<select id="rf-src">' +
        opt('', 'All', f.src) +
        opt('lib', 'Library', f.src) +
        opt('custom', 'Custom', f.src) +
        '</select>'
    ) +
    fld(
      'Usage',
      '<select id="rf-used">' +
        opt('', 'All risks', f.used) +
        opt('yes', 'Used in a top risks list', f.used) +
        opt('linked', 'Linked to an initiative', f.used) +
        opt('unlinked', 'No linked initiative', f.used) +
        '</select>'
    ) +
    '<button class="btn link" data-act="rfclear">Clear filters</button></div>' +
    chipRow('rf', 'en', f.en, [
      ['', 'All', c.risks.length],
      ['on', 'Enabled', nOn],
      ['off', 'Disabled', c.risks.length - nOn]
    ]) +
    chipRow(
      'rf',
      'cat',
      f.cat,
      [['', 'All categories', c.risks.length]]
        .concat(
          c.categories
            .map(function (k) {
              return [
                k.id,
                k.name,
                c.risks.filter(function (r) {
                  return r.categoryId === k.id;
                }).length
              ];
            })
            .filter(function (x) {
              return x[2];
            })
        )
        .concat(
          c.risks.some(function (r) {
            return !findCat(c, r.categoryId);
          })
            ? [
                [
                  '_none',
                  'No category',
                  c.risks.filter(function (r) {
                    return !findCat(c, r.categoryId);
                  }).length
                ]
              ]
            : []
        )
    ) +
    bulkBar('r', list) +
    '</div>';
  out +=
    '<div class="addbar">' +
    addBtn('addrisk', 'Add risk') +
    '<span class="al">To load a curated library, import data/cyber-risk-library.json under Data.</span></div>';
  var rows = list
    .slice(pg.page * PAGE, (pg.page + 1) * PAGE)
    .map(function (o) {
      var r = o.r,
        i = o.i,
        k = findCat(c, r.categoryId),
        use = riskUse(r.id),
        p = 'c:risks.' + i;
      var chips =
        (k
          ? '<button class="tg cat" data-act="rf" data-k="cat" data-a="' +
            esc(k.id) +
            '">' +
            esc(k.name) +
            '</button>'
          : '<span class="tg warn">No category</span>') +
        impList(r)
          .map(function (x) {
            return (
              '<button class="tg imp" data-act="rf" data-k="impact" data-a="' +
              esc(x) +
              '">' +
              esc(x) +
              '</button>'
            );
          })
          .join('') +
        tagList(r)
          .map(function (t) {
            return (
              '<button class="tg" data-act="rf" data-k="tag" data-a="' + esc(t) + '">#' + esc(t) + '</button>'
            );
          })
          .join('') +
        (function () {
          var res = simRisk(r);
          return res
            ? '<span class="tg loss" title="' +
                esc(money(res.mean)) +
                ' expected a year"><span class="sw2" style="background:' +
                bandCol(bandIdx(c.lossBands, res.mean), c.lossBands.length) +
                '"></span>' +
                esc(bandName(c.lossBands, res.mean)) +
                ' loss</span>'
            : '';
        })() +
        (function () {
          var n = riskInits(c, r.id).length;
          return n
            ? '<button class="tg lnk" data-act="showlinked" data-a="' +
                esc(r.id) +
                '" title="Show linked initiatives">' +
                n +
                ' linked initiative' +
                (n > 1 ? 's' : '') +
                '</button>'
            : '';
        })() +
        (r.source === 'library' ? '' : '<span class="tg src">Custom</span>') +
        (use.length
          ? '<span class="tg use" title="' +
            esc(use.join(', ')) +
            '">Top risk in ' +
            use.length +
            ' quarter' +
            (use.length > 1 ? 's' : '') +
            '</span>'
          : '');
      var open = editRisk === r.id;
      return (
        '<div class="rrow' +
        (open ? ' open' : '') +
        '">' +
        rowHead('r', r.id, r.enabled, r.name, chips, open, 'editrisk') +
        (open
          ? '<div class="redit"><div class="rowf">' +
            fld('Risk', inp(p + '.name', r.name, 'text', ' data-rr style="width:100%"'), 'wide') +
            '</div><div class="rowf">' +
            fld('Category', sel(p + '.categoryId', catOpts, r.categoryId, true)) +
            fld(
              'Impacts',
              multiPick('c:risks.' + i + '.impacts', c.impacts, impList(r), 'Impacts'),
              'wide',
              'Select every type of impact the risk could have. The list is set under Structure.'
            ) +
            fld(
              'Tags',
              tagEditor(p + '.tags', tagList(r), {
                label: 'Risk tags',
                placeholder: 'Add tag',
                suggest: allTags(c.risks).map(function (t) {
                  return t[0];
                })
              }),
              'wide'
            ) +
            '<div class="tools" style="align-self:flex-end">' +
            delBtn('risk:' + r.id, 'Delete', delWarn('risk', r.id)) +
            '</div></div>' +
            fairEditor(c, r, i) +
            '</div>'
          : '') +
        '</div>'
      );
    })
    .join('');
  return (
    out +
    '<div class="rlist">' +
    (rows || '<p class="desc" style="padding:14px">No risks match these filters.</p>') +
    '</div>' +
    pg.html
  );
}
function linkEditor(c, it, i) {
  var ids = (it.riskIds || []).filter(function (id) {
    return findRisk(c, id);
  });
  var cands = c.risks.filter(function (r) {
    return r.enabled && ids.indexOf(r.id) < 0;
  });
  var own = cands.filter(function (r) {
      return r.categoryId === it.categoryId;
    }),
    other = cands.filter(function (r) {
      return r.categoryId !== it.categoryId;
    });
  var o = function (r) {
    var k = findCat(c, r.categoryId);
    return (
      '<option value="' +
      esc(r.id) +
      '">' +
      esc(r.name) +
      (k && r.categoryId !== it.categoryId ? ' (' + esc(k.name) + ')' : '') +
      '</option>'
    );
  };
  return (
    '<div class="tagedit linked" role="group" aria-label="Linked risks">' +
    ids
      .map(function (id) {
        var r = findRisk(c, id),
          k = findCat(c, r.categoryId);
        return (
          '<span class="tchip rlink">' +
          esc(r.name) +
          (k ? '<span class="tcount">' + esc(k.name) + '</span>' : '') +
          (r.enabled ? '' : '<span class="tcount">disabled</span>') +
          '<button class="tx" data-act="ilink-del" data-a="' +
          i +
          '" data-d="' +
          esc(id) +
          '" aria-label="Unlink ' +
          esc(r.name) +
          '">&#215;</button></span>'
        );
      })
      .join('') +
    (cands.length
      ? '<span class="tnew"><select id="il:' +
        i +
        '" aria-label="Risk to link"><option value="">Link an enabled risk</option>' +
        (own.length ? '<optgroup label="Same category">' + own.map(o).join('') + '</optgroup>' : '') +
        (other.length ? '<optgroup label="Other categories">' + other.map(o).join('') + '</optgroup>' : '') +
        '</select><button class="btn tplus" data-act="ilink-add" data-a="' +
        i +
        '" aria-label="Link risk">+</button></span>'
      : '<span class="al">No more enabled risks to link.</span>') +
    (ids.length ? '' : '<span class="al">Not linked. Links are optional.</span>') +
    '</div>'
  );
}
// Typical initiatives with their cost, running cost and reduction, on the dial steps.
var VAL_EX = [
  {
    key: 'mfa',
    title: 'Phishing-resistant MFA',
    tags: ['Identity', 'Phishing', 'Session security', 'Client-facing'],
    when: 'Replaces passwords and codes with passkeys or security keys for staff, so stolen credentials stop working.',
    anchor:
      'One of the strongest single controls against account takeover. Licences and hardware keep a running cost.',
    cost: 250000,
    run: 75000,
    red: 50
  },
  {
    key: 'pam',
    title: 'Privileged access management',
    tags: ['Privileged access', 'Secrets', 'Integrations', 'Insider'],
    when: 'Puts administrator accounts and secrets in a vault, with approval and recording for their use.',
    anchor: 'Cuts how far an attacker or insider can go once inside. Takes a year or more to roll out fully.',
    cost: 500000,
    run: 100000,
    red: 40
  },
  {
    key: 'aware',
    title: 'Awareness and drills',
    tags: ['Social engineering', 'Phishing', 'Fraud', 'AI', 'Human error'],
    when: 'Targeted training, phishing simulations and call-back drills for the teams most at risk.',
    anchor: 'Cheap and worth doing, but people still make mistakes, so expect a modest reduction.',
    cost: 50000,
    run: 25000,
    red: 15
  },
  {
    key: 'legacy',
    title: 'Retire a legacy platform',
    tags: ['Legacy', 'Patching', 'Endpoints'],
    when: 'Moves services off an unsupported system and switches it off.',
    anchor:
      'Removes the exposure rather than reducing it, so the reduction is high. Often no extra running cost.',
    cost: 750000,
    run: 0,
    red: 75
  },
  {
    key: 'dlp',
    title: 'Data loss prevention',
    tags: ['Data loss', 'Shadow IT', 'Encryption', 'Retention'],
    when: 'Detects and blocks client data leaving by email, web upload or removable media.',
    anchor:
      'Catches accidents well and determined insiders less well. Needs tuning and people to review alerts.',
    cost: 150000,
    run: 50000,
    red: 30
  },
  {
    key: 'seg',
    title: 'Network segmentation',
    tags: ['Network', 'Ransomware', 'Malware'],
    when: 'Splits the network so an infection in one area cannot spread to critical systems.',
    anchor: 'Limits how much a ransomware attack can take down, which is where most of its cost comes from.',
    cost: 500000,
    run: 50000,
    red: 40
  },
  {
    key: 'mdr',
    title: 'Detection and response service',
    tags: ['Detection', 'Logging', 'Incident response'],
    when: 'A monitored service that watches logs around the clock and contains intrusions quickly.',
    anchor: 'Does not stop attacks, but finding them in hours rather than weeks cuts what each one costs.',
    cost: 250000,
    run: 150000,
    red: 30
  },
  {
    key: 'patch',
    title: 'Faster patching',
    tags: ['Patching', 'Attack surface', 'Asset inventory', 'Cloud', 'API'],
    when: 'Automates patching and sets tight deadlines for internet-facing systems.',
    anchor: 'Shrinks the window in which known flaws can be used against you.',
    cost: 150000,
    run: 50000,
    red: 35
  },
  {
    key: 'tprm',
    title: 'Supplier assurance',
    tags: ['Third party', 'Supply chain', 'Assurance', 'Evidence'],
    when: 'Tiers suppliers, checks the critical ones properly and plans for their failure.',
    anchor: 'You cannot control a supplier, so the reduction comes mostly from being ready when one fails.',
    cost: 100000,
    run: 50000,
    red: 20
  }
];
// Three-year cost as one stacked bar (deliver, then running), then the reduction as a share.
function valueViz(x) {
  var tot = x.cost + x.run * 3 || 1;
  return (
    '<div class="rviz rvc"><span class="rvl">3-year cost</span><span class="rvt rvs"><i class="rvd" style="width:' +
    (x.cost / tot) * 100 +
    '%"></i><i class="rvr2" style="width:' +
    ((x.run * 3) / tot) * 100 +
    '%"></i></span><span class="rvv"><span><b>' +
    esc(money(x.cost)) +
    '</b> to deliver</span><span>' +
    (x.run ? '<b>' + esc(money(x.run)) + '</b> a year to run' : 'Nothing to run') +
    '</span></span></div>' +
    '<div class="rviz rvf"><span class="rvl">Reduction</span><span class="rvt"><i class="rvr" style="left:0;width:' +
    x.red +
    '%"></i></span><span class="rvv"><span><b>' +
    x.red +
    '%</b> of the linked risks\u2019 loss</span><span></span></span></div>'
  );
}
function valueGuide(i) {
  var it = i != null && wcfg ? wcfg.initiatives[i] : null;
  return guideModal({
    kind: 'initiative',
    lead: '<b>Avoided loss is what the linked risks stop costing once this is delivered, less what it costs to run.</b> Link the risks it really reduces, and make sure they have loss estimates.',
    steps: [
      ['cost', 'What it costs', 'Once to deliver, then each year to run: licences, support and people.'],
      [
        'cut',
        'How much it removes',
        'Share of the linked risks\u2019 loss that goes away. Few controls remove more than half.'
      ],
      [
        'ratio',
        'Is it worth it',
        'Net avoided loss a year against the cost to deliver. Above 1\u00d7 it pays back within a year.'
      ]
    ],
    examples: VAL_EX,
    pane: valueViz,
    current: it ? { name: it.name, tags: tagList(it) } : null,
    useAct: 'ivex',
    idx: i,
    note: 'Illustrative figures for a mid-sized UK financial services firm. Scale them to your own size and quotes.'
  });
}
function valueEditor(c, it, i) {
  var p = 'c:initiatives.' + i,
    v = initValue(c, it),
    cost = num(it.cost),
    red = num(it.reduction);
  var btns =
    '<span class="fbtns"><button class="btn" data-act="valguide" data-a="' + i + '">How to estimate</button>';
  if (cost == null && red == null)
    return (
      '<div class="fair empty"><div><b>Avoided loss against cost</b><p class="desc">No estimate yet. Add one to show what this initiative saves on the dashboard.</p></div>' +
      btns +
      addBtn('addival', 'Add value estimate', ' data-a="' + i + '"') +
      '</span></div>'
    );
  var lr = (it.riskIds || [])
    .map(function (id) {
      return findRisk(c, id);
    })
    .filter(Boolean);
  // Linked risks with their expected loss, so the reduction has something concrete to act on.
  var riskList = lr.length
    ? '<ul class="vrisks">' +
      lr
        .map(function (r) {
          var sm = simRisk(r);
          return (
            '<li><span>' +
            esc(r.name) +
            '</span><b>' +
            (sm ? esc(money(sm.mean)) + ' a year' : '<span class="al">No estimate</span>') +
            '</b></li>'
          );
        })
        .join('') +
      '</ul>'
    : '<p class="fq">No risks linked. Link them above to calculate avoided loss.</p>';
  var run = num(it.runCost) || 0;
  var costSay =
    cost == null
      ? 'Set the cost.'
      : esc(money(cost)) +
        ' to deliver' +
        (run ? ', then ' + esc(money(run)) + ' a year to run.' : ', nothing to run.');
  var redSay =
    red == null
      ? 'Set the reduction.'
      : v.est
        ? 'Removes ' + red + '% of ' + esc(money(v.base)) + ' a year.'
        : 'Removes ' + red + '% of the linked risks\u2019 loss, once they have estimates.';
  var after = v.avoided != null ? v.base - v.avoided : null;
  var mx = Math.max(v.base || 0, cost || 0, 1);
  var after2 = after != null ? after + run : null;
  var bar = function (cls, lab, val, tipTitle, rows) {
    return (
      '<div class="vbrow" tabindex="0"' +
      tip(tipHtml(tipTitle, rows)) +
      '><span class="vbl">' +
      lab +
      '</span><span class="vbt"><i class="' +
      cls +
      '" style="--w:' +
      ((val || 0) / mx) * 100 +
      '%"></i></span><b>' +
      (val == null ? '' : esc(money(val))) +
      '</b></div>'
    );
  };
  var result =
    v.avoided != null
      ? '<div class="fstats">' +
        '<div class="fstat on"><b' +
        (v.net < 0 ? ' class="low"' : '') +
        '>' +
        esc(money(v.net)) +
        '</b><span>' +
        (run ? 'net a year' : 'avoided a year') +
        '</span><em>On dashboard</em></div>' +
        '<div class="fstat"><b class="' +
        (v.ratio != null && v.ratio < 1 ? 'low' : '') +
        '">' +
        (v.ratio != null ? esc(ratioTxt(v.ratio)) : 'Set cost') +
        '</b><span>avoided loss against cost</span></div>' +
        '<div class="fstat"><b>' +
        (v.payback != null ? esc(paybackTxt(v.payback)) : 'n/a') +
        '</b><span>to pay back</span></div></div>' +
        '<div class="vbars">' +
        bar('vnow', 'Loss now', v.base, 'Expected loss now', [
          ['Linked risks', v.est + ' of ' + v.risks + ' with estimates'],
          ['Expected loss', esc(money(v.base)) + ' a year']
        ]) +
        bar('vafter', 'After', after2, 'Loss and running cost after delivery', [
          ['Reduction', red + '%'],
          ['Avoided', esc(money(v.avoided)) + ' a year'],
          ['Loss left', esc(money(after)) + ' a year'],
          run ? ['Running cost', esc(money(run)) + ' a year'] : null,
          ['Net saving', esc(money(v.net)) + ' a year']
        ]) +
        bar('vcost', 'Cost', cost, 'Cost to deliver', [
          ['One-off cost', cost == null ? 'Not set' : esc(money(cost))],
          run ? ['Running cost', esc(money(run)) + ' a year'] : null,
          v.payback != null ? ['Pays back in', esc(paybackTxt(v.payback))] : null
        ]) +
        '</div>'
      : '<p class="fq">' +
        (!v.risks
          ? 'Link at least one risk to calculate avoided loss.'
          : !v.est
            ? 'None of the linked risks has a loss estimate yet. Add one in the risk register.'
            : 'Set the reduction to see the result.') +
        '</p>';
  return (
    '<div class="fair"><div class="fhead"><b>Avoided loss against cost</b><span class="desc">What this initiative costs, and how much of the linked risks\u2019 loss it removes.</span>' +
    btns +
    delBtn('ival:' + i, 'Delete estimate', 'Removes the cost and reduction. The initiative stays.') +
    '</span></div><div class="fsteps">' +
    '<div class="fstep"><div class="fsh"><span class="fsn">1</span><b>What does it cost?</b></div><p class="fq">To deliver once, then to run each year: licences, support and people.</p><div class="dials">' +
    knob(p + '.cost', it.cost, 'money', 'To deliver', { small: true }) +
    knob(p + '.runCost', run, 'money', 'To run a year', { small: true }) +
    '</div><p class="fsay">' +
    costSay +
    '</p></div>' +
    '<div class="fstep vred"><div class="fsh"><span class="fsn">2</span><b>How much risk does it remove?</b></div><p class="fq">Share of the linked risks\u2019 expected annual loss that goes away.</p>' +
    riskList +
    slider(p + '.reduction', it.reduction, {
      max: 100,
      step: 5,
      rr: true,
      label: 'Expected loss reduction'
    }) +
    '<p class="fsay">' +
    redSay +
    '</p></div>' +
    '<div class="fstep fout"><div class="fsh"><span class="fsn">3</span><b>What this means</b>' +
    info(AVOID_NOTE) +
    '</div>' +
    result +
    '</div></div></div>'
  );
}
function initReg(c) {
  var catOpts = [['', 'None']].concat(
    c.categories.map(function (x) {
      return [x.id, x.name];
    })
  );
  var f = IF,
    qq = f.q.trim().toLowerCase(),
    tags = allTags(c.initiatives),
    types = itypes(c);
  var list = c.initiatives
    .map(function (it, i) {
      return { it: it, i: i, id: it.id };
    })
    .filter(function (o) {
      var it = o.it,
        k = findCat(c, it.categoryId);
      if (f.en === 'on' && !it.enabled) return false;
      if (f.en === 'off' && it.enabled) return false;
      if (f.risk === '_none' && (it.riskIds || []).length) return false;
      if (f.risk && f.risk !== '_none' && (it.riskIds || []).indexOf(f.risk) < 0) return false;
      if (f.cat && it.categoryId !== f.cat) return false;
      if (f.type && it.type !== f.type) return false;
      if (f.tag && tagList(it).indexOf(f.tag) < 0) return false;
      if (
        qq &&
        (it.name + ' ' + (k ? k.name : '') + ' ' + itName(it.type, c) + ' ' + tagList(it).join(' '))
          .toLowerCase()
          .indexOf(qq) < 0
      )
        return false;
      return true;
    });
  if (
    editInit &&
    !list.some(function (o) {
      return o.id === editInit;
    })
  ) {
    var ix = c.initiatives.findIndex(function (x) {
      return x.id === editInit;
    });
    if (ix >= 0) list.unshift({ it: c.initiatives[ix], i: ix, id: editInit });
  }
  var pg = pager(list.length, f.page || 0, 'init');
  f.page = pg.page;
  var nOn = c.initiatives.filter(function (r) {
    return r.enabled;
  }).length;
  var out =
    '<div class="fbar"><div class="rowf">' +
    fld(
      'Search',
      '<input type="search" id="isearch" value="' + esc(f.q) + '" placeholder="Name, category, type or tag">',
      'wide'
    ) +
    fld(
      'Linked risk',
      '<select id="if-risk">' +
        opt('', 'Any', f.risk) +
        opt('_none', 'No linked risk', f.risk) +
        c.risks
          .filter(function (r) {
            return (
              r.enabled ||
              c.initiatives.some(function (x) {
                return (x.riskIds || []).indexOf(r.id) >= 0;
              })
            );
          })
          .map(function (r) {
            return opt(r.id, r.name, f.risk);
          })
          .join('') +
        '</select>'
    ) +
    fld(
      'Tag',
      '<select id="if-tag">' +
        opt('', 'All tags', f.tag) +
        tags
          .map(function (t) {
            return opt(t[0], t[0] + ' (' + t[1] + ')', f.tag);
          })
          .join('') +
        '</select>'
    ) +
    '<button class="btn link" data-act="ifclear">Clear filters</button></div>' +
    chipRow('if', 'en', f.en, [
      ['', 'All', c.initiatives.length],
      ['on', 'Enabled', nOn],
      ['off', 'Disabled', c.initiatives.length - nOn]
    ]) +
    chipRow(
      'if',
      'type',
      f.type,
      [['', 'All types', c.initiatives.length]].concat(
        types.map(function (t) {
          return [
            t[0],
            t[1],
            c.initiatives.filter(function (x) {
              return x.type === t[0];
            }).length
          ];
        })
      )
    ) +
    chipRow(
      'if',
      'cat',
      f.cat,
      [['', 'All categories', c.initiatives.length]].concat(
        c.categories
          .map(function (k) {
            return [
              k.id,
              k.name,
              c.initiatives.filter(function (x) {
                return x.categoryId === k.id;
              }).length
            ];
          })
          .filter(function (x) {
            return x[2];
          })
      )
    ) +
    bulkBar('i', list) +
    '</div>';
  out += '<div class="addbar">' + addBtn('addinit', 'Add initiative') + '</div>';
  var rows = list
    .slice(pg.page * PAGE, (pg.page + 1) * PAGE)
    .map(function (o) {
      var it = o.it,
        i = o.i,
        k = findCat(c, it.categoryId),
        sub =
          k && it.subId
            ? k.subs.filter(function (s) {
                return s.id === it.subId;
              })[0]
            : null,
        use = initUse(it.id),
        p = 'c:initiatives.' + i;
      var pv = num(it.projected),
        ps = k && pv != null ? statusFor(k.indicator, pv) : null;
      var nl = (it.riskIds || []).filter(function (id) {
        return findRisk(c, id);
      }).length;
      var chips =
        '<button class="tg typ t' +
        itIdx(it.type, c) +
        '" data-act="if" data-k="type" data-a="' +
        esc(it.type) +
        '">' +
        esc(itName(it.type, c)) +
        '</button>' +
        (k
          ? '<button class="tg cat" data-act="if" data-k="cat" data-a="' +
            esc(k.id) +
            '">' +
            esc(k.name) +
            (sub ? ', ' + esc(sub.name) : '') +
            '</button>'
          : '<span class="tg warn">No category</span>') +
        (it.due ? '<span class="tg">Due ' + esc(it.due) + '</span>' : '') +
        (k && pv != null
          ? '<span class="tg">Projected ' +
            esc(fmt(pv, k.indicator.unit)) +
            (ps ? ' <span class="sh ' + ps + '" aria-label="' + WL[ps] + '"></span>' : '') +
            '</span>'
          : '') +
        tagList(it)
          .map(function (t) {
            return (
              '<button class="tg" data-act="if" data-k="tag" data-a="' + esc(t) + '">#' + esc(t) + '</button>'
            );
          })
          .join('') +
        (function () {
          var vv = initValue(c, it);
          return vv.ratio != null
            ? '<span class="tg loss" title="Projected net avoided loss ' +
                esc(money(vv.net)) +
                ' a year for ' +
                esc(money(vv.cost)) +
                '">' +
                esc(ratioTxt(vv.ratio)) +
                '</span>'
            : '';
        })() +
        (nl
          ? '<span class="tg lnk" title="' +
            esc(
              (it.riskIds || [])
                .map(function (id) {
                  var r = findRisk(c, id);
                  return r ? r.name : '';
                })
                .filter(Boolean)
                .join(', ')
            ) +
            '">' +
            nl +
            ' linked risk' +
            (nl > 1 ? 's' : '') +
            '</span>'
          : '') +
        (use.length
          ? '<span class="tg use" title="' +
            esc(use.join(', ')) +
            '">Shown in ' +
            use.length +
            ' quarter' +
            (use.length > 1 ? 's' : '') +
            '</span>'
          : '');
      var open = editInit === it.id,
        subOpts = [['', 'Whole category']].concat(
          k
            ? k.subs.map(function (s) {
                return [s.id, s.name];
              })
            : []
        );
      return (
        '<div class="rrow' +
        (open ? ' open' : '') +
        '">' +
        rowHead('i', it.id, it.enabled, it.name, chips, open, 'editinit') +
        (open
          ? '<div class="redit"><div class="rowf">' +
            fld('Initiative', inp(p + '.name', it.name, 'text', ' data-rr style="width:100%"'), 'wide') +
            '</div><div class="rowf">' +
            fld('Type', sel(p + '.type', types, it.type, true)) +
            fld('Category', sel(p + '.categoryId', catOpts, it.categoryId, true)) +
            fld('Subcategory', sel(p + '.subId', subOpts, it.subId || '', true)) +
            fld(
              'Started',
              inp(
                p + '.start',
                it.start,
                'text',
                ' data-rr placeholder="Q1 2026" style="min-width:0;width:110px"'
              )
            ) +
            fld(
              'Due',
              inp(
                p + '.due',
                it.due,
                'text',
                ' data-rr placeholder="Q2 2027" style="min-width:0;width:110px"'
              )
            ) +
            fld(
              'Projected value' + (k ? ' (' + unitName(k.indicator.unit) + ')' : ''),
              inp(p + '.projected', it.projected, 'number', ' data-rr'),
              '',
              'The value you expect the category indicator to reach once this initiative is delivered.'
            ) +
            (ps ? '<span class="pill ' + ps + '" style="align-self:center">' + WL[ps] + '</span>' : '') +
            '</div><div class="rowf">' +
            fld(
              'Linked risks (optional)',
              linkEditor(c, it, i),
              'wide',
              'Optional. Links let the dashboard highlight related items and calculate avoided loss from the risks\u2019 loss estimates.'
            ) +
            '</div>' +
            valueEditor(c, it, i) +
            '<div class="rowf">' +
            fld(
              'Tags',
              tagEditor(p + '.tags', tagList(it), {
                label: 'Initiative tags',
                placeholder: 'Add tag',
                suggest: allTags(c.initiatives).map(function (t) {
                  return t[0];
                })
              }),
              'wide'
            ) +
            '<div class="tools" style="align-self:flex-end">' +
            delBtn('init:' + it.id, 'Delete', delWarn('init', it.id)) +
            '</div></div></div>'
          : '') +
        '</div>'
      );
    })
    .join('');
  return (
    out +
    '<div class="rlist">' +
    (rows || '<p class="desc" style="padding:14px">No initiatives match these filters.</p>') +
    '</div>' +
    pg.html
  );
}
