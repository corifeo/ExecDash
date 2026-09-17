/* Fixed labels and enumerations shared across the app. */

var W = { g: 'Within', a: 'Tolerance', r: 'Outside', on: 'On target', off: 'Behind target' };
var WL = {
  g: 'Within appetite',
  a: 'Within tolerance',
  r: 'Outside tolerance',
  on: 'On target',
  off: 'Behind target'
};
var GROUP = { r: 'Outside tolerance', a: 'Within tolerance', g: 'Within appetite' };
var PERIODS = { 1: 'January to March', 2: 'April to June', 3: 'July to September', 4: 'October to December' };
var UNITS = [
  ['count', 'Count'],
  ['%', 'Percent'],
  ['h', 'Hours'],
  ['£k', '£ thousands']
];
var C = { g: 'var(--green)', a: 'var(--amber)', r: 'var(--red)' };
var DS = [
  ['ns', 'Not started'],
  ['on', 'On track'],
  ['risk', 'At risk'],
  ['off', 'Off track'],
  ['done', 'Complete']
];
function dsName(k) {
  var m = DS.filter(function (x) {
    return x[0] === k;
  })[0];
  return m ? m[1] : 'No data';
}
