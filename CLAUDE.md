# CLAUDE.md

Guidance for Claude Code and other contributors working on ExecDash.

## What this is

ExecDash is a board-level cyber security dashboard for a UK financial services firm. It is a single static HTML file with no runtime dependencies:

- **Dashboard:** a four-section view for a board or Executive Risk Committee.
- **Timeline view:** a full width delivery gantt with the cumulative cost against avoided loss, reached from the header or the Projected avoided loss box.
- **Configure view:** where the security team enters quarterly data, maintains risk and initiative registers, sets the structure and manages data.
- **Storage:** all data lives in the browser's `localStorage`. Export and import are JSON files.

Version 1.0.0 is the MVP. The repository is `ExecDash` on GitHub, served by GitHub Pages.

**Names that must not change**, because saved data and existing exports depend on them:

- storage keys prefixed `execdash:` (the `SK` constant)
- the export `format` value `exec-dashboard`
- export file names `exec-dashboard-*.json`, which `.gitignore` excludes

The default in-app title, "Cyber security dashboard", is what the board sees and is set under Structure. See `README.md` for the product description and `docs/data-model.md` for the data formats and calculations.

## Commands

```bash
node scripts/build.mjs            # build index.html from src/ (always run after editing src/)
node scripts/build.mjs --check    # CI: fail if index.html is stale
python tests/smoke_test.py        # Playwright smoke test (36 checks); needs a fresh build
python scripts/screenshots.py     # regenerate docs/screenshots from the sample data
npx prettier@3 --write "src/**/*.{js,css}" scripts/build.mjs   # format (settings in .prettierrc.json)
npm run serve                     # serve locally on http://localhost:8000 (Node, no Python needed)
```

**Test dependencies:** `pip install playwright pillow` then `playwright install chromium`.

**Deliverable:** `index.html` is committed and served by GitHub Pages, so always commit it together with the `src/` change. CI runs the build check and the smoke test.

## Architecture

```
src/index.template.html   Page shell. Contains the /* STYLES */ and /* SCRIPT */ markers.
src/css/NN-topic.css      Concatenated in file-name order into <style>.
src/js/NN-module.js       Concatenated in file-name order into one strict-mode IIFE.
scripts/build.mjs         Does the concatenation and a syntax check.
```

**One scope.** All modules share a single function scope, so there are no imports or exports:

- Top-level `function` declarations are hoisted and can be called from any module.
- Top-level `var` initialisers run in file order. Keep start-up code in `70-app.js`, which is last.
- Each file starts with a one-line comment saying what it owns. Keep that comment accurate.

### Script modules

| File | Owns |
|---|---|
| `01-util` | `$`, `esc`, `clone`, `uid`, `num`, `plural`, `getPath`/`setPath`, `move`, `str`/`strList` |
| `02-constants` | Status words (`W`, `WL`), units, delivery statuses (`DS`) |
| `03-state` | Shared state: saved data (`config`, `quarters`), working copies (`wcfg`, `wq`), view, dirty flags, `CTX` |
| `10-model` | `defaultConfig`, `normalizeConfig`, `normalizeQ`, lookups (`findCat`, `findRisk`…), status rules (`statusFor`, `catStatus`, `movement`), totals |
| `11-format` | `fmt`, `nf`, `money`, `pctChange`/`pctHtml`, `deltaLabel`, `thrText` |
| `12-integrity` | Usage counts, `cfgFixes`/`qFixes` (clean-up on save), `QFIX` queue, Data health |
| `13-fair` | Simplified FAIR simulation (`simRisk`, `simPortfolio`), loss bands, `initValue`/`portfolioValue` (net of `runCost`) |
| `20-motion` | `ANIM`, count-ups (`tween`, `runAnims`), reveal on scroll |
| `21-tooltips` | `tip()`/`TIPS` registry, `tipHtml`, hover and focus handling, cross-highlighting (`applyHl`, `applyInitFilter`) |
| `22-components` | `ref()` link chips, `attr()`, `cu()` counters, `tileHead`, `sevGrid`, value bars, view toggles (`secView`, `applySecView`, `allViewSeg`) |
| `23-charts` | Gauges, radar, maturity bars, loss tracker and buckets |
| `30-dashboard` | Header, `band()` section wrapper, navigation bar, collapse state, `renderDashboard` |
| `31`–`34-section-*` | One file per dashboard section (`layer1`…`layer4`) |
| `35-timeline` | Timeline view: `renderTimeline`, delivery gantt, row detail, cumulative chart |
| `40-controls` | Form controls: `fld`, `sel`, `inp`, `swb`, `info`, `delBtn`, `multiPick`, `tagEditor`, `slider`, `noteCtl`, `openModal`/`closeModal` |
| `41-dials` | Rotary dial (`knob`) for scores, money and frequency |
| `42-config` | `renderConfig`, tabs, save bar (`updateBar`), `rerenderConfig` |
| `43`–`47-config-*` | One file per Configure tab: Quarter data, Structure, Risks and initiatives, Quarters, Data |
| `48-appearance` | `applyStyle` and the Appearance section |
| `50-storage` | `localStore()`: a small document API over `localStorage` |
| `60-events` | All event listeners: `bindValue`, input and change handling, and the `data-act` click switch |
| `70-app` | `save`, `render`, `refresh`, start-up |

### Style files

| File | Contents |
|---|---|
| `00-tokens` | Colour tokens for light and dark, base elements |
| `10-layout` | Header, section bands and rail, grids, navigation bar |
| `20-components` | Tiles, pills, status shapes, `.ref` chips, buttons, segmented controls |
| `30-dashboard` | Section content and compact variants |
| `35-timeline` | Timeline view: page, gantt, row detail, cumulative chart |
| `40-motion` | Keyframes and `.anim` rules |
| `45-tooltips` | Tooltip panel |
| `50-config` | Configure view |
| `90-appearance` | `[data-corners]` and `[data-density]` |
| `95-responsive` | Media queries |

**Cascade.** A few rules sit outside their natural topic file because they must come after a rule of equal specificity in a later file. When adding a rule, put it in its topic file. If it does not take effect, check for an equal-specificity rule later in the cascade rather than adding `!important`.

### Data

**Documents.** `localStorage['execdash:store']` holds a JSON object of documents:

- `dashboard/config`: structure, lists and appearance. The registers are split out by `stripCfg`.
- `dashboard/risks` and `dashboard/initiatives`: `{ items: [...] }`.
- `quarters/<YYYY-Qn>`: one document per quarter.

**View preferences** are kept under separate keys: `execdash:collapsed`, `viewKey(n)` for each section, and `execdash:tlrange` and `execdash:tlview` for the Timeline.

**Loading and migration.** At start-up, `70-app.js` subscribes to the documents, merges the registers into `config`, and calls `normalizeConfig`. Quarters are normalised on use with `normalizeQ(q, cfg)`.

- Normalisation is the only migration mechanism. When a stored shape changes, handle the old shape there. An example is `risk.impact` (a string) becoming `risk.impacts` (an array).
- Import has its own sanitisers (`cleanRisk`, `cleanInit`, `cleanFair`, `validateImport`) in `47-config-data.js`. Update them when adding fields.

**Links between records.**

- Most links use ids: `categoryId`, `riskId`, `riskIds`, `subId`, initiative `type`.
- Priorities, severities, ratings and impacts are linked by name.
- On save, `cfgFixes` and `qFixes` remove links to anything deleted, and apply any functions queued in `QFIX`. If you add a new kind of link, add its clean-up rule to both functions and a usage count for the delete warning.

## How rendering works

**Dashboard.** `render()` → `renderHeader()` + `renderDashboard()`.

- `renderDashboard` builds all four sections as HTML strings and sets `innerHTML`, then calls `runAnims`.
- Sections re-render in place where possible, using `CTX` (for example `applySecView` and `l3Body`).

**Configure.** `renderConfig()` rebuilds the active tab from `wcfg`/`wq`.

- Focus and scroll are preserved by `rerenderConfig()`.
- Edits change the working copies only. `save()` writes them and then cleans up.

**Strings, not a framework.** Markup is built by string concatenation. Rules that must always hold:

- **Escaping:** every piece of user or data text goes through `esc()`.
- **Tooltips:** call `tip(html)`, which returns a `data-tip="N"` attribute pointing into `TIPS`. `TIPS` is reset on each dashboard and Configure render. In Configure, only `.info` and elements inside `.fair` show tooltips. Build tooltip content with `tipHtml(title, rows, note, noteLabel)`.
- **Clicks:** use `data-act="name"` plus `data-a`/`data-d` arguments, and handle them in the `switch` in `60-events.js`.
  - Actions that edit the draft set `dirtyCfg` or `dirtyQ` themselves, then `break`. The shared tail clears the save bar message and calls `rerenderConfig()`.
  - Actions that only change the view should `return`.
- **Field binding:**
  - `data-b="c:path.to.value"` binds to `wcfg`, and `data-b="q:path"` binds to `wq`.
  - Text, number and range inputs bind on `input`. Selects bind on `change`.
  - Add `data-rr` to re-render after a change, and `data-num` to store a number.
- **Components:** use the helpers in `40-controls.js` rather than hand-writing inputs. `fld(label, control, cls, info)` wraps a control, and the fourth argument adds an ⓘ with explanatory text.

## Product and UI conventions

These come from the product owner. Keep them.

- **Language:** British English. No em dashes. Plain, declarative wording, with no consultancy tone.
- **Appetite and targets:**
  - A category is measured against either appetite and tolerance (within, tolerance, outside) or a target (on or behind). The two scales are never mixed.
  - Status is always shown by shape as well as colour: ● within, ▲ tolerance, ■ outside.
- **Detail placement:**
  - Detail belongs in hover tooltips. The dashboard stays scannable.
  - Commentary is optional human text, shown only when provided. A small dot marks items that have it.
- **Links:**
  - Any reference to another record uses `ref(kind, text, opts)`: C category, R risk (the rank replaces R for top risks), I initiative, ! incident.
  - Plain attributes use `attr()`.
  - Do not invent new chip styles.
- **Levels shown:** exposure and incidents log every level, but only the top `vulnFocus`/`incFocus` levels appear on the dashboard.
- **Loss:** shown as loss buckets on the dashboard, with money amounts in tooltips.
  - Initiative value is avoided loss against cost, always labelled as avoided loss and not overall improvement.
- **Views:** every section has a Detailed and a Compact view. New content needs a compact treatment, and the section must not grow taller in Compact.
- **Controls in Configure:**

  | Input | Control |
  |---|---|
  | Score, money or frequency | Dial |
  | Percentage | Slider |
  | On or off | Switch (`swb`) |
  | Several choices | Toggle chips (`multiPick`) |
  | List | Tag editor |

  Unusual fields get an ⓘ.
- **Destructive actions** always need a confirmation step: `delBtn` for deletes, `resetarm` for resets. They must say what will be removed and what stays.
- **Accessibility:** buttons have labels, and segmented controls use `aria-pressed`. Animation is off when `prefers-reduced-motion` is set or Appearance turns it off.

## Recipes

**Add a field to a record** (for example a new risk attribute):

1. Default and migrate it in `normalizeConfig` (`10-model.js`).
2. Add the control in the relevant `4x-config-*` file with `fld(...)` and a `data-b` path.
3. Keep it on import in `cleanRisk`/`cleanInit` (`47-config-data.js`).
4. Show it on the dashboard in the relevant `3x-section-*` file, adding tooltip rows with `tipHtml`.
5. Document it in `docs/data-model.md` and `CHANGELOG.md`.

**Add a Structure setting:**

1. Default it in `defaultConfig`.
2. Add the control in `44-config-structure.js`.
3. Read it where it applies. If it affects styling, extend `applyStyle` in `48-appearance.js` and add rules keyed on a `data-*` attribute of `<html>`.

**Add a Quarter data section:**

1. In `cfgData` (`43-config-quarter.js`), write a `'\u0001key\u0001'` marker before the section's markup.
2. Add a label and summary for `key` in `qdTabs`.

**Add a dashboard tile or section:**

1. Build it in the section file, using `tileHead`, `ref`, `cu` and `tip`.
2. Give it a compact treatment: section 1, 2 and 4 bodies toggle a `cpt` class on `#lNview`, and section 3 re-renders.
3. Check desktop (1280), laptop (1024) and phone (390) widths.

**Add a click action:**

1. Emit `data-act="myaction"` in markup.
2. Add `case 'myaction':` in `60-events.js`.

**Add a new link type:**

1. Store it by id.
2. Render it with `ref()`.
3. Add usage counts and delete warnings in `12-integrity.js`, plus clean-up in `cfgFixes`/`qFixes`.
4. Make sure Data health reports it.

## Checking changes

**Every change:**

1. Rebuild.
2. Run the smoke test.
3. Open the page and look at the affected screens in light and dark, Detailed and Compact.

**Layout work:** measure section heights before and after with Playwright, using `document.querySelector('#sec-N').getBoundingClientRect().height`. Check that `document.documentElement.scrollWidth` equals the viewport width, so nothing overflows sideways.

**Refactors:** compare screenshots before and after. The approach used for 1.0.0:

1. Capture about 20 states with animations disabled, by injecting `*{animation:none!important;transition:none!important}` and blurring focus.
2. Diff them pixel by pixel with Pillow's `ImageChops.difference`. A refactor should produce zero differences.
3. For hover, tooltip and animated states, compare `getComputedStyle` for every element across the two builds.

**Linting:** there is no committed lint config. `npx eslint@8` with `no-unused-vars` and `no-undef` run on the combined script (the contents of the final `<script>` in `index.html`) was clean at 1.0.0.

**Data safety:** use the sample (`data/sample-backup.json`) for tests and screenshots. Never commit real risk, incident or vulnerability data; `.gitignore` excludes export files.

## Known limitations and ideas

These are listed in the README roadmap:

- per-quarter loss estimates
- loss appetite in money
- indicators derived from exposure data
- exposure appetite per group
- audit trail
- quarter locking
- print or PDF board pack
- data quality flags
