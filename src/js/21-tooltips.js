/* Tooltip registry, hover and focus handling, and cross-highlighting between linked items. */

var TIPS = [];
function tip(html) {
  TIPS.push(html);
  return ' data-tip="' + (TIPS.length - 1) + '"';
}
// Rows can be grouped: tsec(label, tone) starts a section, tone 'good' for money.
function tsec(label, tone) {
  return ['' + (tone || ''), label];
}
function tipHtml(title, rows, note, noteLabel) {
  var body = '',
    open = false;
  (rows || []).filter(Boolean).forEach(function (r) {
    if (String(r[0]).charAt(0) === '') {
      if (open) body += '</dl></div>';
      body +=
        '<div class="tsec' +
        (String(r[0]).slice(1) ? ' ' + String(r[0]).slice(1) : '') +
        '"><span class="tsh">' +
        esc(r[1]) +
        '</span><dl>';
      open = true;
      return;
    }
    if (!open) {
      body += '<div class="tsec"><dl>';
      open = true;
    }
    body += '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>';
  });
  if (open) body += '</dl></div>';
  return (
    '<div class="tt">' +
    esc(title) +
    '</div>' +
    body +
    (note && String(note).trim()
      ? '<div class="tnote"><span>' +
        esc(noteLabel || 'What changed') +
        '</span>' +
        esc(String(note).trim()) +
        '</div>'
      : '')
  );
}

function ndot(note) {
  return note && String(note).trim()
    ? '<span class="ndot" aria-label="Has commentary" title="Has commentary"></span>'
    : '';
}
var tipEl = null,
  curTip = null,
  curAxis = null,
  curHl = null,
  hlStatus = null;
function tipBox() {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.id = 'tip';
    tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl);
  }
  return tipEl;
}
function placeTip(x, y) {
  var t = tipBox(),
    w = t.offsetWidth,
    h = t.offsetHeight,
    vw = window.innerWidth,
    vh = window.innerHeight;
  var l = x + 16,
    tp = y + 16;
  if (l + w > vw - 8) l = Math.max(8, x - w - 16);
  if (tp + h > vh - 8) tp = Math.max(8, y - h - 16);
  t.style.left = l + 'px';
  t.style.top = tp + 'px';
}
var curSrc = null,
  curR = null;
function onHover(target, x, y) {
  var inDash = target && target.closest && target.closest('#dash,#hdr');
  var t = inDash
    ? target.closest('[data-tip]')
    : target && target.closest
      ? target.closest('#cfg .info, #cfg .fair [data-tip]')
      : null;
  if (t !== curTip) {
    curTip = t;
    var b = tipBox();
    if (t && t.hasAttribute('data-info')) {
      b.innerHTML = '<div class="tinfo">' + esc(t.getAttribute('data-info')) + '</div>';
      b.classList.add('show');
      if (x == null) {
        var ri = t.getBoundingClientRect();
        x = ri.left + ri.width / 2;
        y = ri.bottom - 8;
      }
      placeTip(x, y);
    } else if (t && TIPS[+t.dataset.tip] != null) {
      b.innerHTML = TIPS[+t.dataset.tip];
      b.classList.add('show');
      if (x == null) {
        var r = t.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.bottom - 8;
      }
      placeTip(x, y);
    } else b.classList.remove('show');
  }
  var src = inDash ? target.closest('[data-cat],[data-link]') : null;
  if (src !== curSrc) {
    document.querySelectorAll('#dash .hl').forEach(function (e) {
      e.classList.remove('hl');
    });
    curSrc = src;
    if (src) {
      var cat = src.dataset.cat || src.dataset.link;
      document.querySelectorAll('#dash [data-cat="' + cat + '"]').forEach(function (e) {
        e.classList.add('hl');
      });
      if (src.dataset.cat)
        document.querySelectorAll('#dash [data-link="' + cat + '"]').forEach(function (e) {
          e.classList.add('hl');
        });
    }
  }
  var rs = inDash ? target.closest('[data-rid],[data-risks]') : null;
  if (rs !== curR) {
    document.querySelectorAll('#dash .rhl').forEach(function (e) {
      e.classList.remove('rhl');
    });
    curR = rs;
    if (rs) {
      if (rs.dataset.rid)
        document.querySelectorAll('#dash [data-risks]').forEach(function (x) {
          if (x.dataset.risks.split(' ').indexOf(rs.dataset.rid) >= 0) x.classList.add('rhl');
        });
      else
        rs.dataset.risks.split(' ').forEach(function (id) {
          document.querySelectorAll('#dash .risks li[data-rid="' + id + '"]').forEach(function (x) {
            x.classList.add('rhl');
          });
        });
    }
  }
  var a = inDash ? target.closest('[data-axis]') : null,
    ax = a ? a.dataset.axis : null;
  if (ax !== curAxis) {
    document.querySelectorAll('#dash .radar .on').forEach(function (e) {
      e.classList.remove('on');
    });
    curAxis = ax;
    if (ax != null)
      document.querySelectorAll('#dash .radar [data-axis="' + ax + '"]').forEach(function (e) {
        e.classList.add('on');
      });
  }
  var h = inDash ? target.closest('[data-hlst]') : null,
    hs = h ? h.dataset.hlst : null;
  if (hs !== curHl) {
    curHl = hs;
    applyHl(hs != null ? hs : hlStatus);
  }
}
function applyHl(st) {
  var g = document.getElementById('l3body');
  if (!g) return;
  g.classList.toggle('dim', !!st);
  g.querySelectorAll('.kcard').forEach(function (k) {
    k.classList.toggle('match', !!st && k.dataset.st === st);
  });
}
var initFilter = '';
function applyInitFilter() {
  var g = document.getElementById('l4body');
  if (!g) return;
  g.classList.toggle('dim', !!initFilter);
  g.querySelectorAll('.init').forEach(function (k) {
    k.classList.toggle('match', !!initFilter && k.dataset.itype === initFilter);
  });
}
document.addEventListener('pointerover', function (e) {
  onHover(e.target, e.clientX, e.clientY);
});
document.addEventListener('pointermove', function (e) {
  if (curTip) placeTip(e.clientX, e.clientY);
  else onHover(e.target, e.clientX, e.clientY);
});
document.addEventListener('pointerout', function (e) {
  if (!e.relatedTarget) onHover(document.body);
});
document.addEventListener('focusin', function (e) {
  onHover(e.target);
});
document.addEventListener('focusout', function (e) {
  if (!e.relatedTarget) onHover(document.body);
});
window.addEventListener(
  'scroll',
  function () {
    if (curTip && document.activeElement !== curTip) {
      curTip = null;
      tipBox().classList.remove('show');
    }
  },
  { passive: true }
);
function jumpTo(cat) {
  var k = document.querySelector('#l3body .kcard[data-cat="' + cat + '"]');
  if (!k) return;
  k.scrollIntoView({ behavior: ANIM ? 'smooth' : 'auto', block: 'center' });
  k.classList.remove('pulse');
  void k.offsetWidth;
  k.classList.add('pulse');
}
document.addEventListener('keydown', function (e) {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('arow')) {
    e.preventDefault();
    jumpTo(e.target.dataset.cat);
  }
});
