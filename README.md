# HSC Truth Engine

**hscdata.org** — Transparent HSC data. No myths. Just mathematics.

An open-source platform that explains how the NSW HSC and ATAR actually work, built with publicly available data from NESA and UAC.

---

## Modules

| Module | Description |
|---|---|
| **Insights** | Deep-dive articles explaining scaling, moderation, and the mathematics behind HSC results. KaTeX-rendered formulas, interactive charts. |
| **Calculator** | Estimate your ATAR from expected HSC marks. Uses UAC Table A3 (scaling parameters) with linear interpolation and Table A9 (aggregate→ATAR mapping). Best 10 units, including 2 units of English. |
| **Honor Roll** | Browse Band 6 achievements across NSW schools. Filterable by year, subject, and school. De-duplicated course renaming handled transparently. |
| **Compare** | Multi-school, multi-year bar charts comparing Band 6 counts, state ranks, and school averages. Stacked by school, color-coded by subject category. |
| **Scaling Graphs** | Visualise how different subjects' scaled means compare across years. |

---

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Recharts](https://recharts.org) for data visualization
- [KaTeX](https://katex.org) for mathematical typesetting
- [next-intl](https://next-intl.dev) for i18n

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
.
├── src/
│   ├── app/[locale]/              # Next.js App Router pages
│   │   ├── compare/               # Compare: multi-school bar charts
│   │   ├── calculator/            # ATAR Calculator
│   │   ├── honor-roll/            # Honor Roll (Band 6 browser)
│   │   ├── insights/              # Insight articles (scaling explained)
│   │   └── scaling-graphs/        # Scaling visualisations
│   ├── lib/                       # Shared utilities
│   │   ├── course-aliases.ts      # Historical course rename mapping
│   │   ├── course-data.ts         # Course name normalization
│   │   └── scaling.ts             # ATAR calculation engine
│   └── data/                      # Bundled data (imported at build time)
│       ├── scaling-percentiles.json
│       ├── table_a3_all_years.json
│       ├── table_a3_2025.json
│       └── table_a9_2021_2025.json
│
├── public/
│   └── data/                      # Static data served to browser
│       ├── course-categories.json # Course code → name + category
│       ├── course-groups.json     # Canonical course groupings (handles renames)
│       ├── course-names.json      # Flat code → name map
│       ├── courses.json           # Aggregated course metadata
│       ├── schools.json           # Master school list
│       ├── school-stats.json      # Aggregated school statistics
│       ├── course-stats-{yyyy}.json  # Per-year course statistics
│       ├── courses-{yyyy}.json       # Per-year course listings
│       ├── school-detail-{yyyy}.json # Per-year school course data
│       ├── schools-{yyyy}.json       # Per-year school lists
│       ├── students-{yyyy}.json      # Per-year student entries
│       ├── sparo-schools.json     # SPaRO school averages (single year)
│       ├── sparo-yearly.json      # SPaRO school averages (all years)
│       └── years.json             # Available year index
│
├── data/                          # Raw data (NOT served to browser)
│   ├── csv/                       # Working copy of processed data
│   ├── backup-20260501/           # Snapshot of raw scraped data
│   └── sparo/                     # SPaRO data source files
│
├── scripts/                       # Data pipeline and build scripts
│   ├── fetch-archive.mjs          # Fetchers (NESA archive data)
│   ├── fetch-distinguished.mjs
│   ├── scrape-archive.mjs         # Scrapers (Playwright-based)
│   ├── scrape-band-performance.mjs
│   ├── scrape-distinguished-playwright.mjs
│   ├── scrape-stats.mjs
│   ├── preprocess-data.mjs        # Data pipeline (raw → public/data/)
│   ├── build-scaling-data.mjs     # Scaling data builder
│   ├── generate-course-stats.mjs  # Course statistics generator
│   ├── verify-data-integrity.py   # Integrity verification
│   └── test_atar.mjs              # Calculator tests
│
├── research/                      # Scaling research artifacts
│   ├── scaling-data/              # UAC scaling report PDFs + extracted data
│   ├── extract_scaling_data.py    # PDF → JSON extraction pipeline
│   └── scaling-report-2024-*.txt  # Text extraction from PDFs
│
├── docs/                          # Documentation
│   ├── DESIGN_GUIDE.md            # Design system reference
│   ├── HSC_ATAR_Statistical_Architecture.md  # Full statistical derivation
│   ├── course-aliases.md          # Course rename problem & solution
│   ├── data-collection-checklist.md  # Data inventory
│   └── recharts-tooltip-bug-postmortem.md   # Engineering postmortem
│
├── public/                        # Static assets (fonts, icons, images)
└── config files                   # package.json, tsconfig, next.config, etc.
```

---

## Data Architecture

There are three data layers, each serving a different purpose:

```
NESA/UAC Public Reports
        │
        ▼
   data/csv/          ← Raw scraped & processed data (555 MB, local only)
        │
        │  scripts/preprocess-data.mjs
        │  scripts/build-scaling-data.mjs
        │  scripts/generate-course-stats.mjs
        ▼
  public/data/        ← Static JSON served to the browser (211 MB)
        │              Loaded client-side for Compare, Honor Roll
        │
        │  Bundled at build time
        ▼
   src/data/          ← Imported by server components (small, key datasets)
                       Used by Calculator, Insights
```

### Course Renames

Many HSC courses have been renamed or re-coded over time (e.g., `Mathematics` → `Mathematics Advanced`, `General Mathematics 2` → `Mathematics Standard 2`). The system handles this at two levels:

- **`src/lib/course-aliases.ts`** — Canonical code → aliases + rename history. Used by Honor Roll pages to sum Band 6 counts across historical codes.
- **`public/data/course-groups.json`** — Groups legacy codes to canonical codes with year ranges. Used by data processing scripts.

---

## Data Sources

All data is sourced from publicly available reports:

- [NESA](https://www.nsw.gov.au/education-and-training/nesa) — HSC Distinguished Achievers, First in Course, Top Achievers, All Rounders
- [UAC](https://www.uac.edu.au) — Scaling reports (Tables A3, A9), ATAR calculation methodology
- [Board of Studies Archive](https://web.archive.org/web/*/boardofstudies.nsw.edu.au) — Historical data (2001-2016)

The raw scaling reports (PDFs + extracted JSON) are in `research/scaling-data/`.

---

## License

MIT — see [LICENSE](./LICENSE). The data in `public/data/` and `research/scaling-data/` is derived from public government reports and carries no additional copyright claim.
