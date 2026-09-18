/* Saving, rendering and start-up. */

function writeErr(e) {
  msg =
    e && e.code === 'quota_exceeded'
      ? 'Browser storage is full. Export a backup, then delete old quarters.'
      : 'Could not save' + (e && e.message ? ': ' + e.message : '.');
  msgErr = true;
  updateBar();
}
async function save() {
  if (!DB) return;
  msg = 'Saving';
  msgErr = false;
  updateBar();
  try {
    var cfgChanged = dirtyCfg,
      cleaned = 0,
      touched = 0;
    if (dirtyCfg) {
      cleaned += cfgFixes(wcfg);
      if (!rawRisks || JSON.stringify(wcfg.risks) !== JSON.stringify(config.risks))
        await DB.doc('dashboard/risks').set({ items: clone(wcfg.risks) });
      if (!rawInits || JSON.stringify(wcfg.initiatives) !== JSON.stringify(config.initiatives))
        await DB.doc('dashboard/initiatives').set({ items: clone(wcfg.initiatives) });
      if (wcfg.lossBands.length) wcfg.lossBands[wcfg.lossBands.length - 1].upTo = null;
      await DB.doc('dashboard/config').set(stripCfg(wcfg));
      dirtyCfg = false;
    }
    var ks = Object.keys(quarters);
    for (var qi = 0; qi < ks.length; qi++) {
      var k = ks[qi],
        isEd = k === editQ && wq,
        qd = isEd ? wq : clone(quarters[k]),
        m = 0;
      if (cfgChanged) {
        QFIX.forEach(function (f) {
          f(qd);
        });
        m = qFixes(qd, wcfg);
      }
      if (m || (isEd && dirtyQ) || (cfgChanged && QFIX.length)) {
        await DB.doc('quarters/' + k).set(clone(qd));
        if (m) {
          cleaned += m;
          touched++;
        }
      }
    }
    if (dirtyQ && wq && editQ && !quarters[editQ]) {
      await DB.doc('quarters/' + editQ).set(clone(wq));
    }
    QFIX = [];
    dirtyQ = false;
    msg = cleaned
      ? 'Saved. Cleaned up ' +
        plural(cleaned, 'linked value') +
        (touched ? ' in ' + plural(touched, 'quarter') : '') +
        '.'
      : 'Saved';
    msgErr = false;
    renderConfig();
  } catch (e) {
    writeErr(e);
  }
}
async function initConfig() {
  if (!DB) return;
  try {
    await DB.doc('dashboard/config').set(stripCfg(normalizeConfig({})));
    view = 'config';
    cfgTab = 'structure';
  } catch (e) {
    writeErr(e);
  }
}
function ensureSelected() {
  if (!config) return;
  var qs = sortedQs();
  if (!qs.length) {
    selectedQ = null;
    return;
  }
  if (!selectedQ || !quarters[selectedQ])
    selectedQ =
      config.defaultQuarter && quarters[config.defaultQuarter] ? config.defaultQuarter : qs[qs.length - 1].id;
}
function render() {
  ensureSelected();
  applyStyle(view === 'config' && wcfg ? wcfg.style : config && config.style);
  renderHeader();
  var cf = view === 'config';
  $('#dash').hidden = cf;
  $('#cfg').hidden = !cf;
  if (cf) renderConfig();
  else renderDashboard();
}
render();
(async function boot() {
  try {
    localStorage.setItem(SK + 'probe', '1');
    localStorage.removeItem(SK + 'probe');
    DB = localStore();
  } catch (e) {
    DB = null;
  }
  if (!DB) {
    dbState = 'none';
    render();
    return;
  }
  var gotCfg = false,
    gotQ = false;
  function ready() {
    if (gotCfg && gotQ && dbState === 'loading') dbState = 'ready';
  }
  var got = { c: false, r: false, i: false };
  function merged() {
    gotCfg = got.c && got.r && got.i;
    if (!gotCfg) return;
    if (!rawCfg) config = null;
    else {
      var base = clone(rawCfg);
      base.risks = rawRisks ? rawRisks.items || [] : [];
      base.initiatives = rawInits ? rawInits.items || [] : [];
      config = normalizeConfig(base);
    }
    if (!dirtyCfg) wcfg = config ? clone(config) : null;
    ready();
    refresh();
  }
  function fail() {
    dbState = 'none';
    render();
  }
  DB.doc('dashboard/config').onSnapshot(function (s) {
    rawCfg = s.exists ? s.data() : null;
    got.c = true;
    merged();
  }, fail);
  DB.doc('dashboard/risks').onSnapshot(function (s) {
    rawRisks = s.exists ? s.data() : null;
    got.r = true;
    merged();
  }, fail);
  DB.doc('dashboard/initiatives').onSnapshot(function (s) {
    rawInits = s.exists ? s.data() : null;
    got.i = true;
    merged();
  }, fail);
  DB.collection('quarters').onSnapshot(
    function (s) {
      var m = {};
      s.docs.forEach(function (d) {
        if (d.exists) m[d.id] = d.data();
      });
      quarters = m;
      if (editQ && !quarters[editQ]) {
        editQ = null;
        wq = null;
        dirtyQ = false;
      } else if (!dirtyQ) wq = null;
      gotQ = true;
      ready();
      refresh();
    },
    function () {
      dbState = 'none';
      render();
    }
  );
})();
function refresh() {
  if (view === 'config') {
    var a = document.activeElement;
    if ((dirtyCfg || dirtyQ) && a && $('#cfg').contains(a)) {
      renderHeader();
      return;
    }
  }
  render();
}
