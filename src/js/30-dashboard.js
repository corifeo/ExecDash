/* Dashboard shell: header, section bands, navigation bar, collapse state and the top-level renderer. */

function renderHeader() {
  var qs = sortedQs(),
    q = selectedQ && quarters[selectedQ];
  var title = config ? config.title : 'Cyber security dashboard';
  var sub = config
    ? esc(config.committee) + (q ? ', ' + esc(q.label) + (q.period ? ' (' + esc(q.period) + ')' : '') : '')
    : '';
  var tools = '';
  if (view === 'dashboard' && qs.length > 1) {
    tools +=
      '<label class="ctl"><span>Quarter</span><select id="qsel">' +
      qs
        .map(function (x) {
          return (
            '<option value="' +
            esc(x.id) +
            '"' +
            (x.id === selectedQ ? ' selected' : '') +
            '>' +
            esc(x.label) +
            '</option>'
          );
        })
        .join('') +
      '</select></label>';
  }
  if (DB) {
    tools +=
      '<div class="seg"><button data-act="view" data-a="dashboard" aria-pressed="' +
      (view === 'dashboard') +
      '">Dashboard</button><button data-act="view" data-a="config" aria-pressed="' +
      (view === 'config') +
      '">Configure</button></div>';
  }
  var keys =
    view === 'dashboard' && config
      ? '<div class="keys" aria-label="Status keys"><div class="keyrow"><span>Risk against appetite</span><span class="pill g" data-hlst="g">Within appetite</span><span class="pill a" data-hlst="a">Within tolerance</span><span class="pill r" data-hlst="r">Outside tolerance</span></div><div class="keyrow"><span>Links</span>' +
        ref('cat', 'Category') +
        ref('risk', 'Risk') +
        ref('init', 'Initiative') +
        ref('inc', 'Incident') +
        '</div><div class="keyrow"><span>Performance against target</span><span class="pill on">On target</span><span class="pill off" data-hlst="off">Behind target</span></div></div>'
      : '';
  $('#hdr').innerHTML =
    '<div><h1>' +
    esc(view === 'config' ? title + ': configure' : title) +
    '</h1>' +
    (sub && view === 'dashboard' ? '<p class="sub">' + sub + '</p>' : '') +
    '</div><div class="hright">' +
    (tools ? '<div class="tools">' + tools + '</div>' : '') +
    keys +
    '</div>';
  $('#ftr').innerHTML =
    config && config.footer && view === 'dashboard' ? '<span>' + esc(config.footer) + '</span>' : '';
  // Browser tab: the dashboard title set under Structure, then the product name.
  document.title = config && title ? title + ' | ExecDash' : 'ExecDash';
}
function renderDashboard() {
  var el = $('#dash');
  TIPS = [];
  curTip = null;
  curSrc = null;
  curR = null;
  curAxis = null;
  if (tipEl) tipEl.classList.remove('show');
  if (dbState === 'loading') {
    el.innerHTML = '<p class="empty">Loading dashboard data.</p>';
    return;
  }
  if (dbState === 'none') {
    el.innerHTML =
      '<p class="empty">This browser is blocking local storage, so the dashboard cannot load or save data. Allow site data for this page and reload.</p>';
    return;
  }
  if (!config) {
    el.innerHTML =
      '<div class="empty"><p>No dashboard has been set up yet.</p>' +
      '<div class="tools" style="justify-content:flex-start"><button class="btn primary" data-act="loadsample">Load sample data</button><button class="btn" data-act="init">Set up an empty dashboard</button></div><p class="desc">Data is kept in this browser. Use Configure, Data to back it up or move it.</p>' +
      '</div>';
    return;
  }
  var qs = sortedQs();
  if (!qs.length) {
    el.innerHTML = '<p class="empty">No quarters yet. ' + 'Add one under Configure, Quarters.' + '</p>';
    return;
  }
  var cfg = config,
    q = normalizeQ(clone(quarters[selectedQ]), cfg),
    prev = prevOf(selectedQ);
  if (prev) prev = normalizeQ(prev, cfg);
  var pl = prev ? prev.label : null;
  CTX = { cfg: cfg, q: q, prev: prev, pl: pl };
  el.innerHTML =
    navHtml() +
    layer1(cfg, q, prev, pl) +
    layer2(cfg, q, prev, pl) +
    layer3(cfg, q) +
    layer4(cfg, q, prev, pl);
  applyHl(hlStatus);
  applyInitFilter();
  setupReveal(el);
  updateNav();
}
var SECTIONS = [
  [1, 'Programme at a glance'],
  [2, 'What has changed'],
  [3, 'State of the programme'],
  [4, 'Ongoing initiatives']
];
function collapsedSet() {
  try {
    return JSON.parse(localStorage.getItem('cyberdash:collapsed') || '[]');
  } catch (e) {
    return [];
  }
}
function saveCollapsed(a) {
  try {
    localStorage.setItem('cyberdash:collapsed', JSON.stringify(a));
  } catch (e) {}
}
function band(n, title, q, body, extra, summary) {
  var col = collapsedSet().indexOf(n) >= 0;
  return (
    '<section class="band' +
    (col ? ' collapsed' : '') +
    '" id="sec-' +
    n +
    '" data-sec="' +
    n +
    '" data-reveal aria-labelledby="t' +
    n +
    '"><div class="rail"><button class="num" data-act="collapse" data-a="' +
    n +
    '" aria-expanded="' +
    !col +
    '" aria-controls="sb-' +
    n +
    '" title="' +
    (col ? 'Expand' : 'Collapse') +
    ' section">' +
    n +
    '</button><p class="layer" id="t' +
    n +
    '">' +
    title +
    '</p><p class="q">' +
    q +
    '</p>' +
    (extra ? '<div class="rextra">' + extra + '</div>' : '') +
    '</div>' +
    '<div class="sbody" id="sb-' +
    n +
    '"><div class="sinner">' +
    body +
    '</div></div><p class="csum">' +
    esc(summary || '') +
    '</p></section>'
  );
}
function navHtml() {
  return (
    '<nav class="snav" aria-label="Dashboard sections"><div class="snav-in">' +
    SECTIONS.map(function (x) {
      return (
        '<button class="snl" data-act="goto" data-a="' +
        x[0] +
        '" title="' +
        x[1] +
        '"><span class="snn">' +
        x[0] +
        '</span><span class="snt">' +
        x[1] +
        '</span></button>'
      );
    }).join('') +
    '<span class="snsp"></span>' +
    allViewSeg() +
    '<span class="snsep" aria-hidden="true"></span><button class="btn link" data-act="collapseall" data-a="0">Expand all</button><button class="btn link" data-act="collapseall" data-a="1">Collapse all</button></div></nav>'
  );
}
function setCollapsed(n, col) {
  var sec = document.getElementById('sec-' + n);
  if (!sec) return;
  sec.classList.toggle('collapsed', col);
  var b = sec.querySelector('.num');
  b.setAttribute('aria-expanded', String(!col));
  b.title = (col ? 'Expand' : 'Collapse') + ' section';
  var a = collapsedSet().filter(function (x) {
    return x !== n;
  });
  if (col) a.push(n);
  saveCollapsed(a);
  if (!col) {
    sec.classList.add('in');
    runAnims(sec);
  }
}
function gotoSec(n) {
  var sec = document.getElementById('sec-' + n);
  if (!sec) return;
  if (sec.classList.contains('collapsed')) setCollapsed(n, false);
  var nav = document.querySelector('.snav'),
    off = (nav ? nav.offsetHeight : 0) + 8,
    y = sec.getBoundingClientRect().top + window.scrollY - off;
  window.scrollTo({ top: y, behavior: ANIM ? 'smooth' : 'auto' });
}
function gotoInits(catId) {
  var sec = document.getElementById('sec-4');
  if (!sec) return;
  if (sec.classList.contains('collapsed')) setCollapsed(4, false);
  var rows = [].slice.call(document.querySelectorAll('#l4body .init[data-link="' + catId + '"]'));
  if (!rows.length) {
    gotoSec(4);
    return;
  }
  var nav = document.querySelector('.snav'),
    off = (nav ? nav.offsetHeight : 0) + 24,
    y = rows[0].getBoundingClientRect().top + window.scrollY - off;
  window.scrollTo({ top: y, behavior: ANIM ? 'smooth' : 'auto' });
  rows.forEach(function (r) {
    r.classList.remove('pulse');
    void r.offsetWidth;
    r.classList.add('pulse', 'found');
    setTimeout(function () {
      r.classList.remove('found');
    }, 2600);
  });
  setTimeout(
    function () {
      rows[0].focus({ preventScroll: true });
    },
    ANIM ? 600 : 0
  );
}
var navTick = false;
function updateNav() {
  navTick = false;
  var nav = document.querySelector('.snav');
  if (!nav) return;
  var off = nav.offsetHeight + 24,
    act = null;
  document.querySelectorAll('#dash .band').forEach(function (b) {
    if (b.getBoundingClientRect().top <= off) act = b.dataset.sec;
  });
  if (!act) {
    var f = document.querySelector('#dash .band');
    act = f && f.dataset.sec;
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
    var all = document.querySelectorAll('#dash .band');
    if (all.length) act = all[all.length - 1].dataset.sec;
  }
  nav.querySelectorAll('.snl').forEach(function (x) {
    var on = x.dataset.a === act;
    x.classList.toggle('on', on);
    if (on) x.setAttribute('aria-current', 'true');
    else x.removeAttribute('aria-current');
  });
  nav.classList.toggle('stuck', nav.getBoundingClientRect().top <= 0 && window.scrollY > 0);
}
window.addEventListener(
  'scroll',
  function () {
    if (!navTick) {
      navTick = true;
      requestAnimationFrame(updateNav);
    }
  },
  { passive: true }
);
