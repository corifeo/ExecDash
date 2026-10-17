// Prints the CHANGELOG.md section for the version in package.json.
//
//   node scripts/release-notes.mjs          print the section (used for GitHub releases)
//   node scripts/release-notes.mjs --check  fail if the section is missing or empty
//
// A section starts with "## X.Y.Z (YYYY-MM-DD)" and runs to the next "## " heading.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const { version } = JSON.parse(read('package.json'));
if (!/^\d+\.\d+\.\d+$/.test(version || '')) fail(`package.json version "${version}" is not X.Y.Z.`);

const lines = read('CHANGELOG.md').split('\n');
const head = new RegExp(`^## ${version.replace(/\./g, '\\.')} \\(\\d{4}-\\d{2}-\\d{2}\\)\\s*$`);
const start = lines.findIndex((l) => head.test(l));
if (start < 0) fail(`CHANGELOG.md has no "## ${version} (YYYY-MM-DD)" section for the package.json version.`);
let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
if (end < 0) end = lines.length;
const notes = lines
  .slice(start + 1, end)
  .join('\n')
  .trim();
if (!notes) fail(`The CHANGELOG.md section for ${version} is empty.`);

if (process.argv.includes('--check')) console.log(`CHANGELOG.md has notes for ${version}.`);
else console.log(notes);
