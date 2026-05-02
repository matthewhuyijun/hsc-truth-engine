import tableA3AllYears from "@/data/table_a3_all_years.json";
import scalingPercentileData from "@/data/scaling-percentiles.json";
import tableA9 from "@/data/table_a9_2021_2025.json";

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

interface HscScaledAnchor {
  hscHalf: number;
  scaled: number;
}

interface AllYearsData {
  [year: string]: { courses: CourseData[] };
}

interface PercentileYearData {
  [year: string]: {
    table_a3: Array<{
      course: string;
      number: number;
      hsc: { mean: number; sd: number; max: number; p99: number; p90: number; p75: number; p50: number; p25: number };
      scaled: { mean: number; sd: number; max: number; p99: number; p90: number; p75: number; p50: number; p25: number };
    }>;
  };
}

const ALL_YEARS_DATA = tableA3AllYears as unknown as AllYearsData;
const PERCENTILE_DATA = scalingPercentileData as unknown as PercentileYearData;
const atarMapping = tableA9.data;

const COURSE_NAME_ALIASES: Record<string, string> = {
  "English EAL/D": "English EALD",
  "Mathematics": "Mathematics Advanced",
  "Software Design & Development": "Software Engineering",
};

function normalizeCourseName(name: string): string {
  return COURSE_NAME_ALIASES[name] || name;
}

export const AVAILABLE_YEARS = ["2025", "2024", "2023", "2022", "2021", "2020", "2019"] as const;
const MATH_EXT_1 = "Mathematics Extension 1";
const MATH_EXT_2 = "Mathematics Extension 2";
const MATH_ADVANCED = "Mathematics Advanced";
const ENGLISH_ADVANCED = "English Advanced";
const ENGLISH_EXT_1 = "English Extension 1";
const ENGLISH_EXT_2 = "English Extension 2";

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

function isEnglishCourse(courseName: string): boolean {
  return /english/i.test(courseName);
}

export function resolveUnits(courseName: string, allInputs: { course: string; hscMark: number }[]): number {
  if (courseName === MATH_EXT_1) {
    const hasExt2 = allInputs.some(
      (inp) => inp.course === MATH_EXT_2 && inp.hscMark > 0
    );
    return hasExt2 ? 2 : 1;
  }

  if (courseName === MATH_EXT_2) return 2;

  if (/extension/i.test(courseName)) return 1;
  return 2;
}

export function shouldExcludeCourse(courseName: string, allInputs: { course: string; hscMark: number }[]): boolean {
  if (courseName === MATH_ADVANCED) {
    const hasExt1 = allInputs.some(
      (inp) => inp.course === MATH_EXT_1 && inp.hscMark > 0
    );
    const hasExt2 = allInputs.some(
      (inp) => inp.course === MATH_EXT_2 && inp.hscMark > 0
    );
    if (hasExt1 && hasExt2) return true;
  }
  return false;
}

export function checkEnglishPrerequisite(inputs: { course: string; hscMark: number }[]): string | null {
  const hasExt2 = inputs.some((inp) => inp.course === ENGLISH_EXT_2 && inp.hscMark > 0);
  const hasExt1 = inputs.some((inp) => inp.course === ENGLISH_EXT_1 && inp.hscMark > 0);
  const hasAdv = inputs.some((inp) => inp.course === ENGLISH_ADVANCED && inp.hscMark > 0);

  if (hasExt2 && !hasExt1) return "English Extension 2 requires English Extension 1.";
  if (hasExt1 && !hasAdv) return "English Extension 1 requires English Advanced.";
  return null;
}

function getPercentileAnchors(courseName: string, year: string): HscScaledAnchor[] | null {
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

function buildMonotoneSpline(anchors: HscScaledAnchor[]): (hscHalf: number) => number {
  const n = anchors.length;
  const xs = anchors.map((a) => a.hscHalf);
  const ys = anchors.map((a) => a.scaled);

  const delta = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    delta[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  }

  const m = new Array(n);
  for (let i = 1; i < n - 1; i++) {
    if (delta[i - 1] * delta[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * delta[i] + delta[i - 1];
      const w2 = delta[i] + 2 * delta[i - 1];
      m[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i]);
    }
  }
  m[0] = delta[0];
  m[n - 1] = delta[n - 2];

  return (hscHalf: number) => {
    if (hscHalf <= xs[0]) return ys[0];
    for (let i = 0; i < n - 1; i++) {
      if (hscHalf >= xs[i] && hscHalf <= xs[i + 1]) {
        const h = xs[i + 1] - xs[i];
        const t = (hscHalf - xs[i]) / h;
        const t2 = t * t;
        const t3 = t2 * t;
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;
        return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
      }
    }
    return ys[n - 1];
  };
}

function calculateScaledMarkForYear(courseName: string, year: string, hscMark: number): number {
  if (hscMark <= 0) return 0;

  const anchors = getPercentileAnchors(courseName, year);
  if (anchors) {
    const spline = buildMonotoneSpline(anchors);
    return Math.round(spline(hscMark / 2) * 10) / 10;
  }

  // fallback: z-score using flat course data
  const course = getCourseData(courseName, year);
  if (!course || course.hsc_sd === 0) return 0;
  const hscMark50 = hscMark / 2;
  const cappedHsc = Math.min(hscMark50, course.hsc_max ?? 50);
  const z = (cappedHsc - course.hsc_mean) / course.hsc_sd;
  let scaled = course.scaled_mean + z * course.scaled_sd;
  scaled = Math.max(0, Math.min(scaled, course.scaled_max ?? 50));
  return Math.round(scaled * 10) / 10;
}

function aggregateToAtarForYear(aggregate: number, year: string): number {
  const points: { atar: number; agg: number }[] = [];
  for (const [atarStr, yearData] of Object.entries(atarMapping)) {
    const agg = (yearData as Record<string, number>)[year];
    if (agg !== undefined) points.push({ atar: parseFloat(atarStr), agg });
  }
  if (points.length === 0) return -1;
  points.sort((a, b) => b.atar - a.atar);
  if (aggregate >= points[0].agg) return 99.95;
  if (aggregate <= points[points.length - 1].agg) return 0;
  for (let i = 0; i < points.length - 1; i++) {
    const higher = points[i];
    const lower = points[i + 1];
    if (aggregate <= higher.agg && aggregate >= lower.agg) {
      const ratio = (aggregate - lower.agg) / (higher.agg - lower.agg);
      const preciseAtar = lower.atar + ratio * (higher.atar - lower.atar);
      return Math.round(preciseAtar * 20) / 20;
    }
  }
  return 0;
}

export interface CourseInput {
  course: string;
  hscMark: number;
}

export interface CourseYearScaled {
  year: string;
  scaledMark: number;
  courseExists: boolean;
}

export interface CourseResult {
  course: string;
  units: number;
  hscMark: number;
  perYearScaled: CourseYearScaled[];
  unitsCounted: number;
  excluded: boolean;
}

export interface YearResult {
  year: string;
  aggregate: number;
  atar: number;
}

export interface CalculatorResult {
  courses: CourseResult[];
  totalUnits: number;
  aggregate: number;
  atar: number;
  atarRange: { min: number; max: number };
  yearResults: YearResult[];
  warnings: string[];
}

export function calculateAtar(inputs: CourseInput[]): CalculatorResult {
  const warnings: string[] = [];

  const activeInputs = inputs.filter((inp) => inp.course !== "" && inp.hscMark > 0);
  if (activeInputs.length === 0) {
    return {
      courses: [], totalUnits: 0, aggregate: 0, atar: 0,
      atarRange: { min: 0, max: 0 }, yearResults: [], warnings: [],
    };
  }

  const engPrereq = checkEnglishPrerequisite(activeInputs);
  if (engPrereq) warnings.push(engPrereq);

  const courseResults: CourseResult[] = activeInputs.map((inp) => {
    const units = resolveUnits(inp.course, activeInputs);
    const excluded = shouldExcludeCourse(inp.course, activeInputs);

    const existingScaledMarks: number[] = [];
    const perYearScaled: CourseYearScaled[] = [];

    AVAILABLE_YEARS.forEach((year) => {
      const cd = getCourseData(inp.course, year);
      if (cd) {
        const sm = calculateScaledMarkForYear(inp.course, year, inp.hscMark);
        existingScaledMarks.push(sm);
        perYearScaled.push({ year, scaledMark: sm, courseExists: true });
      }
    });

    const avgScaled = existingScaledMarks.length > 0
      ? existingScaledMarks.reduce((a, b) => a + b, 0) / existingScaledMarks.length
      : 0;

    AVAILABLE_YEARS.forEach((year) => {
      if (!perYearScaled.some((ys) => ys.year === year) && existingScaledMarks.length > 0) {
        perYearScaled.push({ year, scaledMark: Math.round(avgScaled * 10) / 10, courseExists: false });
      }
    });

    perYearScaled.sort((a, b) => b.year.localeCompare(a.year));

    return { course: inp.course, units, hscMark: inp.hscMark, perYearScaled, unitsCounted: 0, excluded };
  });

  if (courseResults.some((cr) => cr.excluded)) {
    warnings.push("Mathematics Advanced excluded: Extension 1 and Extension 2 take priority (max 4 calc units).");
  }

  interface UnitEntry {
    course: string;
    perUnit: number;
    isEnglish: boolean;
    sourceIndex: number;
  }

  function selectBestTen(year: string): { entries: UnitEntry[]; aggregate: number } {
    const unitEntries: UnitEntry[] = [];
    courseResults.forEach((cr, idx) => {
      if (cr.excluded) return;
      const yd = cr.perYearScaled.find((ys) => ys.year === year);
      const sm = yd?.scaledMark ?? 0;
      for (let u = 0; u < cr.units; u++) {
        unitEntries.push({ course: cr.course, perUnit: sm, isEnglish: isEnglishCourse(cr.course), sourceIndex: idx });
      }
    });

    const engUnits = unitEntries.filter((u) => u.isEnglish).sort((a, b) => b.perUnit - a.perUnit);
    const nonEng = unitEntries.filter((u) => !u.isEnglish).sort((a, b) => b.perUnit - a.perUnit);

    const bestTen: UnitEntry[] = [];
    bestTen.push(...engUnits.slice(0, 2));
    let remaining = 10 - bestTen.length;

    const calcCourses = [MATH_ADVANCED, MATH_EXT_1, MATH_EXT_2];
    let calcUnitsUsed = 0;

    const picked: UnitEntry[] = [];
    for (const u of nonEng) {
      if (remaining <= 0) break;
      if (calcCourses.includes(u.course)) {
        if (calcUnitsUsed < 4) {
          picked.push(u);
          calcUnitsUsed++;
          remaining--;
        }
      } else {
        picked.push(u);
        remaining--;
      }
    }

    bestTen.push(...picked);

    // backfill any remaining slots, respecting the 4-unit calc cap
    if (bestTen.length < 10 && nonEng.length > picked.length) {
      for (const u of nonEng) {
        if (bestTen.length >= 10) break;
        if (picked.includes(u)) continue;
        if (calcCourses.includes(u.course) && calcUnitsUsed >= 4) continue;
        bestTen.push(u);
        if (calcCourses.includes(u.course)) calcUnitsUsed++;
      }
    }

    if (bestTen.length < 10 && engUnits.length > Math.min(2, engUnits.length)) {
      bestTen.push(...engUnits.slice(Math.min(2, engUnits.length), Math.min(2, engUnits.length) + (10 - bestTen.length)));
    }

    const used = bestTen.slice(0, 10);
    const agg = Math.round(used.reduce((sum, u) => sum + u.perUnit, 0) * 100) / 100;
    return { entries: used, aggregate: agg };
  }

  const year2025 = selectBestTen("2025");
  const clampedAggregate = Math.min(year2025.aggregate, 500);

  const unitCountByCourse = new Map<string, number>();
  for (const u of year2025.entries) {
    unitCountByCourse.set(u.course, (unitCountByCourse.get(u.course) || 0) + 1);
  }

  const coursesWithCount = courseResults.map((cr) => ({
    ...cr,
    unitsCounted: unitCountByCourse.get(cr.course) || 0,
  }));

  const totalUnits = coursesWithCount
    .filter((c) => !c.excluded)
    .reduce((sum, c) => sum + c.units, 0);

  if (totalUnits < 10) {
    warnings.push("You need at least 10 units to be eligible for an ATAR.");
  }

  const hasEnglish = coursesWithCount.some((cr) => isEnglishCourse(cr.course) && !cr.excluded);
  if (!hasEnglish) {
    warnings.push("You need at least 2 units of English to be eligible for an ATAR.");
  }

  const yearResults: YearResult[] = AVAILABLE_YEARS.map((year) => {
    const { aggregate } = selectBestTen(year);
    const atar = aggregate > 0 ? aggregateToAtarForYear(Math.min(aggregate, 500), year) : 0;
    return { year, aggregate, atar };
  });

  const primaryAtar = aggregateToAtarForYear(clampedAggregate, "2025");
  const allAtars = yearResults.map((yr) => yr.atar).filter((a) => a > 0);
  const atarRange = {
    min: allAtars.length > 0 ? Math.min(...allAtars) : 0,
    max: allAtars.length > 0 ? Math.max(...allAtars) : 0,
  };

  return { courses: coursesWithCount, totalUnits, aggregate: clampedAggregate, atar: primaryAtar, atarRange, yearResults, warnings };
}
