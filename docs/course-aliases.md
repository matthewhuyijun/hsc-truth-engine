# Course Number Aliasing

## Problem

NESA changes course numbers and names over time due to syllabus reforms. Querying by a single course number misses historical data from before the rename.

**Example**: Course `15155` (English EAL/D) had Band 6 achievers in 2019-2025, but before 2019 the same students studied `15150` (English as a Second Language). A page for course `15155` must pool data from both codes.

## How HSC Ninja Handles It

HSC Ninja uses the **current course number** as the canonical ID and:
1. Merges data from all historical course numbers into one view
2. Shows a rename banner: "English as a Second Language (2001–2018) → English EAL/D (2019–present)"
3. Queries don't care what the course was called in a given year

## Complete Transition Map

Based on analysis of all datasets (2001-2025).

### Syllabus Reform 2019 (English/Math)

| Canonical | Aliases | Canonical Name | Old Name(s) | Active |
|-----------|---------|----------------|-------------|--------|
| `15155` | `15150`, `15150` | English EAL/D | English as a Second Language (2u) | 2019+ |
| `15232` | `15235`, `15230` | Mathematics Standard 1 | Mathematics General 2, General Mathematics | 2019+ |
| `15236` | `15240`*, `15235`* | Mathematics Standard 2 | Mathematics General 2 | 2019+ |
| `15255` | `15240` | Mathematics Advanced | Mathematics 2 unit | 2020+ |

> \* `15235` (Mathematics General 2) split into two: `15232` (Standard 1) and `15236` (Standard 2). Data from `15235` should be attributed to `15236` (Standard 2) by default since Standard 1 is a non-ATAR course with minimal Band 6 students.

### Retired Courses

| Old Code | Name | Last Year | Successor |
|----------|------|-----------|-----------|
| `15340` | Senior Science | 2018 | `15345` Science Extension (different scope) |
| `15767` | Indonesian in Context | 2018 | absorbed into Continuers/Extension |
| `15845` | Japanese and Literature | 2018 | absorbed into Continuers/Extension |
| `16130` | Ukrainian Continuers | 2018 | discontinued |
| `16010` | Persian Background Speakers | 2018 | `16015` Persian Continuers (different scope) |

### VET Framework Changes

| Canonical | Aliases | Name | Notes |
|-----------|---------|------|-------|
| `26098` | `26079`, `26099` | Automotive Examination | Code changed in 2022 |
| `27398` | `27299` | Information and Digital Technology Examination | Code changed in 2023 |
| `26599` | — | Hospitality Examination | Retired ~2011 |

### New Courses (Post-2019)

| Code | Name | First Year |
|------|------|------------|
| `15126` | English Studies Examination | 2024 |
| `15175` | Enterprise Computing | 2025 |
| `15345` | Science Extension | 2019 |
| `15365` | Software Engineering | 2025 |
| `15215` | Investigating Science | 2019 |

### Background Speakers → In Context (pre-2019)

Before 2019, some language courses were called "Background Speakers". Around 2017-2018 these were renamed to "in Context" while keeping the same course code:

| Code | Old Name | New Name |
|------|----------|----------|
| `15767` | Indonesian Background Speakers | Indonesian in Context |
| `15840`/`15845` | Japanese Background Speakers | Japanese in Context |

## Implementation Plan

### 1. Static Mapping in `src/lib/course-aliases.ts`

```ts
export interface CourseAlias {
  canonical: string;       // current course number
  canonicalName: string;   // current display name
  aliases: string[];       // historical course numbers
  renameHistory: {         // for display banner
    name: string;
    years: string;         // e.g. "2001–2018"
  }[];
}

export const COURSE_ALIASES: Record<string, CourseAlias> = {
  "15155": {
    canonical: "15155",
    canonicalName: "English EAL/D",
    aliases: ["15150"],
    renameHistory: [
      { name: "English as a Second Language", years: "2001–2018" },
      { name: "English EAL/D", years: "2019–present" },
    ],
  },
  "15236": {
    canonical: "15236",
    canonicalName: "Mathematics Standard 2",
    aliases: ["15235", "15230"],
    renameHistory: [
      { name: "General Mathematics", years: "2001–2010" },
      { name: "Mathematics General 2", years: "2011–2018" },
      { name: "Mathematics Standard 2", years: "2019–present" },
    ],
  },
  "15255": {
    canonical: "15255",
    canonicalName: "Mathematics Advanced",
    aliases: ["15240"],
    renameHistory: [
      { name: "Mathematics 2 unit", years: "2001–2019" },
      { name: "Mathematics Advanced", years: "2020–present" },
    ],
  },
  // ... etc
};
```

### 2. Data Loading with Alias Resolution

When loading data for a canonical course number:
1. Find the alias map entry
2. Load data for `canonical + all aliases`
3. Pool all records together
4. Tag each record with the actual course number it came from for filtering

```ts
export function resolveCourseNumbers(courseCode: string): string[] {
  const entry = COURSE_ALIASES[courseCode];
  return entry ? [entry.canonical, ...entry.aliases] : [courseCode];
}
```

### 3. Display Banner on Course Detail Page

When a course has `renameHistory` with more than 1 entry:

```
This course has been renamed over the years:
- General Mathematics (2001–2010)
- Mathematics General 2 (2011–2018)  
- Mathematics Standard 2 (2019–present)
```

### 4. Year Filter Scoping

When filtering by year, resolve which course number was active:
```ts
export function getActiveCode(canonical: string, year: number): string {
  const entry = COURSE_ALIASES[canonical];
  if (!entry) return canonical;
  // Find which alias was active in the given year
  // based on renameHistory date ranges
  for (const alias of [canonical, ...entry.aliases]) {
    if (wasActiveInYear(alias, year)) return alias;
  }
  return canonical;
}
```

### 5. When to Update This Map

- **Every year** when new HSC data is released (December)
- Check the NESA merit lists for new course numbers
- Compare `first-in-course` course list with previous year
- Any course number appearing for the first time is a candidate for entry or rename

### 6. Verification Script

```bash
node scripts/verify-course-aliases.mjs
# Outputs:
# - New course numbers not in the alias map
# - Course numbers that disappeared
# - Potential renames (similar names, different numbers)
```

## Key Decision: `15235` → `15232` vs `15236`

Mathematics General 2 (`15235`, 2017-2018) split into two courses in 2019:
- `15232` Mathematics Standard 1 (non-ATAR, very few Band 6)
- `15236` Mathematics Standard 2 (ATAR course)

**Decision**: Map `15235` → `15236` (Standard 2) because:
1. Standard 1 is not ATAR-eligible in the same way
2. `15236` has the bulk of Band 6 data
3. This matches HSC Ninja's approach
