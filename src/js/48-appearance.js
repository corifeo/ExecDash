/* Appearance settings: accent, palette, theme, headings, corners, spacing and motion. */

var ACCENTS = [
  ['Navy', '#2F4B7C'],
  ['Teal', '#0F6E73'],
  ['Plum', '#6A3D7A'],
  ['Forest', '#2E6B3F'],
  ['Slate', '#3F4A5A'],
  ['Burgundy', '#8A2F45'],
  ['Ochre', '#8A5A12']
];
var CB = {
  light: { g: '#0072B2', a: '#A65F00', r: '#C24A00' },
  dark: { g: '#56B4E9', a: '#F0B34A', r: '#F08A4B' }
};
function hexRgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mixHex(a, b, t) {
  var x = hexRgb(a),
    y = hexRgb(b);
  return (
    '#' +
    x
      .map(function (v, i) {
        return ('0' + Math.round(v * (1 - t) + y[i] * t).toString(16)).slice(-2);
      })
      .join('')
  );
}
function validHex(h) {
  return /^#[0-9a-f]{6}$/i.test(h || '');
}
var DARKQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function applyStyle(st) {
  st = Object.assign(defaultStyle(), st || {});
  var root = document.documentElement,
    css = root.style;
  if (st.theme === 'light' || st.theme === 'dark') root.setAttribute('data-theme', st.theme);
  else root.removeAttribute('data-theme');
  var dark = st.theme === 'dark' || (st.theme !== 'light' && DARKQ && DARKQ.matches);
  var acc = validHex(st.accent) ? st.accent : '#2F4B7C';
  css.setProperty('--accent', dark ? mixHex(acc, '#ffffff', 0.5) : acc);
  css.setProperty('--accent-bg', dark ? mixHex(acc, '#161D27', 0.7) : mixHex(acc, '#ffffff', 0.87));
  ['--green', '--green-bg', '--amber', '--amber-bg', '--red', '--red-bg'].forEach(function (v) {
    css.removeProperty(v);
  });
  if (st.palette === 'cb') {
    var pc = CB[dark ? 'dark' : 'light'],
      bgBase = dark ? '#161D27' : '#ffffff',
      t = dark ? 0.78 : 0.86;
    css.setProperty('--green', pc.g);
    css.setProperty('--green-bg', mixHex(pc.g, bgBase, t));
    css.setProperty('--amber', pc.a);
    css.setProperty('--amber-bg', mixHex(pc.a, bgBase, t));
    css.setProperty('--red', pc.r);
    css.setProperty('--red-bg', mixHex(pc.r, bgBase, t));
  }
  root.setAttribute('data-headings', st.headings);
  root.setAttribute('data-corners', st.corners);
  root.setAttribute('data-density', st.density);
  var want = st.motion !== 'off' && !RM;
  if (want !== ANIM) {
    ANIM = want;
    root.classList.toggle('anim', ANIM);
  }
}
if (DARKQ && DARKQ.addEventListener)
  DARKQ.addEventListener('change', function () {
    applyStyle(view === 'config' && wcfg ? wcfg.style : config && config.style);
  });
function styleSection(c) {
  var st = c.style;
  var sw = ACCENTS.map(function (a) {
    return (
      '<button class="swatch' +
      (st.accent.toLowerCase() === a[1].toLowerCase() ? ' on' : '') +
      '" style="--sw:' +
      a[1] +
      '" data-act="stylepick" data-a="accent" data-d="' +
      a[1] +
      '" title="' +
      a[0] +
      '" aria-label="' +
      a[0] +
      ' accent" aria-pressed="' +
      (st.accent.toLowerCase() === a[1].toLowerCase()) +
      '"></button>'
    );
  }).join('');
  return (
    '<section class="csec"><h2>Appearance' +
    info(
      'Changes preview straight away and apply to everyone who opens this data once saved. Status shapes stay the same whatever colours you choose.'
    ) +
    '</h2><p class="hint">Basic styling for the dashboard. Changes preview as you make them.</p>' +
    '<div class="rowf top">' +
    fld(
      'Accent colour',
      '<div class="swatches">' +
        sw +
        '<label class="swcustom" title="Custom colour"><input type="color" data-b="c:style.accent" data-rr value="' +
        esc(validHex(st.accent) ? st.accent : '#2F4B7C') +
        '" aria-label="Custom accent colour"><span>Custom</span></label></div>',
      '',
      'Used for links, highlights, maturity and progress bars.'
    ) +
    fld(
      'Status colours',
      sel(
        'c:style.palette',
        [
          ['standard', 'Standard (green, amber, red)'],
          ['cb', 'Colour-blind safe (blue, orange, vermilion)']
        ],
        st.palette,
        true
      ),
      '',
      'The colour-blind safe palette follows the Okabe-Ito colours. Status shapes are shown either way.'
    ) +
    fld(
      'Theme',
      sel(
        'c:style.theme',
        [
          ['system', 'Follow the device'],
          ['light', 'Always light'],
          ['dark', 'Always dark']
        ],
        st.theme,
        true
      )
    ) +
    '</div>' +
    '<div class="rowf top" style="margin-top:12px">' +
    fld(
      'Headings',
      sel(
        'c:style.headings',
        [
          ['serif', 'Serif'],
          ['sans', 'Sans serif']
        ],
        st.headings,
        true
      )
    ) +
    fld(
      'Corners',
      sel(
        'c:style.corners',
        [
          ['rounded', 'Rounded'],
          ['square', 'Square']
        ],
        st.corners,
        true
      )
    ) +
    fld(
      'Spacing',
      sel(
        'c:style.density',
        [
          ['comfortable', 'Comfortable'],
          ['compact', 'Compact']
        ],
        st.density,
        true
      ),
      '',
      'Compact spacing tightens padding across the dashboard, independent of each section\\u2019s Compact view.'
    ) +
    fld(
      'Animation',
      sel(
        'c:style.motion',
        [
          ['on', 'On'],
          ['off', 'Off']
        ],
        st.motion,
        true
      ),
      '',
      'Viewers who ask their device for reduced motion never see animation, whatever this is set to.'
    ) +
    '</div>' +
    '<div class="stylepreview"><span class="pill g">Within appetite</span><span class="pill a">Within tolerance</span><span class="pill r">Outside tolerance</span>' +
    ref('cat', 'Category') +
    ref('risk', 'Risk') +
    ref('init', 'Initiative') +
    '<span class="spbar"><i></i></span><button class="btn link" data-act="stylereset">Restore default appearance</button></div></section>'
  );
}
