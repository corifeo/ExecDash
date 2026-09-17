# Data model

All data is plain JSON. The same shapes are used for storage and for import and export.

## Storage documents

| Document | Contents |
|---|---|
| `dashboard/config` | Structure and settings (everything except the two registers) |
| `dashboard/risks` | `{ "items": [Risk, ...] }` |
| `dashboard/initiatives` | `{ "items": [Initiative, ...] }` |
| `quarters/<YYYY>-Q<n>` | One document per quarter, for example `quarters/2026-Q3` |

All documents are kept in the browser under a single local storage key, `cyberdash:store`. View preferences use `cyberdash:collapsed` and `cyberdash:l3view`. A factory reset deletes all three.

## Structure (`dashboard/config`)

| Field | Type | Notes |
|---|---|---|
| `title`, `committee`, `footer` | string | Header and footer text |
| `appetiteLevels` | string[] | Lowest first |
| `ratings` | string[] | Risk ratings, highest first. Used to work out Rising and Falling |
| `severities` | string[] | Incident priorities, highest first. Defaults to P0 to P3 |
| `incFocus` | number | How many of the top priorities the dashboard shows. Defaults to 2 |
| `impacts` | string[] | Risk impact types |
| `topN` | number | Maximum top risks per quarter |
| `ttcTarget` | number | Median time to contain target, hours |
| `exposureTitle` | string | Title of the exposure tile. Defaults to `Exposure` |
| `maturityLabel`, `maturityMax` | string, number | Framework label and scale maximum |
| `defaultQuarter` | string or null | Quarter id to open on. Null means the latest |
| `categories` | Category[] | See below |
| `functions` | `{ id, name, target }[]` | Maturity functions, in radar order |
| `initiativeTypes` | `{ id, name }[]` | The first type is highlighted |
| `lossBands` | `{ id, name, upTo }[]` | Ascending. The last band has `upTo: null` |
| `vulnGroups` | `{ id, name }[]` | Non-overlapping exposure groups, summed on the dashboard. Defaults to Application and Infrastructure |
| `vulnSeverities` | string[] | Highest first |
| `vulnFocus` | number | How many of the top severities the dashboard shows. Defaults to 2 |
| `style` | object | Appearance: `accent` (hex colour), `palette` (`standard` or `cb` for colour-blind safe), `theme` (`system`, `light`, `dark`), `headings` (`serif`, `sans`), `corners` (`rounded`, `square`), `density` (`comfortable`, `compact`), `motion` (`on`, `off`) |
| `vulnAppetite` | object | Optional limits on the total for each severity, for example `{ "Critical": { "appetite": 5, "tolerance": 10 } }`. Lower is better |

### Category

```json
{
  "id": "pp",
  "name": "Product & Platform",
  "appetite": "Low",
  "indicator": {
    "desc": "Internet-facing critical vulnerabilities past SLA",
    "type": "appetite",
    "unit": "count",
    "direction": "lower",
    "appetite": 5,
    "tolerance": 10,
    "target": null,
    "max": 16
  },
  "subs": [{ "id": "s1", "name": "Product security" }],
  "hidden": false
}
```

- `type` is `appetite` (appetite and tolerance limits) or `target`.
- `unit` is `count`, `%`, `h` or `£k`.
- `direction` says whether lower or higher values are better.
- `max` sets the gauge scale. Null means automatic.
- `hidden` keeps the category's data but leaves it off the dashboard.

## Risk

```json
{
  "id": "r2",
  "name": "Compromise through a critical supplier",
  "categoryId": "idt",
  "impacts": ["Operational", "Client detriment"],
  "tags": ["third party"],
  "enabled": true,
  "source": "library",
  "fair": { "fMin": 0.1, "fMl": 0.2, "fMax": 0.5, "lMin": 250000, "lMl": 1500000, "lMax": 10000000 }
}
```

- Only enabled risks are offered when building a quarter's top risks.
- `impacts` can hold several values from the structure's `impacts` list. Older files with a single `impact` string are converted on import.
- `fair` is optional:
  - `f*` values are loss events per year (low, most likely, high).
  - `l*` values are the loss per event in pounds.

## Initiative

```json
{
  "id": "i5",
  "name": "Integration and SaaS access reviews",
  "type": "ci",
  "categoryId": "idt",
  "subId": "s4",
  "start": "Q3 2026",
  "due": "Q4 2026",
  "projected": 3,
  "cost": 60000,
  "reduction": 35,
  "riskIds": ["r2", "lib12"],
  "tags": [],
  "enabled": true
}
```

- `projected` is the expected value of the category indicator once delivered.
- `riskIds` is optional and can be empty.
- `cost` (pounds, one-off) and `reduction` (0 to 100, the expected cut in the linked risks' annual loss once delivered) are optional. Together with the linked risks' `fair` estimates they give the avoided loss: expected annual loss of the linked risks × `reduction`. The section total combines initiatives that share a risk as 1 − ∏(1 − reduction) for that risk, so it is not double counted.

## Quarter

```json
{
  "label": "Q3 2026",
  "period": "July to September",
  "year": 2026,
  "q": 3,
  "categories": {
    "pp": { "value": 14, "status": "auto", "prev": "auto", "trend": { "mode": "auto", "value": null }, "subs": { "s1": "a" }, "note": "" }
  },
  "maturity": { "scores": { "gv": 2.9 }, "notes": { "de": "" }, "trend": { "mode": "auto", "value": null } },
  "topRisks": [{ "riskId": "r2", "rating": "High", "movement": "auto", "note": "" }],
  "incidents": {
    "counts": { "P0": 0, "P1": 1, "P2": 7, "P3": 14 },
    "regulatory": 0,
    "ttc": 6,
    "items": [
      {
        "id": "n1",
        "title": "Credential-stuffing attempt on the client portal",
        "severity": "P1",
        "categoryId": "idt",
        "riskId": "r3",
        "description": "Shown on hover.",
        "reportable": false,
        "ttc": 6
      }
    ]
  },
  "vulns": { "app": { "counts": { "Critical": 5, "High": 30 }, "note": "" } },
  "initiatives": { "i5": { "include": true, "progress": 15, "status": "on", "milestone": "", "note": "" } }
}
```

| Field | Values |
|---|---|
| Category `status`, `prev` | `auto`, or an override: `g`, `a`, `r` (appetite) or `on`, `off` (target). `prev` also accepts `none` |
| Subcategory status | `g`, `a` or `r` |
| `movement` | `auto`, `new`, `rising`, `stable` or `falling` |
| Initiative `status` | `ns` (not started), `on`, `risk`, `off` or `done` |
| `note` | Optional commentary shown in the tooltip under "What changed" |
| Incident `items` | Notable incidents. `categoryId` and `riskId` are optional links. `description` is shown on hover |

## Import and export envelope

```json
{
  "format": "cyber-dashboard",
  "version": 1,
  "type": "backup",
  "exportedAt": "2026-09-17T00:00:00Z",
  "structure": {},
  "risks": [],
  "initiatives": [],
  "initiativeTypes": [],
  "quarters": { "2026-Q3": {} }
}
```

- `type` is `structure`, `risks`, `initiatives`, `quarters` or `backup`. Only the keys for that type are required.
- **Merge** matches items by id, then by name, and keeps the existing enabled setting.
- **Replace** swaps the whole set.
- A full backup always replaces everything.
- Quarter ids must look like `2026-Q3`.

## Referential integrity

Links between documents are by id (or by name for priorities, severities, ratings and impacts). When something is deleted:

- the delete button says what is linked to it, and a category can have its linked risks, initiatives and incidents moved to another category first
- saving removes links to anything that no longer exists, in the registers and in every quarter, and reports how many values were cleaned up
- **Data health** under Configure, Data lists any remaining broken links and can fix them in one step

## Calculations

- **Category status:** the value against the appetite and tolerance limits, in the configured direction. For counts, a value equal to a limit sits inside it.
- **Movement:**
  - Category and maturity trends are the difference from the previous quarter, unless overridden.
  - Exposure and incident movement is the percentage change. It shows "New" when the previous value was zero.
- **Exposure status:** each shown severity total is checked against its limits in `vulnAppetite`. The tile shows the worst status.
- **Shown levels:** exposure and incident totals, movement and group bars use only the top `vulnFocus` or `incFocus` levels.
- **Top risk movement:** New if the risk was not in the previous list. Otherwise Rising or Falling from the rating order, or Stable.
- **Loss estimates:**
  - 5,000 simulated years per risk, with frequency and loss per event drawn from triangular distributions.
  - The number of events per year is drawn from a Poisson distribution.
  - Results are seeded, so they do not change between page loads.
  - The dashboard shows the bucket for the expected annual loss, and for the 1 in 10 year loss on the combined tile.
