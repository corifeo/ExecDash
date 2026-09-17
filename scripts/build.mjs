// Builds the single-file dashboard (index.html) from src/.
//
//   node scripts/build.mjs          write index.html
//   node scripts/build.mjs --check  fail if index.html is out of date
//
// Styles: every src/css/*.css file, in file-name order.
// Script: every src/js/*.js file, in file-name order, wrapped in one
// strict-mode function so nothing leaks into the global scope.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const list = (dir, ext) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith(ext))
    .sort()
    .map((f) => join(dir, f));

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const template = read('src/index.template.html');
for (const marker of ['/* STYLES */', '/* SCRIPT */']) {
  if (!template.includes(marker)) fail(`Template is missing the ${marker} marker.`);
}

const cssFiles = list('src/css', '.css');
const jsFiles = list('src/js', '.js');
if (!cssFiles.length || !jsFiles.length) fail('No source files found in src/css or src/js.');

const styles = cssFiles.map((f) => read(f).trimEnd()).join('\n\n');
const script =
  "(function(){\n'use strict';\n\n" +
  jsFiles.map((f) => `/* ===== ${f.replace(/\\/g, '/')} ===== */\n` + read(f).trimEnd()).join('\n\n') +
  '\n})();';

// Syntax check before writing anything.
try {
  new Function(script);
} catch (err) {
  fail(`The combined script has a syntax error: ${err.message}`);
}

const output = template.replace('/* STYLES */', () => styles).replace('/* SCRIPT */', () => script);

const target = join(root, 'index.html');
if (process.argv.includes('--check')) {
  const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (current !== output) fail('index.html is out of date. Run: node scripts/build.mjs');
  console.log('index.html is up to date.');
} else {
  writeFileSync(target, output);
  console.log(
    `Wrote index.html from ${cssFiles.length} style and ${jsFiles.length} script files (${(output.length / 1024).toFixed(1)} KB).`
  );
}
