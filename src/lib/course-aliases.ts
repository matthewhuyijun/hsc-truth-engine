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
  "15155": {
    canonical: "15155",
    canonicalName: "English EAL/D",
    aliases: ["15150"],
    renameHistory: [
      { name: "English as a Second Language", years: "2001–2018" },
      { name: "English EAL/D", years: "2019–present" },
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
  "15232": {
    canonical: "15232",
    canonicalName: "Mathematics Standard 1 Examination",
    aliases: ["15235", "15230"],
    renameHistory: [
      { name: "General Mathematics", years: "2001–2010" },
      { name: "Mathematics General 2", years: "2011–2018" },
      { name: "Mathematics Standard 1", years: "2019–present" },
    ],
  },
  "26098": {
    canonical: "26098",
    canonicalName: "Automotive Examination",
    aliases: ["26079", "26099"],
    renameHistory: [
      { name: "Automotive Examination (various codes)", years: "2001–present" },
    ],
  },
  "27398": {
    canonical: "27398",
    canonicalName: "Information and Digital Technology Examination",
    aliases: ["27299"],
    renameHistory: [
      { name: "Information and Digital Technology (various codes)", years: "2001–present" },
    ],
  },
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
};

export function resolveCourseNumbers(courseCode: string): string[] {
  const entry = COURSE_ALIASES[courseCode];
  if (!entry) return [courseCode];
  return [entry.canonical, ...entry.aliases];
}

export function getRenameHistory(courseCode: string): { name: string; years: string }[] | null {
  const entry = COURSE_ALIASES[courseCode];
  if (!entry || entry.renameHistory.length <= 1) return null;
  return entry.renameHistory;
}
