/* Configure view shell: tabs, save bar and re-rendering. */

function renderConfig() {
  TIPS = []; // Configure reuses the registry for the loss bar tooltips.
  var el = $('#cfg');
  if (wcfg) applyStyle(wcfg.style);
  if (!wcfg) {
    el.innerHTML =
      '<p class="empty">No configuration yet.</p><button class="btn primary" data-act="init">Set up an empty dashboard</button>';
    return;
  }
  var tabs = [
    ['data', 'Quarter data'],
    ['structure', 'Structure'],
    ['register', 'Risks and initiatives'],
    ['quarters', 'Quarters'],
    ['io', 'Data']
  ];
  var body =
    cfgTab === 'data'
      ? cfgData()
      : cfgTab === 'structure'
        ? cfgStructure()
        : cfgTab === 'register'
          ? cfgRegister()
          : cfgTab === 'io'
            ? cfgDataMgmt()
            : cfgQuarters();
  var d = dirtyCfg || dirtyQ;
  var bar =
    '<div class="savebar"><span class="msg' +
    (msgErr ? ' err' : '') +
    '" role="status">' +
    esc(msg || (d ? 'Unsaved changes' : 'All changes saved')) +
    '</span><div class="tools"><button class="btn" data-act="discard"' +
    (d ? '' : ' disabled') +
    '>Discard</button><button class="btn primary" data-act="save"' +
    (d ? '' : ' disabled') +
    '>Save changes</button></div></div>';
  el.innerHTML =
    '<div class="ctabs" role="tablist">' +
    tabs
      .map(function (t) {
        return (
          '<button role="tab" data-act="tab" data-a="' +
          t[0] +
          '" aria-selected="' +
          (cfgTab === t[0]) +
          '">' +
          t[1] +
          '</button>'
        );
      })
      .join('') +
    '</div>' +
    body +
    bar;
}
function ensureWq() {
  var qs = sortedQs();
  if (!qs.length) {
    editQ = null;
    wq = null;
    return false;
  }
  if (!editQ || !quarters[editQ]) {
    editQ = selectedQ && quarters[selectedQ] ? selectedQ : qs[qs.length - 1].id;
    wq = null;
    dirtyQ = false;
  }
  if (!wq) wq = normalizeQ(clone(quarters[editQ]), wcfg);
  else normalizeQ(wq, wcfg);
  return true;
}
var rrTimer = null;
function rerenderConfig() {
  clearTimeout(rrTimer);
  rrTimer = setTimeout(function () {
    var a = document.activeElement,
      key = a && (a.getAttribute('data-b') || a.id);
    var sy = window.scrollY;
    renderConfig();
    if (key) {
      var n = document.querySelector('[data-b="' + key + '"]') || document.getElementById(key);
      if (n) {
        n.focus({ preventScroll: true });
        if (n.setSelectionRange && /^(text|search)$/.test(n.type)) {
          try {
            var L2 = n.value.length;
            n.setSelectionRange(L2, L2);
          } catch (er) {}
        }
      }
    }
    window.scrollTo(0, sy);
  }, 0);
}
function updateBar() {
  var bar = document.querySelector('.savebar');
  if (!bar) return;
  var d = dirtyCfg || dirtyQ;
  bar.querySelector('.msg').textContent = msg || (d ? 'Unsaved changes' : 'All changes saved');
  bar.querySelector('.msg').className = 'msg' + (msgErr ? ' err' : '');
  bar.querySelectorAll('button').forEach(function (b) {
    b.disabled = !d;
  });
}
