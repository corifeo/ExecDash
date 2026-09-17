/* Small generic helpers: DOM lookup, escaping, cloning, ids, numbers and object paths. */

var $ = function (s) {
  return document.querySelector(s);
};
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function clone(o) {
  return o == null ? o : JSON.parse(JSON.stringify(o));
}
function uid(p) {
  return p + Math.random().toString(36).slice(2, 8);
}
function num(v) {
  return v === '' || v == null || isNaN(+v) ? null : +v;
}
function getPath(root, path) {
  var o = root;
  path.split('.').forEach(function (k) {
    o = o == null ? undefined : o[k];
  });
  return o;
}
function plural(n, w) {
  return n + ' ' + w + (n === 1 ? '' : 's');
}
function str(v, max) {
  return v == null ? '' : String(v).slice(0, max || 300);
}
function strList(v) {
  return Array.isArray(v)
    ? v
        .map(function (x) {
          return str(x, 60).trim();
        })
        .filter(Boolean)
        .slice(0, 30)
    : [];
}
function setPath(root, path, val) {
  var parts = path.split('.'),
    o = root;
  for (var i = 0; i < parts.length - 1; i++) {
    var k = parts[i];
    if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
    o = o[k];
  }
  o[parts[parts.length - 1]] = val;
}
function move(arr, i, d) {
  var j = i + d;
  if (j < 0 || j >= arr.length) return;
  var t = arr[i];
  arr[i] = arr[j];
  arr[j] = t;
}
