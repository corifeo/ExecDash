/* Configure, Structure tab. */

function cfgLossBands(c) {
  var n = c.lossBands.length;
  return (
    '<section class="csec"><h2>Loss bands' +
    info(
      'Loss buckets used on the dashboard. A risk\u2019s expected annual loss is shown by the bucket it falls in.'
    ) +
    '</h2><p class="hint">Bands used to place quantified loss on the dashboard tracker. Drag each dial to set where the band ends. The last band is open-ended.</p><div class="bandrow">' +
    c.lossBands
      .map(function (b, i) {
        var last = i === n - 1;
        return (
          '<div class="bandcell"><span class="bsw" style="background:' +
          bandCol(i, n) +
          '"></span>' +
          inp(
            'c:lossBands.' + i + '.name',
            b.name,
            'text',
            ' data-rr style="min-width:0;width:130px" aria-label="Band name"'
          ) +
          (last
            ? '<div class="knob sm ghost"><span class="kv">Above ' +
              esc(money(num(c.lossBands[i - 1] && c.lossBands[i - 1].upTo) || 0)) +
              '</span><span class="kl">Open-ended</span></div>'
            : knob('c:lossBands.' + i + '.upTo', b.upTo, 'money', 'Up to', { small: true })) +
          (n > 2 ? delBtn('band:' + b.id) : '') +
          '</div>'
        );
      })
      .join('') +
    '</div><div style="max-width:520px;margin-top:14px"><div class="lbar big">' +
    c.lossBands
      .map(function (b, i) {
        return '<span class="lz" style="background:' + bandCol(i, n) + '"></span>';
      })
      .join('') +
    '</div><div class="lbl">' +
    c.lossBands
      .map(function (b) {
        return '<span>' + esc(b.name) + '</span>';
      })
      .join('') +
    '</div></div><p class="addrow">' +
    addBtn('addband', 'Add band') +
    '</p></section>'
  );
}
function focusSel(path, list, val) {
  return sel(
    path,
    list.map(function (k, i) {
      return [i + 1, 'Top ' + (i + 1) + ': ' + list.slice(0, i + 1).join(', ')];
    }),
    val,
    true
  );
}
function cfgIncStructure(c) {
  return (
    '<section class="csec"><h2>Incidents</h2><p class="hint">All priorities are logged in Quarter data. The dashboard shows the top priorities you choose here, and movement is calculated on those.</p>' +
    '<div class="rowf top">' +
    fld(
      'Priorities, highest first',
      tagEditor('c:severities', c.severities, {
        ordered: true,
        label: 'Incident priorities',
        placeholder: 'Add priority, for example P4'
      }),
      'wide'
    ) +
    fld(
      'Shown on the dashboard',
      focusSel('c:incFocus', c.severities, c.incFocus),
      '',
      'Only the top levels appear on the dashboard, and totals and movement use those levels. Every level stays in the data and in tooltips.'
    ) +
    fld(
      'Time to contain target (hours)',
      inp('c:ttcTarget', c.ttcTarget, 'number'),
      '',
      'The median time, in hours, from detection to containment that the programme aims for.'
    ) +
    '</div></section>'
  );
}
function cfgVulnStructure(c) {
  return (
    '<section class="csec"><h2>Exposure</h2><p class="hint">Groups are separate slices of the estate and should not overlap, because the dashboard adds them up. Appetite applies to the total for each severity shown on the dashboard. Leave both limits empty for no appetite.</p>' +
    '<div class="rowf">' +
    fld('Tile title', inp('c:exposureTitle', c.exposureTitle, 'text', ' data-rr')) +
    '</div>' +
    '<div class="rowf top" style="margin-top:12px">' +
    fld(
      'Groups, in display order',
      objTagEditor('c:vulnGroups', c.vulnGroups, {
        prefix: 'g',
        label: 'Exposure groups',
        itemLabel: 'Group',
        placeholder: 'Add group'
      }),
      'wide'
    ) +
    fld(
      'Severities, highest first',
      tagEditor('c:vulnSeverities', c.vulnSeverities, {
        ordered: true,
        label: 'Severities',
        placeholder: 'Add severity'
      }),
      'wide'
    ) +
    fld(
      'Shown on the dashboard',
      focusSel('c:vulnFocus', c.vulnSeverities, c.vulnFocus),
      '',
      'Only the top levels appear on the dashboard, and totals and movement use those levels. Every level stays in the data and in tooltips.'
    ) +
    '</div>' +
    '<div class="apgrid">' +
    focusSev(c.vulnSeverities, c.vulnFocus)
      .map(function (k, i) {
        var l = c.vulnAppetite[k] || {};
        return (
          '<div class="apcell"><span class="shd"><i class="vs s' +
          i +
          '"></i>' +
          esc(k) +
          info('The limits apply to the total open count at this severity across all groups.') +
          '</span><div class="rowf">' +
          fld(
            'Appetite, or fewer',
            inp('c:vulnAppetite.' + k + '.appetite', l.appetite, 'number', ' data-rr min="0"')
          ) +
          fld(
            'Tolerance, up to',
            inp('c:vulnAppetite.' + k + '.tolerance', l.tolerance, 'number', ' data-rr min="0"')
          ) +
          '</div>' +
          (num(l.appetite) != null && num(l.tolerance) != null && +l.tolerance < +l.appetite
            ? '<span class="al" style="color:var(--red)">Tolerance should not be lower than appetite.</span>'
            : '') +
          '</div>'
        );
      })
      .join('') +
    '</div></section>'
  );
}
function indicatorFields(path, ind) {
  var tg = isTarget(ind);
  var row =
    fld(
      'Measured against',
      sel(
        path + '.type',
        [
          ['appetite', 'Appetite and tolerance'],
          ['target', 'Target']
        ],
        ind.type || 'appetite',
        true
      ),
      '',
      'Appetite and tolerance compares the value with two limits: within appetite, within tolerance, or outside tolerance. Target shows the value as on or behind target.'
    ) + fld('Unit', sel(path + '.unit', UNITS, ind.unit, true));
  var pc = ind.unit === '%',
    mx = pc ? gaugeMax(ind, null) : null,
    sl = function (k, lab) {
      return pc
        ? slider(path + '.' + k, ind[k], {
            max: k === 'max' ? 100 : mx,
            step: 0.5,
            rr: true,
            zones: k === 'max' ? '' : zoneGradient(ind, mx),
            label: lab,
            width: '190px'
          })
        : inp(path + '.' + k, ind[k], 'number', k === 'max' ? ' data-rr placeholder="Auto"' : ' data-rr');
    };
  if (tg)
    row +=
      fld(
        'Better when',
        sel(
          path + '.direction',
          [
            ['higher', 'Higher'],
            ['lower', 'Lower']
          ],
          ind.direction || 'higher',
          true
        ),
        '',
        'Whether lower or higher values are better. Most risk indicators are better when lower.'
      ) +
      fld(
        'Target',
        sl('target', 'Target'),
        '',
        'The value the category should reach. At or better than this it shows as on target.'
      );
  else
    row +=
      fld(
        'Better when',
        sel(
          path + '.direction',
          [
            ['lower', 'Lower'],
            ['higher', 'Higher']
          ],
          ind.direction || 'lower',
          true
        ),
        '',
        'Whether lower or higher values are better. Most risk indicators are better when lower.'
      ) +
      fld(
        'Appetite limit',
        sl('appetite', 'Appetite limit'),
        '',
        'The value the board is willing to accept. At or inside this limit the category is within appetite.'
      ) +
      fld(
        'Tolerance limit',
        sl('tolerance', 'Tolerance limit'),
        '',
        'Past appetite but still acceptable for a limited time. Beyond this limit the category is outside tolerance and should be escalated.'
      );
  row += fld(
    'Gauge maximum',
    sl('max', 'Gauge maximum'),
    '',
    'The top of the gauge on the dashboard. Leave it empty to size the gauge automatically.'
  );
  return (
    '<div class="rowf">' +
    fld('Indicator description', inp(path + '.desc', ind.desc), 'wide') +
    '</div><div class="rowf">' +
    row +
    '</div>'
  );
}
function catDeletePanel(c, cat) {
  var u = catUsage(c, cat.id),
    others = c.categories.filter(function (x) {
      return x.id !== cat.id;
    });
  return (
    '<div class="delpanel"><b>Delete ' +
    esc(cat.name) +
    '?</b><p class="desc">' +
    (u.risks || u.inits || u.incs
      ? 'It is used by ' +
        [
          u.risks ? plural(u.risks, 'risk') : '',
          u.inits ? plural(u.inits, 'initiative') : '',
          u.incs ? plural(u.incs, 'incident') : ''
        ]
          .filter(Boolean)
          .join(', ') +
        '. Move them to another category, or leave them without one.'
      : 'Nothing else uses this category.') +
    ' Its quarter values will be removed when you save.</p>' +
    (u.risks || u.inits || u.incs
      ? '<div class="rowf">' +
        fld(
          'Move linked items to',
          '<select id="reas:' +
            esc(cat.id) +
            '"><option value="">Leave without a category</option>' +
            others
              .map(function (x) {
                return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>';
              })
              .join('') +
            '</select>'
        ) +
        '</div>'
      : '') +
    '<div class="tools" style="justify-content:flex-start">' +
    delBtn('cat:' + cat.id) +
    '</div></div>'
  );
}
function cfgStructure() {
  var c = wcfg,
    out = '';
  out +=
    '<section class="csec"><h2>General</h2><div class="rowf">' +
    fld('Dashboard title', inp('c:title', c.title), 'wide') +
    fld('Committee', inp('c:committee', c.committee), 'wide') +
    '</div><div class="rowf" style="margin-top:12px">' +
    fld('Footer', inp('c:footer', c.footer), 'wide') +
    '</div>' +
    '<div class="rowf" style="margin-top:12px">' +
    fld('Maturity framework', inp('c:maturityLabel', c.maturityLabel)) +
    fld(
      'Maturity scale maximum',
      inp('c:maturityMax', c.maturityMax, 'number', ' min="1"'),
      '',
      'The highest possible maturity score, usually 5 for CSF tiers or maturity levels.'
    ) +
    fld(
      'Top risks shown',
      inp('c:topN', c.topN, 'number', ' min="1"'),
      '',
      'The most risks allowed in each quarter\u2019s top risks list.'
    ) +
    '</div>' +
    '<div class="rowf" style="margin-top:12px">' +
    fld(
      'Appetite levels, lowest first',
      tagEditor('c:appetiteLevels', c.appetiteLevels, {
        ordered: true,
        label: 'Appetite levels',
        placeholder: 'Add level'
      }),
      'wide'
    ) +
    fld(
      'Risk ratings, highest first',
      tagEditor('c:ratings', c.ratings, { ordered: true, label: 'Risk ratings', placeholder: 'Add rating' }),
      'wide'
    ) +
    '</div>' +
    '<div class="rowf" style="margin-top:12px">' +
    fld(
      'Risk impact types',
      tagEditor('c:impacts', c.impacts, { label: 'Impact types', placeholder: 'Add impact type' }),
      'wide'
    ) +
    '</div></section>';
  out +=
    '<section class="csec"><h2>Cyber categories</h2><p class="hint">Each category has one headline indicator, measured against appetite and tolerance or against a target. Subcategories are optional. Hidden categories keep their data but do not appear on the dashboard.</p>' +
    c.categories
      .map(function (cat, i) {
        var p = 'c:categories.' + i,
          tg = isTarget(cat.indicator);
        return (
          '<details class="ccard" data-id="' +
          esc(cat.id) +
          '"' +
          (openCats[cat.id] || armed === 'cat:' + cat.id ? ' open' : '') +
          '><summary><span class="cname">' +
          esc(cat.name) +
          '</span>' +
          (cat.hidden ? '<span class="pill off">Hidden</span>' : '') +
          '<span class="al">' +
          esc(tg ? 'Target based' : cat.appetite ? 'Appetite: ' + cat.appetite : 'Appetite not set') +
          ', ' +
          cat.subs.length +
          ' subcategories</span></summary><div class="cbody"><div class="top"><div class="rowf">' +
          fld('Category', inp(p + '.name', cat.name, 'text', ' data-rr')) +
          (tg
            ? ''
            : fld(
                'Appetite',
                sel(
                  p + '.appetite',
                  c.appetiteLevels.map(function (a) {
                    return [a, a];
                  }),
                  cat.appetite
                )
              )) +
          '</div><div class="tools"><label class="swlab">' +
          swb(p + '.hidden', !cat.hidden, 'Show ' + cat.name + ' on the dashboard') +
          '<span>Show on dashboard</span></label>' +
          moveBtns('mvcat', i, c.categories.length) +
          (armed === 'cat:' + cat.id ? '' : delBtn('cat:' + cat.id)) +
          '</div></div>' +
          (armed === 'cat:' + cat.id ? catDeletePanel(c, cat) : '') +
          indicatorFields(p + '.indicator', cat.indicator) +
          fld(
            'Subcategories',
            objTagEditor(p + '.subs', cat.subs, {
              prefix: 's',
              label: cat.name + ' subcategories',
              itemLabel: 'Subcategory',
              placeholder: 'Add subcategory'
            }),
            'wide'
          ) +
          '</div></details>'
        );
      })
      .join('') +
    '<p class="addrow">' +
    addBtn('addcat', 'Add category') +
    '</p></section>';
  out +=
    '<section class="csec"><h2>Initiative types</h2><p class="hint">Rename a type in place. The first type is highlighted on the dashboard.</p>' +
    objTagEditor('c:initiativeTypes', c.initiativeTypes, {
      prefix: 't',
      label: 'Initiative types',
      itemLabel: 'Type',
      placeholder: 'Add type',
      count: function (t) {
        var n = c.initiatives.filter(function (x) {
          return x.type === t.id;
        }).length;
        return n + ' used';
      }
    }) +
    '</section>';
  out +=
    '<section class="csec"><h2>Maturity functions</h2><p class="hint">Drag the dial to set each function\u2019s target.</p><div class="dialgrid">' +
    c.functions
      .map(function (f, i) {
        return (
          '<div class="dialcell">' +
          knob('c:functions.' + i + '.target', f.target, 'score', 'Target', { max: +c.maturityMax || 5 }) +
          inp(
            'c:functions.' + i + '.name',
            f.name,
            'text',
            ' data-rr style="min-width:0;width:140px" aria-label="Function name"'
          ) +
          '<div class="tools">' +
          moveBtns('mvfn', i, c.functions.length) +
          delBtn('fn:' + f.id, 'Delete', delWarn('fn', f.id)) +
          '</div></div>'
        );
      })
      .join('') +
    '</div><p class="addrow">' +
    addBtn('addfn', 'Add function') +
    '</p></section>';
  out += cfgLossBands(c) + cfgIncStructure(c) + cfgVulnStructure(c) + styleSection(c);
  return out;
}
var openCats = {};
document.addEventListener(
  'toggle',
  function (e) {
    var d = e.target;
    if (d.matches && d.matches('details.paste')) pasteOpen = d.open;
    if (d.matches && d.matches('details.ccard') && d.dataset.id) openCats[d.dataset.id] = d.open;
  },
  true
);
