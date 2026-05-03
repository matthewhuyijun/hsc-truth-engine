import tableA3AllYears from "@/data/table_a3_all_years.json";
import scalingPercentileData from "@/data/scaling-percentiles.json";
import type { HscScaledAnchor } from "./spline";

export interface CourseData {
  course: string;
  number: number;
  hsc_mean: number;
  hsc_sd: number;
  hsc_max: number;
  scaled_mean: number;
  scaled_sd: number;
  scaled_max: number;
}

export interface PercentileYearData {
  [year: string]: {
    table_a3: Array<{
      course: string;
      number: number;
      hsc: { mean: number; sd: number; max: number; p99: number; p90: number; p75: number; p50: number; p25: number };
      scaled: { mean: number; sd: number; max: number; p99: number; p90: number; p75: number; p50: number; p25: number };
    }>;
  };
}

const ALL_YEARS_DATA = tableA3AllYears as unknown as Record<string, { courses: CourseData[] }>;
export const PERCENTILE_DATA = scalingPercentileData as unknown as PercentileYearData;

const COURSE_NAME_ALIASES: Record<string, string> = {
  "English EAL/D": "English EALD",
  "Mathematics": "Mathematics Advanced",
  "Software Design & Development": "Software Engineering",
};

export function normalizeCourseName(name: string): string {
  return COURSE_NAME_ALIASES[name] || name;
}

export const PERCENTILE_KEYS = ["p25", "p50", "p75", "p90", "p99", "max"] as const;
export const PERCENTILE_LABELS: Record<string, number> = { p25: 25, p50: 50, p75: 75, p90: 90, p99: 99, max: 100 };

export function getAllCourses(): string[] {
  const names = new Set<string>();
  for (const yearData of Object.values(ALL_YEARS_DATA)) {
    for (const c of yearData.courses) {
      names.add(normalizeCourseName(c.course));
    }
  }
  return Array.from(names).sort();
}

export function getCourseData(courseName: string, year: string): CourseData | undefined {
  const normalized = normalizeCourseName(courseName);
  return ALL_YEARS_DATA[year]?.courses.find(
    (c) => normalizeCourseName(c.course) === normalized
  );
}

export function getPercentileAnchorsForYear(courseName: string, year: string): HscScaledAnchor[] | null {
  const normalized = normalizeCourseName(courseName);
  const course = PERCENTILE_DATA[year]?.table_a3.find(
    (c) => normalizeCourseName(c.course) === normalized
  );
  if (!course) return null;
  return [
    { hscHalf: 0, scaled: 0 },
    { hscHalf: course.hsc.p25, scaled: course.scaled.p25 },
    { hscHalf: course.hsc.p50, scaled: course.scaled.p50 },
    { hscHalf: course.hsc.p75, scaled: course.scaled.p75 },
    { hscHalf: course.hsc.p90, scaled: course.scaled.p90 },
    { hscHalf: course.hsc.p99, scaled: course.scaled.p99 },
    { hscHalf: course.hsc.max, scaled: course.scaled.max },
  ];
}
