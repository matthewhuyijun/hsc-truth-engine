# HSC Truth Engine

**hscdata.org** — Transparent HSC data. No myths. Just mathematics.

## What is this?

The HSC Truth Engine is an open-source platform that explains how the NSW HSC and ATAR actually work. Three modules:

| Module | Description |
|--------|-------------|
| **Insights** | Deep-dive articles explaining scaling, moderation, and the mathematics behind HSC results |
| **Calculator** | Estimate your ATAR from expected marks using UAC scaling data |
| **Honor Roll** | Browse Band 6 achievements across NSW schools — filterable by year and subject |

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Recharts](https://recharts.org) for data visualization
- [KaTeX](https://katex.org) for mathematical typesetting

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Sources

All scaling data sourced from publicly available [NESA](https://www.nsw.gov.au/education-and-training/nesa) and [UAC](https://www.uac.edu.au) reports. The raw data and extraction scripts are in `research/` and `scripts/`.

## License

MIT — see [LICENSE](./LICENSE) for details. The data (`public/scaling-data.json`, `research/scaling-data/*.json`) is derived from public government reports and carries no additional copyright claim.
