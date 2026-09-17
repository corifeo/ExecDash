/* Animation: reduced-motion handling, count-ups, reveal on scroll. */

var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var ANIM = !RM;
if (ANIM) document.documentElement.classList.add('anim');
function ease(p) {
  return 1 - Math.pow(1 - p, 3);
}
function tween(dur, delay, fn) {
  if (!ANIM) {
    fn(1);
    return;
  }
  var t0 = null;
  function step(t) {
    if (t0 == null) t0 = t + delay;
    var p = t < t0 ? 0 : Math.min(1, (t - t0) / dur);
    fn(ease(p));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function runAnims(root) {
  root.querySelectorAll('.cu').forEach(function (el, i) {
    var to = +el.dataset.to,
      d = +el.dataset.dec,
      pre = el.dataset.pre || '',
      suf = el.dataset.suf || '';
    tween(900, Math.min(i * 25, 300), function (e) {
      el.textContent = pre + nf(to * e, d, el.dataset.cmp) + suf;
    });
  });
  root.querySelectorAll('.mk').forEach(function (el, i) {
    var v = +el.dataset.v,
      max = +el.dataset.max;
    tween(1100, 120 + Math.min(i * 40, 400), function (e) {
      var p = P(v * e, max, 66);
      el.setAttribute('cx', p[0].toFixed(1));
      el.setAttribute('cy', p[1].toFixed(1));
    });
  });
  root.querySelectorAll('.tfill').forEach(function (el, i) {
    var f = +el.dataset.f,
      len = +el.dataset.len;
    tween(1100, 120 + Math.min(i * 40, 400), function (e) {
      el.setAttribute('stroke-dasharray', (len * f * e).toFixed(1) + ' ' + len.toFixed(1));
    });
  });
}
var io = null;
function setupReveal(root) {
  if (io) io.disconnect();
  var els = root.querySelectorAll('[data-reveal]');
  if (!ANIM || !('IntersectionObserver' in window)) {
    els.forEach(function (e) {
      e.classList.add('in');
      runAnims(e);
    });
    return;
  }
  io = new IntersectionObserver(
    function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          runAnims(en.target);
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach(function (e) {
    io.observe(e);
  });
}
