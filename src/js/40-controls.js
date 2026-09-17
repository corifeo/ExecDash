/* Configuration form controls: fields, selects, switches, tag editors, sliders, commentary and buttons. */

function tagEditor(path, list, opts) {
  opts = opts || {};
  list = list || [];
  var id = 'ta:' + path,
    dl = opts.suggest && opts.suggest.length ? 'dl:' + path : '';
  return (
    '<div class="tagedit' +
    (opts.ordered ? ' ordered' : '') +
    '" data-tl="' +
    esc(path) +
    '" role="group" aria-label="' +
    esc(opts.label || 'List') +
    '">' +
    list
      .map(function (t, i) {
        return (
          '<span class="tchip" tabindex="0" draggable="true" data-tl="' +
          esc(path) +
          '" data-i="' +
          i +
          '" title="' +
          (opts.ordered ? 'Drag or press Alt and an arrow key to reorder. ' : '') +
          'Press Delete to remove">' +
          (opts.ordered ? '<i class="tgrip" aria-hidden="true"></i>' : '') +
          (opts.ordered ? '<b class="tord">' + (i + 1) + '</b>' : '') +
          esc(t) +
          '<button class="tx" data-act="tl-del" data-a="' +
          esc(path) +
          '" data-d="' +
          i +
          '" aria-label="Remove ' +
          esc(t) +
          '">&#215;</button></span>'
        );
      })
      .join('') +
    '<span class="tnew"><input type="text" class="tadd" id="' +
    esc(id) +
    '" data-tladd="' +
    esc(path) +
    '" placeholder="' +
    esc(opts.placeholder || 'Add') +
    '"' +
    (dl ? ' list="' + esc(dl) + '"' : '') +
    ' aria-label="Add to ' +
    esc(opts.label || 'list') +
    '"><button class="btn tplus" data-act="tl-add" data-a="' +
    esc(path) +
    '" aria-label="Add">+</button></span>' +
    (dl
      ? '<datalist id="' +
        esc(dl) +
        '">' +
        opts.suggest
          .filter(function (x) {
            return list.indexOf(x) < 0;
          })
          .map(function (x) {
            return '<option value="' + esc(x) + '">';
          })
          .join('') +
        '</datalist>'
      : '') +
    '</div>'
  );
}
function objTagEditor(path, items, opts) {
  opts = opts || {};
  items = items || [];
  var id = 'ta:' + path;
  return (
    '<div class="tagedit ordered objs" data-tl="' +
    esc(path) +
    '" data-obj="' +
    esc(opts.prefix || 'x') +
    '" role="group" aria-label="' +
    esc(opts.label || 'List') +
    '">' +
    items
      .map(function (it, i) {
        var extra = opts.count ? opts.count(it) : '';
        return (
          '<span class="tchip edit" data-tl="' +
          esc(path) +
          '" data-i="' +
          i +
          '"><i class="tgrip" draggable="true" title="Drag to reorder, or press Alt and an arrow key in the name"></i><b class="tord">' +
          (i + 1) +
          '</b><input class="tname" data-b="' +
          esc(path) +
          '.' +
          i +
          '.name" data-tl="' +
          esc(path) +
          '" data-i="' +
          i +
          '" value="' +
          esc(it.name) +
          '" size="' +
          Math.max(4, String(it.name || '').length) +
          '" aria-label="' +
          esc((opts.itemLabel || 'Item') + ' ' + (i + 1) + ' name') +
          '">' +
          (extra ? '<span class="tcount">' + esc(extra) + '</span>' : '') +
          '<button class="tx" data-act="tl-del" data-a="' +
          esc(path) +
          '" data-d="' +
          i +
          '" aria-label="Delete ' +
          esc(it.name) +
          '">&#215;</button></span>'
        );
      })
      .join('') +
    '<span class="tnew"><input type="text" class="tadd" id="' +
    esc(id) +
    '" data-tladd="' +
    esc(path) +
    '" placeholder="' +
    esc(opts.placeholder || 'Add') +
    '" aria-label="Add to ' +
    esc(opts.label || 'list') +
    '"><button class="btn tplus" data-act="tl-add" data-a="' +
    esc(path) +
    '" aria-label="Add">+</button></span></div>'
  );
}
function tlRoot(path) {
  return path.slice(0, 1) === 'q' ? wq : wcfg;
}
function tlList(path) {
  var root = tlRoot(path),
    p = path.slice(2),
    l = getPath(root, p);
  if (!Array.isArray(l)) {
    l = [];
    setPath(root, p, l);
  }
  return l;
}
function tlDirty(path) {
  if (path.slice(0, 1) === 'q') dirtyQ = true;
  else dirtyCfg = true;
  msg = '';
  msgErr = false;
}
function tlAdd(path, val) {
  var parts = String(val || '')
    .split(',')
    .map(function (x) {
      return x.trim().slice(0, 60);
    })
    .filter(Boolean);
  if (!parts.length) return false;
  var l = tlList(path),
    added = false;
  var box = document.querySelector('.tagedit[data-tl="' + path + '"]'),
    obj = box && box.dataset.obj;
  parts.forEach(function (v) {
    var nm = function (x) {
      return String(obj ? x.name : x).toLowerCase();
    };
    if (
      !l.some(function (x) {
        return nm(x) === v.toLowerCase();
      })
    ) {
      l.push(obj ? { id: uid(obj), name: v } : v);
      added = true;
    }
  });
  if (added) tlDirty(path);
  return added;
}
function tlMove(path, i, j) {
  var l = tlList(path);
  if (j < 0 || j >= l.length || i === j) return;
  var x = l.splice(i, 1)[0];
  l.splice(j, 0, x);
  tlDirty(path);
}
function focusChip(path, i) {
  setTimeout(function () {
    var c = document.querySelector('.tchip[data-tl="' + path + '"][data-i="' + i + '"]');
    if (c) c.focus();
  }, 20);
}
document.addEventListener('keydown', function (e) {
  var t = e.target;
  if (t.classList && t.classList.contains('tadd')) {
    var path = t.dataset.tladd;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tlAdd(path, t.value)) {
        t.value = '';
        rerenderConfig();
      }
    } else if (e.key === 'Backspace' && !t.value) {
      var l = tlList(path);
      if (l.length) {
        e.preventDefault();
        l.pop();
        tlDirty(path);
        rerenderConfig();
      }
    }
    return;
  }
  if (
    t.classList &&
    t.classList.contains('tname') &&
    e.altKey &&
    (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
  ) {
    e.preventDefault();
    var p3 = t.dataset.tl,
      i3 = +t.dataset.i,
      j3 = i3 + (e.key === 'ArrowLeft' ? -1 : 1);
    t.blur();
    tlMove(p3, i3, j3);
    renderConfig();
    setTimeout(function () {
      var n3 = document.querySelector(
        '.tname[data-tl="' + p3 + '"][data-i="' + Math.max(0, Math.min(j3, tlList(p3).length - 1)) + '"]'
      );
      if (n3) n3.focus();
    }, 20);
    return;
  }
  if (t.classList && t.classList.contains('tchip')) {
    var p2 = t.dataset.tl,
      i = +t.dataset.i;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      tlList(p2).splice(i, 1);
      tlDirty(p2);
      renderConfig();
      focusChip(p2, Math.max(0, i - 1));
    } else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      var j = i + (e.key === 'ArrowLeft' ? -1 : 1);
      tlMove(p2, i, j);
      renderConfig();
      focusChip(p2, Math.max(0, Math.min(j, tlList(p2).length - 1)));
    }
  }
});
var tdrag = null;
document.addEventListener('dragstart', function (e) {
  var c = e.target.closest && e.target.closest('.tchip');
  if (!c) return;
  tdrag = { path: c.dataset.tl, i: +c.dataset.i };
  c.classList.add('dragging');
  try {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', c.textContent);
  } catch (er) {}
});
document.addEventListener('dragover', function (e) {
  if (!tdrag) return;
  var c = e.target.closest && e.target.closest('.tchip');
  if (c && c.dataset.tl === tdrag.path) {
    e.preventDefault();
    document.querySelectorAll('.tchip.over').forEach(function (x) {
      x.classList.remove('over');
    });
    c.classList.add('over');
  }
});
document.addEventListener('drop', function (e) {
  if (!tdrag) return;
  var c = e.target.closest && e.target.closest('.tchip');
  if (c && c.dataset.tl === tdrag.path) {
    e.preventDefault();
    tlMove(tdrag.path, tdrag.i, +c.dataset.i);
    tdrag = null;
    renderConfig();
  }
});
document.addEventListener('dragend', function () {
  if (tdrag) {
    tdrag = null;
    document.querySelectorAll('.tchip.dragging,.tchip.over').forEach(function (x) {
      x.classList.remove('dragging', 'over');
    });
  }
});
function zoneGradient(ind, max) {
  if (!ind || isTarget(ind)) {
    if (ind && num(ind.target) != null) {
      var tp = Math.max(0, Math.min(100, (+ind.target / max) * 100));
      return ind.direction === 'lower'
        ? 'linear-gradient(90deg,var(--green-bg) 0 ' + tp + '%,var(--track) ' + tp + '% 100%)'
        : 'linear-gradient(90deg,var(--track) 0 ' + tp + '%,var(--green-bg) ' + tp + '% 100%)';
    }
    return '';
  }
  var a = Math.max(0, Math.min(100, (+ind.appetite / max) * 100)),
    t = Math.max(0, Math.min(100, (+ind.tolerance / max) * 100));
  var g = 'color-mix(in srgb,var(--green) 30%,var(--track))',
    am = 'color-mix(in srgb,var(--amber) 30%,var(--track))',
    r = 'color-mix(in srgb,var(--red) 30%,var(--track))';
  if (ind.direction === 'higher')
    return (
      'linear-gradient(90deg,' +
      r +
      ' 0 ' +
      t +
      '%,' +
      am +
      ' ' +
      t +
      '% ' +
      a +
      '%,' +
      g +
      ' ' +
      a +
      '% 100%)'
    );
  return (
    'linear-gradient(90deg,' + g + ' 0 ' + a + '%,' + am + ' ' + a + '% ' + t + '%,' + r + ' ' + t + '% 100%)'
  );
}
function slider(path, val, opts) {
  opts = opts || {};
  var min = opts.min || 0,
    max = opts.max || 100,
    step = opts.step || 1,
    v = num(val),
    p = v == null ? 0 : Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  var mark =
    opts.mark != null
      ? '<i class="smark" style="left:' +
        Math.max(0, Math.min(100, ((opts.mark - min) / (max - min)) * 100)) +
        '%" title="' +
        esc(opts.markLabel || '') +
        '"></i>'
      : '';
  return (
    '<div class="slider' +
    (opts.zones ? ' zoned' : '') +
    (v == null ? ' unset' : '') +
    '" style="--p:' +
    p +
    '%;' +
    (opts.zones ? '--zones:' + opts.zones + ';' : '') +
    (opts.width ? 'width:' + opts.width + ';' : '') +
    '"><div class="strack">' +
    mark +
    '<input type="range" data-b="' +
    path +
    '" data-num data-slider' +
    (opts.rr ? ' data-rr' : '') +
    ' min="' +
    min +
    '" max="' +
    max +
    '" step="' +
    step +
    '" value="' +
    (v == null ? min : v) +
    '" aria-label="' +
    esc(opts.label || 'Value') +
    '" aria-valuetext="' +
    (v == null ? 'Not set' : esc(fmt(v, '%'))) +
    '"></div><output>' +
    (v == null ? 'Not set' : esc(fmt(v, opts.unit || '%'))) +
    '</output></div>'
  );
}
function sliderUpdate(el) {
  var w = el.closest('.slider');
  if (!w) return;
  var min = +el.min,
    max = +el.max,
    v = +el.value;
  w.style.setProperty('--p', ((v - min) / (max - min)) * 100 + '%');
  w.classList.remove('unset');
  var o = w.querySelector('output');
  if (o) o.textContent = fmt(v, '%');
  el.setAttribute('aria-valuetext', fmt(v, '%'));
}
function opt(v, l, s) {
  return (
    '<option value="' +
    esc(v) +
    '"' +
    (String(s) === String(v) ? ' selected' : '') +
    '>' +
    esc(l) +
    '</option>'
  );
}
function sel(path, options, val, rr, extra) {
  return (
    '<select data-b="' +
    path +
    '"' +
    (rr ? ' data-rr' : '') +
    (extra || '') +
    '>' +
    options
      .map(function (o) {
        return opt(o[0], o[1], val);
      })
      .join('') +
    '</select>'
  );
}
function inp(path, val, type, extra) {
  return (
    '<input type="' +
    (type || 'text') +
    '"' +
    (type === 'number' ? ' step="any" data-num' : '') +
    ' data-b="' +
    path +
    '" value="' +
    esc(val == null ? '' : val) +
    '"' +
    (extra || '') +
    '>'
  );
}
function info(text) {
  return (
    '<button type="button" class="info" data-info="' +
    esc(text) +
    '" aria-label="About this: ' +
    esc(text) +
    '">i</button>'
  );
}
function fld(label, control, cls, inf) {
  var box = /class="(tagedit|slider|multi)/.test(control) || !!inf;
  return (
    '<' +
    (box ? 'div' : 'label') +
    ' class="fld' +
    (cls ? ' ' + cls : '') +
    '"><span>' +
    esc(label) +
    (inf ? info(inf) : '') +
    '</span>' +
    control +
    '</' +
    (box ? 'div' : 'label') +
    '>'
  );
}
function statusOpts(ind, auto, withNone) {
  var o = [['auto', 'Auto: ' + (auto ? W[auto] : withNone ? 'none' : 'no data')]];
  o = o.concat(
    isTarget(ind)
      ? [
          ['on', 'On target'],
          ['off', 'Behind target']
        ]
      : [
          ['g', 'Within'],
          ['a', 'Tolerance'],
          ['r', 'Outside']
        ]
  );
  if (withNone) o.push(['none', 'None']);
  return o;
}
function trendCtl(path, tr, auto, u) {
  tr = tr || { mode: 'auto' };
  return (
    '<div class="trendctl">' +
    sel(
      path + '.mode',
      [
        ['auto', 'Auto: ' + deltaLabel(auto, u)],
        ['manual', 'Manual']
      ],
      tr.mode,
      true
    ) +
    (tr.mode === 'manual'
      ? inp(path + '.value', tr.value, 'number', ' aria-label="Manual change" placeholder="+/-"')
      : '') +
    '</div>'
  );
}
function delBtn(key, label, warn) {
  var on = armed === key;
  return (
    (on && warn ? '<span class="delwarn">' + esc(warn) + '</span>' : '') +
    '<button class="btn danger' +
    (on ? ' armed' : '') +
    '" data-act="del" data-a="' +
    esc(key) +
    '">' +
    (on ? 'Confirm delete' : label || 'Delete') +
    '</button>' +
    (on ? '<button class="btn link" data-act="disarm">Cancel</button>' : '')
  );
}
function moveBtns(act, i, len, extra) {
  return (
    '<span class="mvb"><button class="btn icon" data-act="' +
    act +
    '" data-a="' +
    i +
    '" data-d="-1"' +
    (extra || '') +
    (i === 0 ? ' disabled' : '') +
    ' aria-label="Move up">&#8593;</button><button class="btn icon" data-act="' +
    act +
    '" data-a="' +
    i +
    '" data-d="1"' +
    (extra || '') +
    (i >= len - 1 ? ' disabled' : '') +
    ' aria-label="Move down">&#8595;</button></span>'
  );
}
function swb(path, val, label) {
  return (
    '<button class="sw' +
    (val ? ' on' : '') +
    '" data-act="swb" data-a="' +
    esc(path) +
    '" role="switch" aria-checked="' +
    !!val +
    '" aria-label="' +
    esc(label) +
    '"><i></i></button>'
  );
}
function multiPick(path, options, vals, label) {
  return (
    '<div class="multi" role="group" aria-label="' +
    esc(label) +
    '">' +
    options
      .map(function (o) {
        var on = vals.indexOf(o) >= 0;
        return (
          '<button class="mchip' +
          (on ? ' on' : '') +
          '" aria-pressed="' +
          on +
          '" data-act="mpick" data-a="' +
          esc(path) +
          '" data-d="' +
          esc(o) +
          '">' +
          (on ? '<span aria-hidden="true">&#10003;</span> ' : '') +
          esc(o) +
          '</button>'
        );
      })
      .join('') +
    (options.length ? '' : '<span class="al">Add impact types under Structure.</span>') +
    '</div>'
  );
}
function ragPick(path, val, label) {
  return (
    '<span class="ragpick" role="radiogroup" aria-label="' +
    esc(label) +
    '">' +
    [
      ['g', 'Within appetite'],
      ['a', 'Within tolerance'],
      ['r', 'Outside tolerance']
    ]
      .map(function (o) {
        return (
          '<button class="rp' +
          (val === o[0] ? ' on' : '') +
          '" role="radio" aria-checked="' +
          (val === o[0]) +
          '" data-act="rag" data-a="' +
          esc(path) +
          '" data-d="' +
          o[0] +
          '" title="' +
          o[1] +
          '" aria-label="' +
          o[1] +
          '"><span class="sh ' +
          o[0] +
          '"></span></button>'
        );
      })
      .join('') +
    '</span>'
  );
}
function prevHint(prev, v, u) {
  return prev ? '<span class="al phint">' + esc(prev.label) + ': ' + esc(fmt(v, u)) + '</span>' : '';
}
function addBtn(act, label, extra) {
  return (
    '<button class="btn add" data-act="' +
    act +
    '"' +
    (extra || '') +
    '><span aria-hidden="true">+</span> ' +
    esc(label) +
    '</button>'
  );
}
var OPEN_NOTES = {};
function noteCtl(path, val, changed) {
  var open = !!OPEN_NOTES[path],
    has = !!(val && String(val).trim());
  return (
    '<div class="notectl">' +
    (changed ? '<span class="chgtag">' + esc(changed) + '</span>' : '') +
    '<button class="btn link nbtn' +
    (has ? ' has' : '') +
    '" data-act="note" data-a="' +
    esc(path) +
    '" aria-expanded="' +
    open +
    '">' +
    (has ? 'Edit commentary' : 'Add commentary') +
    '</button>' +
    (open
      ? '<textarea data-b="' +
        esc(path) +
        '" rows="3" placeholder="Why did this change, or what happened?">' +
        esc(val || '') +
        '</textarea>'
      : has
        ? '<span class="npre">' +
          esc(String(val).trim().slice(0, 70)) +
          (String(val).trim().length > 70 ? '\u2026' : '') +
          '</span>'
        : '') +
    '</div>'
  );
}
function chgLabel(d, u, sNow, sPrev) {
  var parts = [];
  if (sNow && sPrev && sNow !== sPrev) parts.push('Now ' + (WL[sNow] || sNow).toLowerCase());
  if (d) parts.push((d > 0 ? 'Up ' : 'Down ') + fmtAbs(d, u));
  return parts.join(', ');
}
