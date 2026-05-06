export interface CourseAlias {
  canonical: string;
  canonicalName: string;
  aliases: string[];
  renameHistory: {
    name: string;
    years: string;
  }[];
}

export const COURSE_ALIASES: Record<string, CourseAlias> = {
  // ── English ──────────────────────────────────────────────────────────────
  "15155": {
    canonical: "15155",
    canonicalName: "English EAL/D",
    aliases: ["15150"],
    renameHistory: [
      { name: "English as a Second Language", years: "2001–2018" },
      { name: "English EAL/D", years: "2019–present" },
    ],
  },

  // ── Mathematics ──────────────────────────────────────────────────────────
  "15255": {
    canonical: "15255",
    canonicalName: "Mathematics Advanced",
    aliases: ["15240"],
    renameHistory: [
      { name: "Mathematics", years: "2001–2019" },
      { name: "Mathematics Advanced", years: "2020–present" },
    ],
  },
  "15236": {
    canonical: "15236",
    canonicalName: "Mathematics Standard 2",
    aliases: ["15235", "15230"],
    renameHistory: [
      { name: "General Mathematics", years: "2001–2013" },
      { name: "Mathematics General 2", years: "2014–2018" },
      { name: "Mathematics Standard 2", years: "2019–present" },
    ],
  },

  // ── Software ─────────────────────────────────────────────────────────────
  "15365": {
    canonical: "15365",
    canonicalName: "Software Engineering",
    aliases: ["15360"],
    renameHistory: [
      { name: "Software Design and Development", years: "2001–2024" },
      { name: "Software Engineering", years: "2025–present" },
    ],
  },

  // ── Languages: Background/Heritage → in Context + Literature ─────────────
  "15557": {
    canonical: "15557",
    canonicalName: "Chinese in Context",
    aliases: ["15560", "15555"],
    renameHistory: [
      { name: "Chinese Background Speakers / Heritage", years: "2001–2016" },
      { name: "Chinese in Context", years: "2017–present" },
    ],
  },
  "15565": {
    canonical: "15565",
    canonicalName: "Chinese and Literature",
    aliases: ["15560", "15555"],
    renameHistory: [
      { name: "Chinese Background Speakers / Heritage", years: "2001–2016" },
      { name: "Chinese and Literature", years: "2017–present" },
    ],
  },
  "15837": {
    canonical: "15837",
    canonicalName: "Japanese in Context",
    aliases: ["15840", "15835"],
    renameHistory: [
      { name: "Japanese Background Speakers / Heritage", years: "2001–2016" },
      { name: "Japanese in Context", years: "2017–present" },
    ],
  },
  "15845": {
    canonical: "15845",
    canonicalName: "Japanese and Literature",
    aliases: ["15840", "15835"],
    renameHistory: [
      { name: "Japanese Background Speakers / Heritage", years: "2001–2016" },
      { name: "Japanese and Literature", years: "2017–2021" },
    ],
  },
  "15887": {
    canonical: "15887",
    canonicalName: "Korean in Context",
    aliases: ["15890", "15885"],
    renameHistory: [
      { name: "Korean Background Speakers / Heritage", years: "2001–2016" },
      { name: "Korean in Context", years: "2017–present" },
    ],
  },
  "15895": {
    canonical: "15895",
    canonicalName: "Korean and Literature",
    aliases: ["15890", "15885"],
    renameHistory: [
      { name: "Korean Background Speakers / Heritage", years: "2001–2016" },
      { name: "Korean and Literature", years: "2017–present" },
    ],
  },
  "15767": {
    canonical: "15767",
    canonicalName: "Indonesian in Context",
    aliases: ["15770", "15765"],
    renameHistory: [
      { name: "Indonesian Background Speakers / Heritage", years: "2001–2016" },
      { name: "Indonesian in Context", years: "2017–2019" },
    ],
  },
  "15775": {
    canonical: "15775",
    canonicalName: "Indonesian and Literature",
    aliases: ["15770", "15765"],
    renameHistory: [
      { name: "Indonesian Background Speakers / Heritage", years: "2001–2016" },
      { name: "Indonesian and Literature", years: "2017–2024" },
    ],
  },
  "16015": {
    canonical: "16015",
    canonicalName: "Persian Continuers",
    aliases: ["16010"],
    renameHistory: [
      { name: "Persian Background Speakers", years: "2001–2018" },
      { name: "Persian Continuers", years: "2019–present" },
    ],
  },
  "16045": {
    canonical: "16045",
    canonicalName: "Russian Continuers",
    aliases: ["16040"],
    renameHistory: [
      { name: "Russian Background Speakers", years: "2001–2014" },
      { name: "Russian Continuers", years: "2015–present" },
    ],
  },

  // ── VET: same exam, NESA renumbered ──────────────────────────────────────
  "26299": {
    canonical: "26299",
    canonicalName: "Construction Examination",
    aliases: ["16305"],
    renameHistory: [
      { name: "Construction Examination", years: "2003–present" },
    ],
  },
  "26199": {
    canonical: "26199",
    canonicalName: "Business Services Examination",
    aliases: ["16745"],
    renameHistory: [
      { name: "Business Services Examination", years: "2003–present" },
    ],
  },
  "26499": {
    canonical: "26499",
    canonicalName: "Entertainment Industry Examination",
    aliases: ["16945"],
    renameHistory: [
      { name: "Entertainment Industry Examination", years: "2006–present" },
    ],
  },
  "26899": {
    canonical: "26899",
    canonicalName: "Primary Industries Examination",
    aliases: ["17195", "16485"],
    renameHistory: [
      { name: "Primary Industries Examination", years: "2001–present" },
    ],
  },
  "26999": {
    canonical: "26999",
    canonicalName: "Retail Services Examination",
    aliases: ["16995", "16515"],
    renameHistory: [
      { name: "Retail Operations / Services Examination", years: "2003–present" },
    ],
  },
  "26098": {
    canonical: "26098",
    canonicalName: "Automotive Examination",
    aliases: ["26079", "26099"],
    renameHistory: [
      { name: "Automotive Examination", years: "2009–present" },
    ],
  },
  "26579": {
    canonical: "26579",
    canonicalName: "Hospitality Examination",
    aliases: ["26599", "16845", "16665", "16565"],
    renameHistory: [
      { name: "Hospitality Examination", years: "2001–present" },
    ],
  },
  "27499": {
    canonical: "27499",
    canonicalName: "Tourism, Travel and Events Examination",
    aliases: ["27099", "16935", "16695"],
    renameHistory: [
      { name: "Tourism / Tourism, Travel and Events Examination", years: "2004–present" },
    ],
  },
  "27398": {
    canonical: "27398",
    canonicalName: "Information and Digital Technology Examination",
    aliases: ["27379", "27399", "26699", "18095", "16365"],
    renameHistory: [
      { name: "Information Technology Examination", years: "2001–2014" },
      { name: "Information and Digital Technology Examination", years: "2014–present" },
    ],
  },

  // ── New science courses (2019) ───────────────────────────────────────────
  "15345": {
    canonical: "15345",
    canonicalName: "Science Extension",
    aliases: [],
    renameHistory: [
      { name: "Science Extension", years: "2019–present" },
    ],
  },
  "15215": {
    canonical: "15215",
    canonicalName: "Investigating Science",
    aliases: [],
    renameHistory: [
      { name: "Investigating Science", years: "2019–present" },
    ],
  },
  "15175": {
    canonical: "15175",
    canonicalName: "Enterprise Computing",
    aliases: [],
    renameHistory: [
      { name: "Enterprise Computing", years: "2025–present" },
    ],
  },
};

export function resolveCourseNumbers(courseCode: string): string[] {
  const entry = COURSE_ALIASES[courseCode];
  if (!entry) return [courseCode];
  return [entry.canonical, ...entry.aliases];
}

export function getRenameHistory(courseCode: string): { name: string; years: string }[] | null {
  // Direct lookup
  const entry = COURSE_ALIASES[courseCode];
  if (entry && entry.renameHistory.length > 1) return entry.renameHistory;
  // Reverse lookup: is this a legacy code that maps to a canonical?
  for (const [, alias] of Object.entries(COURSE_ALIASES)) {
    if (alias.aliases.includes(courseCode)) {
      return alias.renameHistory;
    }
  }
  return null;
}

/**
 * Given a course code (canonical or alias) and a year, returns the code
 * that was used in school-detail-{year}.json for that year.
 *
 * When a course was renamed (e.g. 15150→15155), school-detail files use the
 * historical code for pre-rename years. This function mirrors HSCninja's URL
 * redirect behaviour: /course/15155/year/2010 → redirects to /course/15150/year/2010.
 *
 * Handles both directions:
 *  - canonical code + old year → redirect to historical alias
 *  - historical alias + new year → redirect to canonical
 */
export function getCodeForYear(courseCode: string, year: string): string {
  // Check if this is a canonical entry (entries are keyed by canonical code)
  const canonicalEntry = COURSE_ALIASES[courseCode];

  if (canonicalEntry && canonicalEntry.renameHistory.length > 1) {
    // It's a canonical code — check if the year maps to a historical alias
    for (const segment of canonicalEntry.renameHistory) {
      const match = segment.years.match(/^(\d{4})–(.+)$/);
      if (!match) continue;
      const segStart = parseInt(match[1], 10);
      const endStr = match[2];
      const segEnd = endStr === "present" ? 9999 : parseInt(endStr, 10);
      const yearNum = parseInt(year, 10);
      if (yearNum >= segStart && yearNum <= segEnd) {
        const idx = canonicalEntry.renameHistory.indexOf(segment);
        if (idx === canonicalEntry.renameHistory.length - 1) {
          return canonicalEntry.canonical; // current name
        } else {
          return canonicalEntry.aliases[idx] ?? courseCode; // historical alias
        }
      }
    }
  }

  // Not a canonical with rename history — check if it's an alias pointing to a canonical
  for (const [canonical, entry] of Object.entries(COURSE_ALIASES)) {
    const aliasIndex = entry.aliases.indexOf(courseCode);
    if (aliasIndex === -1) continue;

    // Found this code as an alias of `canonical`
    const historyEntry = entry.renameHistory[aliasIndex];
    if (!historyEntry) continue;

    const match = historyEntry.years.match(/^(\d{4})–(.+)$/);
    if (!match) break;
    const segStart = parseInt(match[1], 10);
    const endStr = match[2];
    const segEnd = endStr === "present" ? 9999 : parseInt(endStr, 10);
    const yearNum = parseInt(year, 10);

    if (yearNum >= segStart && yearNum <= segEnd) {
      // Year is within the alias's active period — use the alias
      return courseCode;
    } else if (yearNum > segEnd) {
      // Year is after the alias's active period — course was renamed, use canonical
      return canonical;
    }
  }

  // No rename history found — return as-is
  return courseCode;
}
