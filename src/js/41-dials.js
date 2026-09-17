/* Rotary dial control used for scores, money and event frequency. */

var FREQ_STEPS = [0, 0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 5, 8, 12, 20, 50];
var MONEY_STEPS = [
  0, 10e3, 25e3, 50e3, 75e3, 100e3, 150e3, 250e3, 500e3, 750e3, 1e6, 1.5e6, 2e6, 3e6, 5e6, 7.5e6, 10e6, 15e6,
  20e6, 25e6, 35e6, 50e6, 75e6, 100e6
];
function knobSteps(kind, max) {
  if (kind === 'freq') return FREQ_STEPS;
  if (kind === 'money') return MONEY_STEPS;
  var m = +max || 5,
    a = [];
  for (var i = 0; i <= Math.round(m * 10); i++) a.push(+(i / 10).toFixed(1));
  return a;
}
function knobFmt(kind, v) {
  return kind === 'freq' ? freqTxt(v) : kind === 'money' ? money(v) : v == null ? 'No data' : (+v).toFixed(1);
}
function nearestIdx(steps, v) {
  if (v == null || isNaN(v)) return -1;
  var bi = 0,
    bd = Infinity;
  for (var i = 0; i < steps.length; i++) {
    var d = Math.abs(steps[i] - v);
    if (d < bd) {
      bd = d;
      bi = i;
    }
  }
  return bi;
}
function kpt(f, r) {
  var t = ((-135 + 270 * f) * Math.PI) / 180;
  return [50 + r * Math.sin(t), 50 - r * Math.cos(t)];
}
function karc(f0, f1, r) {
  if (f1 - f0 <= 0.0005) return '';
  var a = kpt(f0, r),
    b = kpt(f1, r),
    large = (f1 - f0) * 270 > 180 ? 1 : 0;
  return (
    'M ' +
    a[0].toFixed(2) +
    ' ' +
    a[1].toFixed(2) +
    ' A ' +
    r +
    ' ' +
    r +
    ' 0 ' +
    large +
    ' 1 ' +
    b[0].toFixed(2) +
    ' ' +
    b[1].toFixed(2)
  );
}
function knobSvg(f, has, mark) {
  var h = kpt(f, 38),
    m = mark != null ? kpt(mark, 38) : null;
  return (
    '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="ktr" d="' +
    karc(0, 1, 38) +
    '"/>' +
    (has ? '<path class="kval" d="' + karc(0, f, 38) + '"/>' : '') +
    (m
      ? '<line class="kmark" x1="' +
        kpt(mark, 30)[0].toFixed(1) +
        '" y1="' +
        kpt(mark, 30)[1].toFixed(1) +
        '" x2="' +
        kpt(mark, 46)[0].toFixed(1) +
        '" y2="' +
        kpt(mark, 46)[1].toFixed(1) +
        '"/>'
      : '') +
    (has ? '<circle class="khd" cx="' + h[0].toFixed(2) + '" cy="' + h[1].toFixed(2) + '" r="7"/>' : '') +
    '</svg>'
  );
}
function knob(path, val, kind, label, opts) {
  opts = opts || {};
  var steps = knobSteps(kind, opts.max),
    i = nearestIdx(steps, num(val)),
    f = i < 0 ? 0 : i / (steps.length - 1);
  var mi = opts.mark != null ? nearestIdx(steps, opts.mark) / (steps.length - 1) : null;
  return (
    '<div class="knob' +
    (opts.small ? ' sm' : '') +
    '" role="slider" tabindex="0" data-b="' +
    path +
    '" data-kind="' +
    kind +
    '" data-max="' +
    (opts.max || '') +
    '" data-mark="' +
    (opts.mark != null ? opts.mark : '') +
    '" aria-label="' +
    esc(label) +
    '" aria-valuemin="' +
    steps[0] +
    '" aria-valuemax="' +
    steps[steps.length - 1] +
    '"' +
    (i < 0 ? '' : ' aria-valuenow="' + steps[i] + '"') +
    ' aria-valuetext="' +
    esc(i < 0 ? 'Not set' : knobFmt(kind, steps[i])) +
    '">' +
    knobSvg(f, i >= 0, mi) +
    '<span class="kv">' +
    esc(i < 0 ? 'Drag to set' : knobFmt(kind, steps[i])) +
    '</span><span class="kl">' +
    esc(label) +
    '</span></div>'
  );
}
function knobIdx(el) {
  var steps = knobSteps(el.dataset.kind, el.dataset.max),
    v = el.getAttribute('aria-valuenow');
  return v == null ? -1 : nearestIdx(steps, +v);
}
function knobSet(el, idx) {
  var kind = el.dataset.kind,
    steps = knobSteps(kind, el.dataset.max);
  idx = Math.max(0, Math.min(steps.length - 1, idx));
  var v = steps[idx];
  var b = el.getAttribute('data-b'),
    root = b.slice(0, 1),
    path = b.slice(2);
  if (root === 'q') {
    if (!wq) return;
    setPath(wq, path, v);
    dirtyQ = true;
  } else {
    setPath(wcfg, path, v);
    dirtyCfg = true;
  }
  var mk = el.dataset.mark === '' ? null : nearestIdx(steps, +el.dataset.mark) / (steps.length - 1);
  var old = el.querySelector('svg');
  old.insertAdjacentHTML('afterend', knobSvg(idx / (steps.length - 1), true, mk));
  old.remove();
  el.querySelector('.kv').textContent = knobFmt(kind, v);
  el.setAttribute('aria-valuenow', v);
  el.setAttribute('aria-valuetext', knobFmt(kind, v));
  msg = '';
  msgErr = false;
  updateBar();
}
var kdrag = null;
function knobFromPointer(k, e) {
  var svg = k.querySelector('svg'),
    r = svg.getBoundingClientRect(),
    dx = e.clientX - (r.left + r.width / 2),
    dy = e.clientY - (r.top + r.height / 2);
  var th = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (th > 135) th = 135;
  if (th < -135) th = -135;
  var steps = knobSteps(k.dataset.kind, k.dataset.max);
  var idx = Math.round(((th + 135) / 270) * (steps.length - 1));
  if (idx !== knobIdx(k)) knobSet(k, idx);
}
function fixOrder(o, a, b, c) {
  if (!o) return;
  var x = num(o[a]),
    y = num(o[b]),
    z = num(o[c]);
  if (x != null && y != null && x > y) o[b] = x;
  y = num(o[b]);
  if (y != null && z != null && y > z) o[c] = y;
}
function afterKnob() {
  if (wcfg)
    wcfg.risks.forEach(function (r) {
      if (r.fair) {
        fixOrder(r.fair, 'fMin', 'fMl', 'fMax');
        fixOrder(r.fair, 'lMin', 'lMl', 'lMax');
      }
    });
  rerenderConfig();
}
document.addEventListener('pointerdown', function (e) {
  var k = e.target.closest && e.target.closest('#cfg .knob');
  if (!k) return;
  e.preventDefault();
  k.focus({ preventScroll: true });
  kdrag = k;
  try {
    k.setPointerCapture(e.pointerId);
  } catch (er) {}
  k.classList.add('drag');
  knobFromPointer(k, e);
});
document.addEventListener('pointermove', function (e) {
  if (kdrag) knobFromPointer(kdrag, e);
});
function endKnob() {
  if (!kdrag) return;
  kdrag.classList.remove('drag');
  kdrag = null;
  afterKnob();
}
document.addEventListener('pointerup', endKnob);
document.addEventListener('pointercancel', endKnob);
document.addEventListener('keydown', function (e) {
  var k = e.target.classList && e.target.classList.contains('knob') ? e.target : null;
  if (!k) return;
  var steps = knobSteps(k.dataset.kind, k.dataset.max),
    i = knobIdx(k),
    d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 3, PageDown: -3 }[e.key];
  if (d != null) {
    e.preventDefault();
    knobSet(k, (i < 0 ? 0 : i) + d);
    afterKnob();
  } else if (e.key === 'Home') {
    e.preventDefault();
    knobSet(k, 0);
    afterKnob();
  } else if (e.key === 'End') {
    e.preventDefault();
    knobSet(k, steps.length - 1);
    afterKnob();
  }
});
