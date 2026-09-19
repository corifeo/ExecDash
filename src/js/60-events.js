/* Event delegation: field binding, input and change handling, and every data-act click action. */

function bindValue(elm) {
  var b = elm.getAttribute('data-b'),
    root = b.slice(0, 1),
    path = b.slice(2),
    v = elm.value;
  if (elm.hasAttribute('data-num')) v = num(v);
  if (root === 'q') {
    if (!wq) return;
    setPath(wq, path, v);
    dirtyQ = true;
  } else {
    setPath(wcfg, path, v);
    dirtyCfg = true;
  }
  msg = '';
  msgErr = false;
}
var fTimer = null;
document.addEventListener('input', function (e) {
  var t = e.target;
  if (t.hasAttribute && t.hasAttribute('data-slider')) sliderUpdate(t);
  if (t.type === 'color' && t.getAttribute('data-b')) {
    bindValue(t);
    applyStyle(wcfg.style);
    updateBar();
    return;
  }
  if (t.classList && t.classList.contains('tname')) t.size = Math.max(4, t.value.length);
  if (t.id === 'imptext') {
    pasteText = t.value;
    return;
  }
  if (t.id === 'rsearch' || t.id === 'isearch') {
    var F = t.id === 'rsearch' ? RF : IF;
    F.q = t.value;
    F.page = 0;
    clearTimeout(fTimer);
    fTimer = setTimeout(rerenderConfig, 180);
    return;
  }
  // Text, number and range fields update the draft as you type; selects wait for change.
  if (t.matches && t.matches('[data-b]') && t.tagName !== 'SELECT') {
    bindValue(t);
    updateBar();
  }
});
document.addEventListener('change', function (e) {
  var t = e.target;
  if (t.id === 'qsel') {
    selectedQ = t.value;
    render();
    return;
  }
  var fm = {
    'rf-impact': [RF, 'impact'],
    'rf-tag': [RF, 'tag'],
    'rf-src': [RF, 'src'],
    'rf-used': [RF, 'used'],
    'if-tag': [IF, 'tag'],
    'if-risk': [IF, 'risk']
  }[t.id];
  if (t.classList && t.classList.contains('rsel')) {
    var sp = t.dataset.sel.split(':'),
      sk = sp[0],
      sid = sp.slice(1).join(':');
    if (t.checked) SEL[sk][sid] = 1;
    else delete SEL[sk][sid];
    armed = null;
    rerenderConfig();
    return;
  }
  if (t.dataset && t.dataset.selall) {
    var ak = t.dataset.selall,
      ids2 = LASTIDS[ak];
    if (t.checked)
      ids2.forEach(function (id) {
        SEL[ak][id] = 1;
      });
    else
      ids2.forEach(function (id) {
        delete SEL[ak][id];
      });
    armed = null;
    rerenderConfig();
    return;
  }
  if (t.id === 'impfile' && t.files && t.files[0]) {
    var fr = new FileReader();
    fr.onload = function () {
      readImportText(String(fr.result || ''));
    };
    fr.onerror = function () {
      msg = 'Could not read that file.';
      msgErr = true;
      updateBar();
    };
    fr.readAsText(t.files[0]);
    return;
  }
  if (fm) {
    fm[0][fm[1]] = t.value;
    fm[0].page = 0;
    rerenderConfig();
    return;
  }
  if (t.id === 'editq') {
    if (dirtyQ) {
      msg = 'Save or discard changes to ' + (wq && wq.label) + ' first.';
      msgErr = true;
      t.value = editQ;
      updateBar();
      return;
    }
    editQ = t.value;
    wq = null;
    renderConfig();
    return;
  }
  if (t.matches && t.matches('[data-b]')) {
    bindValue(t);
    if (t.hasAttribute('data-rr')) rerenderConfig();
    else updateBar();
  }
});
document.addEventListener('click', function (e) {
  if (e.target.classList && e.target.classList.contains('mback')) {
    closeModal();
    return;
  }
  var row = e.target.closest && e.target.closest('#dash .arow');
  if (row) {
    jumpTo(row.dataset.cat);
    return;
  }
  var b = e.target.closest && e.target.closest('[data-act]');
  if (!b) {
    // Anywhere on an initiative row opens or closes its details.
    var ini = e.target.closest && e.target.closest('#l4body .init');
    if (ini && secView(4) !== 'compact') toggleInit(ini);
    return;
  }
  var act = b.getAttribute('data-act'),
    a = b.getAttribute('data-a'),
    d = b.getAttribute('data-d');
  if (act !== 'del' && act !== 'bulk') armed = null;
  switch (act) {
    case 'view':
      if (view === a) return;
      view = a;
      if (view === 'config' && !wcfg && config) wcfg = clone(config);
      render();
      window.scrollTo(0, 0);
      return;
    case 'tab':
      cfgTab = a;
      resetArmed = '';
      armed = null;
      renderConfig();
      return;
    case 'qdtab':
      qdTab = a;
      renderConfig();
      var qt = document.querySelector('.qtabs');
      if (qt && qt.getBoundingClientRect().top < 0) qt.scrollIntoView({ block: 'start' });
      return;
    case 'secview':
      applySecView(+a, d);
      syncAllViewSeg();
      return;
    case 'allview':
      VIEW_SECTIONS.forEach(function (n) {
        applySecView(n, a);
      });
      syncAllViewSeg();
      return;
    case 'regview':
      regView = a;
      renderConfig();
      return;
    case 'rf':
      var k1 = b.getAttribute('data-k');
      RF[k1] = RF[k1] === a && k1 !== 'cat' && k1 !== 'en' ? '' : a;
      RF.page = 0;
      editRisk = null;
      renderConfig();
      return;
    case 'if':
      var k2 = b.getAttribute('data-k');
      IF[k2] = IF[k2] === a && k2 !== 'cat' && k2 !== 'type' && k2 !== 'en' ? '' : a;
      IF.page = 0;
      editInit = null;
      renderConfig();
      return;
    case 'rfclear':
      RF = { q: '', cat: '', impact: '', tag: '', src: '', used: '', en: '', page: 0 };
      renderConfig();
      return;
    case 'ifclear':
      IF = { q: '', cat: '', type: '', tag: '', en: '', risk: '', page: 0 };
      renderConfig();
      return;
    case 'page':
      (b.getAttribute('data-k') === 'risk' ? RF : IF).page = Math.max(0, +a);
      editRisk = null;
      editInit = null;
      renderConfig();
      var rl = document.querySelector('.regsw');
      if (rl) rl.scrollIntoView({ block: 'start' });
      return;
    case 'editrisk':
      editRisk = editRisk === a ? null : a;
      renderConfig();
      return;
    case 'editinit':
      editInit = editInit === a ? null : a;
      renderConfig();
      return;
    case 'collapse':
      var n = +a,
        sec = document.getElementById('sec-' + n);
      setCollapsed(n, !sec.classList.contains('collapsed'));
      updateNav();
      return;
    case 'collapseall':
      SECTIONS.forEach(function (x) {
        setCollapsed(x[0], a === '1');
      });
      updateNav();
      return;
    case 'goto':
      gotoSec(+a);
      return;
    case 'gotoinit':
      gotoInits(a);
      return;
    case 'ifilter':
      initFilter = a || '';
      document.querySelectorAll('[data-act="ifilter"]').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x.dataset.a === initFilter));
      });
      applyInitFilter();
      return;
    case 'iexp':
      toggleInit(b.closest('.init'));
      return;
    case 'hl':
      hlStatus = a || null;
      document.querySelectorAll('[data-act="hl"]').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x.dataset.a === (a || '')));
      });
      applyHl(hlStatus);
      return;
    case 'init':
      initConfig();
      return;
    case 'loadsample':
      loadSample();
      return;
    case 'save':
      save();
      return;
    case 'discard':
      QFIX = [];
      if (config) applyStyle(config.style);
      wcfg = clone(config);
      wq = null;
      dirtyCfg = false;
      dirtyQ = false;
      msg = 'Changes discarded';
      msgErr = false;
      renderConfig();
      return;
    case 'editq':
      if (dirtyQ && a !== editQ) {
        msg = 'Save or discard changes to ' + (wq && wq.label) + ' first.';
        msgErr = true;
        updateBar();
        return;
      }
      editQ = a;
      wq = null;
      cfgTab = 'data';
      renderConfig();
      window.scrollTo(0, 0);
      return;
    case 'newq':
      newQuarter();
      return;
    case 'addtop':
      wq.topRisks.push({ riskId: '', rating: wcfg.ratings[1] || wcfg.ratings[0] || '', movement: 'auto' });
      dirtyQ = true;
      break;
    case 'deltop':
      wq.topRisks.splice(+a, 1);
      dirtyQ = true;
      break;
    case 'mvtop':
      move(wq.topRisks, +a, +d);
      dirtyQ = true;
      break;
    case 'addcat':
      var nid = uid('c');
      openCats[nid] = true;
      wcfg.categories.push({
        id: nid,
        name: 'New category',
        appetite: wcfg.appetiteLevels[1] || wcfg.appetiteLevels[0] || '',
        indicator: {
          desc: '',
          type: 'appetite',
          unit: 'count',
          direction: 'lower',
          appetite: 0,
          tolerance: 1,
          target: null,
          max: null
        },
        subs: []
      });
      dirtyCfg = true;
      break;
    case 'mvfn':
      move(wcfg.functions, +a, +d);
      dirtyCfg = true;
      break;
    case 'mpick':
      var mr = a.slice(0, 1) === 'q' ? wq : wcfg,
        ml = getPath(mr, a.slice(2));
      if (!Array.isArray(ml)) {
        ml = [];
        setPath(mr, a.slice(2), ml);
      }
      var mi = ml.indexOf(d);
      if (mi >= 0) ml.splice(mi, 1);
      else {
        var ord = wcfg.impacts;
        ml.push(d);
        ml.sort(function (x, y) {
          return ord.indexOf(x) - ord.indexOf(y);
        });
      }
      if (a.slice(0, 1) === 'q') dirtyQ = true;
      else dirtyCfg = true;
      break;
    case 'stylepick':
      wcfg.style[a] = d;
      dirtyCfg = true;
      break;
    case 'stylereset':
      wcfg.style = defaultStyle();
      dirtyCfg = true;
      break;
    case 'rag':
      var rr = a.slice(0, 1) === 'q' ? wq : wcfg;
      setPath(rr, a.slice(2), d);
      if (a.slice(0, 1) === 'q') dirtyQ = true;
      else dirtyCfg = true;
      break;
    case 'addinc':
      wq.incidents.items = wq.incidents.items || [];
      wq.incidents.items.push({
        id: uid('n'),
        title: '',
        severity: wcfg.severities[1] || wcfg.severities[0] || '',
        categoryId: '',
        riskId: '',
        description: '',
        reportable: false,
        ttc: null
      });
      dirtyQ = true;
      break;
    case 'delinc':
      wq.incidents.items.splice(+a, 1);
      dirtyQ = true;
      break;
    case 'mvinc':
      move(wq.incidents.items, +a, +d);
      dirtyQ = true;
      break;
    case 'swb':
      var sr = a.slice(0, 1) === 'q' ? wq : wcfg,
        sp = a.slice(2);
      setPath(sr, sp, !getPath(sr, sp));
      if (a.slice(0, 1) === 'q') dirtyQ = true;
      else dirtyCfg = true;
      break;
    case 'mvcat':
      move(wcfg.categories, +a, +d);
      dirtyCfg = true;
      break;
    case 'addfn':
      wcfg.functions.push({ id: uid('f'), name: 'New function', target: 3 });
      dirtyCfg = true;
      break;
    case 'addrisk':
      var rid = uid('r');
      wcfg.risks.unshift({
        id: rid,
        name: 'New risk',
        categoryId: RF.cat && RF.cat !== '_none' ? RF.cat : '',
        impacts: RF.impact && RF.impact !== '_none' ? [RF.impact] : [],
        tags: [],
        enabled: true,
        source: 'custom'
      });
      editRisk = rid;
      RF.page = 0;
      dirtyCfg = true;
      break;
    case 'ilink-add':
      var ls = document.getElementById('il:' + a);
      if (!ls || !ls.value) return;
      var itl = wcfg.initiatives[+a];
      itl.riskIds = (itl.riskIds || []).concat([ls.value]);
      dirtyCfg = true;
      break;
    case 'ilink-del':
      var itd = wcfg.initiatives[+a];
      itd.riskIds = (itd.riskIds || []).filter(function (x) {
        return x !== d;
      });
      dirtyCfg = true;
      break;
    case 'showlinked':
      regView = 'inits';
      IF = { q: '', cat: '', type: '', tag: '', en: '', risk: a, page: 0 };
      editInit = null;
      renderConfig();
      return;
    case 'tl-add':
      var ti = document.getElementById('ta:' + a);
      if (ti && tlAdd(a, ti.value)) {
        ti.value = '';
        rerenderConfig();
        setTimeout(function () {
          var n2 = document.getElementById('ta:' + a);
          if (n2) n2.focus();
        }, 10);
      }
      return;
    case 'tl-del':
      var tl = tlList(a),
        gone = tl[+d],
        gname = gone && gone.name ? gone.name : gone;
      if (a === 'c:initiativeTypes') {
        if (tl.length <= 1) {
          msg = 'Keep at least one initiative type.';
          msgErr = true;
          updateBar();
          return;
        }
        var nu = wcfg.initiatives.filter(function (x) {
          return x.type === gone.id;
        }).length;
        tl.splice(+d, 1);
        if (nu) {
          wcfg.initiatives.forEach(function (x) {
            if (x.type === gone.id) x.type = tl[0].id;
          });
          msg = 'Deleted ' + gname + '. ' + plural(nu, 'initiative') + ' moved to ' + tl[0].name + '.';
        }
      } else {
        tl.splice(+d, 1);
        var what =
          {
            'c:severities': 'Its incident counts',
            'c:vulnSeverities': 'Its exposure counts',
            'c:vulnGroups': 'Its exposure counts',
            'c:impacts': 'It'
          }[a] || (/\.subs$/.test(a) ? 'Its quarter status' : '');
        msg = what
          ? 'Deleted ' +
            gname +
            '. ' +
            what +
            (a === 'c:impacts' ? ' will be removed from every risk' : ' will be removed from every quarter') +
            ' when you save.'
          : '';
      }
      var keepMsg = msg;
      tlDirty(a);
      renderConfig();
      msg = keepMsg;
      msgErr = false;
      updateBar();
      return;
    case 'note':
      OPEN_NOTES[a] = !OPEN_NOTES[a];
      renderConfig();
      if (OPEN_NOTES[a]) {
        var ta2 = document.querySelector('textarea[data-b="' + a + '"]');
        if (ta2) ta2.focus();
      }
      return;
    case 'addfair':
      wcfg.risks[+b.getAttribute('data-a')].fair = {
        fMin: 0.1,
        fMl: 0.3,
        fMax: 1,
        lMin: 100000,
        lMl: 500000,
        lMax: 3000000
      };
      dirtyCfg = true;
      break;
    case 'valguide':
      openModal('How to estimate avoided loss', valueGuide(+a), 'sm');
      return;
    case 'ivex':
      var vx = VAL_EX.filter(function (x) {
        return x.key === d;
      })[0];
      if (!vx) return;
      wcfg.initiatives[+a].cost = vx.cost;
      wcfg.initiatives[+a].runCost = vx.run;
      wcfg.initiatives[+a].reduction = vx.red;
      closeModal();
      dirtyCfg = true;
      break;
    case 'addival':
      wcfg.initiatives[+a].cost = 100000;
      wcfg.initiatives[+a].runCost = 0;
      wcfg.initiatives[+a].reduction = 30;
      dirtyCfg = true;
      break;
    case 'fairguide':
      openModal('How to estimate a cyber loss', fairGuide(a === '' || a == null ? null : +a), 'sm');
      return;
    case 'gtab':
      if (!modalBack) return;
      modalBack.querySelectorAll('[data-act="gtab"]').forEach(function (x) {
        x.setAttribute('aria-pressed', String(x.dataset.a === a));
      });
      modalBack.querySelectorAll('.gpane').forEach(function (x) {
        x.classList.toggle('on', x.dataset.g === a);
      });
      return;
    case 'about':
      showWelcome();
      return;
    case 'mclose':
      closeModal();
      return;
    case 'fairex':
      var ex = FAIR_EX.filter(function (x) {
        return x.key === d;
      })[0];
      if (!ex) return;
      wcfg.risks[+a].fair = {
        fMin: ex.f[0],
        fMl: ex.f[1],
        fMax: ex.f[2],
        lMin: ex.l[0],
        lMl: ex.l[1],
        lMax: ex.l[2]
      };
      closeModal();
      dirtyCfg = true;
      break;
    case 'addband':
      var lb = wcfg.lossBands,
        lastUp = num(lb.length > 1 ? lb[lb.length - 2].upTo : 0) || 1e6;
      lb.splice(lb.length - 1, 0, { id: uid('b'), name: 'New band', upTo: lastUp * 2 });
      dirtyCfg = true;
      break;
    case 'toggle':
      var lst = b.getAttribute('data-k') === 'r' ? wcfg.risks : wcfg.initiatives;
      lst.forEach(function (x) {
        if (x.id === a) x.enabled = !x.enabled;
      });
      dirtyCfg = true;
      break;
    case 'bulk':
      var bk = b.getAttribute('data-k'),
        bl = bk === 'r' ? 'risks' : 'initiatives',
        ids = SEL[bk];
      if (a === 'clear') {
        SEL[bk] = {};
        armed = null;
        renderConfig();
        return;
      }
      if (a === 'delete') {
        if (armed !== 'bulk:' + bk) {
          armed = 'bulk:' + bk;
          renderConfig();
          return;
        }
        armed = null;
        wcfg[bl] = wcfg[bl].filter(function (x) {
          return !ids[x.id];
        });
        if (bk === 'r')
          wcfg.initiatives.forEach(function (it) {
            it.riskIds = (it.riskIds || []).filter(function (x) {
              return !ids[x];
            });
          });
        SEL[bk] = {};
        dirtyCfg = true;
        break;
      }
      wcfg[bl].forEach(function (x) {
        if (ids[x.id]) x.enabled = a === 'enable';
      });
      dirtyCfg = true;
      break;
    case 'export':
      doExport(a);
      return;
    case 'checkimp':
      readImportText(($('#imptext') || {}).value || '');
      return;
    case 'impmode':
      importMode = a;
      renderConfig();
      return;
    case 'cancelimp':
      IMPORT = null;
      msg = '';
      renderConfig();
      return;
    case 'applyimp':
      applyImport();
      return;
    case 'resetarm':
      if (dirtyCfg || dirtyQ) {
        msg = 'Save or discard your changes first.';
        msgErr = true;
        updateBar();
        return;
      }
      resetArmed = a;
      renderConfig();
      return;
    case 'resetcancel':
      resetArmed = '';
      renderConfig();
      return;
    case 'reset':
      if (resetArmed !== a) return;
      if (a === 'empty' || a === 'sample') factoryReset(a);
      else scopedReset(a);
      return;
    case 'fixint':
      fixIntegrity();
      return;
    case 'addinit':
      var iid = uid('i');
      wcfg.initiatives.unshift({
        id: iid,
        name: 'New initiative',
        type: IF.type || (wcfg.initiativeTypes[0] || {}).id || '',
        categoryId: IF.cat || '',
        subId: '',
        start: '',
        due: '',
        projected: null,
        cost: null,
        reduction: null,
        tags: [],
        riskIds: [],
        enabled: true
      });
      editInit = iid;
      IF.page = 0;
      dirtyCfg = true;
      break;
    case 'disarm':
      armed = null;
      renderConfig();
      return;
    case 'del':
      if (armed !== a) {
        armed = a;
        renderConfig();
        return;
      }
      armed = null;
      var kind = a.split(':')[0],
        id = a.slice(kind.length + 1);
      if (kind === 'q') {
        deleteQuarter(id);
        return;
      }
      if (kind === 'fair') {
        delete wcfg.risks[+id].fair;
        dirtyCfg = true;
        break;
      }
      if (kind === 'ival') {
        wcfg.initiatives[+id].cost = null;
        wcfg.initiatives[+id].runCost = 0;
        wcfg.initiatives[+id].reduction = null;
        dirtyCfg = true;
        break;
      }
      var list = {
        cat: 'categories',
        fn: 'functions',
        risk: 'risks',
        init: 'initiatives',
        band: 'lossBands'
      }[kind];
      if (kind === 'band' && wcfg.lossBands.length <= 2) return;
      if (kind === 'cat') {
        var tgt = (document.getElementById('reas:' + id) || {}).value || '';
        if (tgt) {
          wcfg.risks.forEach(function (r) {
            if (r.categoryId === id) r.categoryId = tgt;
          });
          wcfg.initiatives.forEach(function (it) {
            if (it.categoryId === id) {
              it.categoryId = tgt;
              it.subId = '';
            }
          });
          QFIX.push(function (q) {
            ((q.incidents && q.incidents.items) || []).forEach(function (x) {
              if (x.categoryId === id) x.categoryId = tgt;
            });
          });
        }
      }
      wcfg[list] = wcfg[list].filter(function (x) {
        return x.id !== id;
      });
      if (kind === 'band') wcfg.lossBands[wcfg.lossBands.length - 1].upTo = null;
      if (kind === 'risk')
        wcfg.initiatives.forEach(function (it) {
          it.riskIds = (it.riskIds || []).filter(function (x) {
            return x !== id;
          });
        });
      dirtyCfg = true;
      break;
    default:
      return;
  }
  msg = '';
  msgErr = false;
  rerenderConfig();
});
function toggleInit(row) {
  var id = row.querySelector('.iexp').getAttribute('data-a');
  initOpen[id] = !initOpen[id];
  row.classList.toggle('open', !!initOpen[id]);
  row.querySelector('.iexp').setAttribute('aria-expanded', String(!!initOpen[id]));
}
