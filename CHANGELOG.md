# Changelog

## Unreleased

- **Header key:** two rows (appetite, links). The target key is removed.
- **Incidents:** Notable incidents lists at most two, most severe first, one line each. The rest collapse into "+N more" with a tooltip. Category and risk are in the tooltip.
- **Sample data:** `data/sample-large.json` has 19 initiatives and 11 described incidents for layout testing. Import it from Configure, Data.
- **Ongoing initiatives:** each initiative is one line, with the details behind a per-row expander. Clicking anywhere on the row opens it.
  - The row reads: name and type, progress, avoided loss against cost, delivery status.
  - Avoided loss leads with the money and keeps the bar with its cost marker. Expanding shows expected loss now, loss after delivery, and cost with payback.
  - Expanding also shows the indicator (now and projected), and the category and risk links.
  - Section 4 is about half its previous height with 19 initiatives.
- **Tooltips:** rows are grouped into labelled sections. Money sections (FAIR loss estimates, avoided loss and cost) are green, using a new `--green-tip` token for the inverted panel.
- **Fix:** a highlighted row no longer hides the empty part of its progress and value bars.
- **Subcategory status:** a fourth option, n/a (grey bar), for no data or no capability.
- **Quarter data:** each category says what its number measures, its unit and which way is better.
- **Tags:** every risk in the library and samples, and every sample initiative, has tags from one shared vocabulary.
- **Top risks:** each row's loss bar is labelled Loss estimate and is larger.
- **Quantified loss:** three steps (how often, what it costs, what this means) with read-back sentences, result tiles and an interactive loss bar. A How to estimate guide gives worked examples that fill the dials.
- **Initiative value:** the same three-step journey, a guide with typical reductions, and a Delete estimate with confirmation.
- **Running cost:** initiatives have `runCost` (a year, default 0). It is taken off avoided loss; ratio, return and payback use the net figure.
- **Fix:** dials show the stored value instead of the nearest step.
- **Estimation guides:** the risk and initiative guides share one compact template: icon cards, example tabs with range bars, and a suggested example matched on tags that fills in the record being edited. The risk guide has 8 examples; the initiative guide has 9.
- **Confirmations:** deleting a loss estimate or a value estimate now asks first.

## 1.0.0 (2026-09-17)

Minimum viable product, published as **ExecDash**. The dashboard, configuration and data handling are complete for quarterly board and committee use.

### Dashboard

- **Views:**
  - Every section has a Detailed and Compact switch, remembered per section.
  - The navigation bar switches all sections at once, and shows when sections are mixed.
  - Compact Programme at a glance shows maturity as bars instead of the radar.
  - Compact What has changed shows top risks full width, one line each.
- **Across the programme:** a summary box under Programme maturity covers top risks, exposure, incidents and initiatives, and links to each section. The section is no taller on desktop.
- **Consistent links:** categories, risks, initiatives and incidents referenced from other items share one chip style with a letter badge (C, R, I, !). The header shows a key. Attributes such as impact and type use a plain style.
- **Severities and priorities:**
  - Incidents use priorities, P0 to P3 by default.
  - Exposure and incidents log every level, but the dashboard shows only the top levels chosen under Structure, two by default.
  - Totals and movement use the shown levels. Tooltips give the full breakdown.
- **Incidents:** notable incidents can be described, linked to a cyber domain or a risk, and shown on hover. Linked risks highlight when you hover an incident.
- **Exposure:**
  - Renamed from Vulnerability exposure, with Application and Infrastructure as default groups.
  - Appetite and tolerance can be set for each severity, with status on the tile.
- **Initiatives:**
  - Projected impact names the category and indicator, and says where the projection lands against appetite.
  - The value estimate is avoided loss against cost, calculated from the linked risks' simplified FAIR estimates, with ratio, return on security investment and payback. The section total counts shared risks once.
  - It is labelled as avoided loss, not overall cyber improvement.
- **State of the programme:** the initiative chip on a category card jumps to its initiatives and highlights them.
- **Top risks:** rating and movement sit side by side. In Detailed view, each risk shows its linked initiatives and incidents.
- **Large numbers:** exposure and incident tiles switch to compact figures (for example 22.3k) when counts are large. Tested with over 250,000 open vulnerabilities.
- **Navigation:** on narrower screens, inactive section links shorten to their number.

### Configure

- **Categories:** each category can be hidden from the dashboard while keeping its data, from Structure or Quarter data.
- **Risks:** a risk can have several impacts.
- **Quarter data:**
  - Split into numbered section tabs, each with a summary, plus previous and next buttons.
  - Categories are shown as compact cards.
- **Structure:**
  - Incidents have their own section.
  - Appearance settings: accent colour, colour-blind safe status colours, theme, heading font, corners, spacing and animation.
- **Help:** fields that need explaining carry an information icon.
- **Data tab:**
  - Export and reset share one set of cards. Every reset asks for confirmation.
  - The risk register, the initiative register or all quarters can be cleared on their own, keeping the structure.
  - Reset everything and Reset to sample data are also available.
- **Data integrity:**
  - Delete buttons say what is linked. Deleting a category can move its links to another category.
  - Saving removes links to deleted items across the registers and every quarter.
  - A Data health check lists and fixes broken links.

### Fixes

- Commentary controls no longer overflow into neighbouring cells.
- The maturity radar's bottom label is no longer clipped.
- The configuration tab bar no longer shows a stray scroll bar.

### Code

- **Name:** the project is now ExecDash. The browser tab shows the dashboard title followed by ExecDash. Storage keys and the export format are unchanged, so existing data and backups still work.

- **Browser only:** runtime-specific code and messages have been removed.
- **Script:** split into 28 modules under `src/js`, grouped by responsibility, and formatted with Prettier. Unused functions, variables and legacy binding paths were removed, and the combined script lints clean.
- **Styles:** consolidated into 9 topic files under `src/css`. Dead selectors were removed and 53 duplicate blocks merged. Verified pixel-identical against the previous build.
- **Build:** `scripts/build.mjs` concatenates the modules into the single `index.html`.
- **Tests:** the smoke test now has 29 checks, including editing and saving, view switching, resets and data health.
- **Screenshots:** `scripts/screenshots.py` regenerates the README images.
- **Contributors:** `CLAUDE.md` describes the architecture and conventions for contributors and coding agents.

## 0.1.0 (2026-09-17)

First public release.

- **Dashboard:** four sections, covering categories against appetite, maturity radar, top risks with loss buckets, vulnerability exposure, incidents, category gauges and ongoing initiatives.
- **Configure:** quarter data, structure, risk and initiative registers, quarters, and import and export.
- **Simplified FAIR:** loss estimates with a combined exposure view.
- **Commentary:** optional notes on changed items, shown in tooltips.
- **Links:** optional links between initiatives and risks.
- **Storage:** runs from any static host using browser storage.
