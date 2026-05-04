# Recharts Stacked Bar Tooltip Bug — Post-mortem

**Date:** 2026-05-04  
**File:** `src/app/[locale]/compare/page.tsx:434`  
**Severity:** Medium (silent data misrepresentation, no crash)

---

## Symptom

On the Compare page, hovering bars for courses that changed names across years (e.g., `Mathematics` → `Mathematics Advanced`, `General Mathematics 2` → `Mathematics Standard 2`) produced an empty tooltip — a black rectangle with no text.

Other courses worked fine.

## Root Cause

Recharts v3.8 internally skips rendering `<rect>` elements for data points where `value === 0` in stacked `Bar` components. This is a DOM optimisation, not a user-facing feature.

However, with `shared={false}` tooltips, recharts determines which data row to show by mapping the **DOM index** of the hovered rect back to `data[idx]`. When some rects are missing, the indices no longer align with the data array:

```
Actual data array:  [2025=v0, 2024=v0, 2023=v0, 2022=v0, 2021=v0, 2020=v0, 2019=v32, 2018=v39, 2017=v40, 2016=v14]
Rendered DOM rects: [rect0,                                                rect0,    rect1,    rect2,    rect3   ]
                      ↕                                                  ↕         ↕         ↕         ↕
recharts maps:      data[0]=2025=v0                                     data[1]=2024=v0  data[2]=2023=v0  data[3]=2022=v0
```

The visible 2019 bar (rect at DOM index 0) gets mapped to `data[0]` → year 2025 → value 0. Every rect maps to a year where the course hadn't been introduced yet or was already retired.

Payload arrives as `{ value: 0, label: undefined }` → `sorted` filtered to empty → tooltip renders with no content.

## Why This Hit Renamed Courses Specifically

Any course that doesn't span the full selected year range is affected. Courses that changed codes/names (Mathematics, General Mathematics, Software Design, etc.) are exactly this case — they appear in one part of the range and are zero elsewhere. A constantly-offered course like English Advanced has non-zero values across all years, so every DOM index happens to land on a year with data (all values > 0).

## Fix

```diff
-<Bar key={key} dataKey={key} stackId={school} fill={colorMap.get(code) || '#888'} />
+<Bar key={key} dataKey={key} stackId={school} fill={colorMap.get(code) || '#888'} minPointSize={0.0001} />
```

`minPointSize={0.0001}` forces recharts to render a `<rect>` for every single data point, including zero-value ones. The zero rects have negligible height (0.0001px) and are invisible, but they exist in the DOM — keeping DOM index aligned with data index.

## Prevention

For **any future recharts `Bar` or stacked `BarChart` with `shared={false}` tooltips**, add `minPointSize`:

| Scenario | Safe? | Action |
|---|---|---|
| All courses span full year range | Safe | `minPointSize` optional |
| **Any** course has gaps (renames, discontinued, new) | **Bug** | **Always add `minPointSize={0.0001}`** |

Since the Compare page inherently surfaces courses that were renamed or discontinued, this flag should be considered **mandatory** for the stacked bars here.

## Verification

Checked via browser automation — all 37+ course bars at James Ruse (including Mathematics 15240, General Mathematics 2 15235, Software Design 15360) now show correct names and values on hover. Zero empty tooltips.
