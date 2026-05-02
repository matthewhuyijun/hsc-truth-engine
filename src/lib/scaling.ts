import tableA3AllYears from "@/data/table_a3_all_years.json";
import scalingPercentileData from "@/data/scaling-percentiles.json";

export interface ScalingParams {
  hsc_mean: number;
  hsc_sd: number;
  scaled_mean: number;
  scaled_sd: number;
  scaled_max: number;
}

export interface CurvePoint {
  x: number;
  scaled: number;
}

export interface CourseCurve {
  course: string;
  points: CurvePoint[];
}

interface HscScaledAnchor {
  hscHalf: number;
  scaled: number;
}

interface AllYearsData {
  [year: string]: { courses: Array<{
    course: string;
    number: number;
    hsc_mean: number;
    hsc_sd: number;
    hsc_max: number;
    scaled_mean: number;
    scaled_sd: number;
    scaled_max: number;
  }> };
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

const ALL_YEARS = tableA3AllYears as unknown as AllYearsData;
const PERCENTILE_DATA = scalingPercentileData as unknown as PercentileYearData;

const COURSE_NAME_ALIASES: Record<string, string> = {
  "English EAL/D": "English EALD",
  "Mathematics": "Mathematics Advanced",
  "Software Design & Development": "Software Engineering",
};

function normalizeCourseName(name: string): string {
  return COURSE_NAME_ALIASES[name] || name;
}

const LAST_YEAR = "2025";
const AVG_YEARS = ["2021", "2022", "2023", "2024", "2025"];

export const YEAR_MODES = [
  { value: "last", label: "2025" },
  { value: "avg5", label: "5-Year Avg" },
] as const;

export const GRAPH_MODES = [
  { value: "hsc", label: "HSC → Scaled" },
  { value: "percentile", label: "% → Scaled" },
] as const;

export type YearMode = "last" | "avg5";
export type GraphMode = "hsc" | "percentile";

const PERCENTILE_KEYS = ["p25", "p50", "p75", "p90", "p99"] as const;
const PERCENTILE_LABELS: Record<string, number> = { p25: 25, p50: 50, p75: 75, p90: 90, p99: 99 };

export function getAllScalingCourses(): string[] {
  const names = new Set<string>();
  for (const yearData of Object.values(ALL_YEARS)) {
    for (const c of yearData.courses) {
      names.add(normalizeCourseName(c.course));
    }
  }
  return Array.from(names).sort();
}

function getParamsForYear(courseName: string, year: string): ScalingParams | null {
  const normalized = normalizeCourseName(courseName);
  const course = ALL_YEARS[year]?.courses.find(
    (c) => normalizeCourseName(c.course) === normalized
  );
  if (!course) return null;
  return {
    hsc_mean: course.hsc_mean,
    hsc_sd: course.hsc_sd,
    scaled_mean: course.scaled_mean,
    scaled_sd: course.scaled_sd,
    scaled_max: course.scaled_max,
  };
}

function averageParams(paramsList: ScalingParams[]): ScalingParams {
  const n = paramsList.length;
  return {
    hsc_mean: paramsList.reduce((s, p) => s + p.hsc_mean, 0) / n,
    hsc_sd: paramsList.reduce((s, p) => s + p.hsc_sd, 0) / n,
    scaled_mean: paramsList.reduce((s, p) => s + p.scaled_mean, 0) / n,
    scaled_sd: paramsList.reduce((s, p) => s + p.scaled_sd, 0) / n,
    scaled_max: paramsList.reduce((s, p) => s + p.scaled_max, 0) / n,
  };
}

export function getScalingParams(courseName: string, mode: YearMode): ScalingParams | null {
  if (mode === "last") return getParamsForYear(courseName, LAST_YEAR);
  const paramsList: ScalingParams[] = [];
  for (const year of AVG_YEARS) {
    const p = getParamsForYear(courseName, year);
    if (p) paramsList.push(p);
  }
  if (paramsList.length === 0) return null;
  return averageParams(paramsList);
}

function computeScaledMarkZScore(hscMark: number, params: ScalingParams): number {
  if (hscMark <= 0 || params.hsc_sd === 0) return 0;
  const hscHalf = hscMark / 2;
  const z = (hscHalf - params.hsc_mean) / params.hsc_sd;
  let scaled = params.scaled_mean + z * params.scaled_sd;
  scaled = Math.max(0, Math.min(scaled, params.scaled_max));
  return Math.round(scaled * 10) / 10;
}

function getHscAnchorPointsForYear(courseName: string, year: string): HscScaledAnchor[] | null {
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

function getHscAnchorPoints(courseName: string, mode: YearMode): HscScaledAnchor[] | null {
  if (mode === "last") {
    return getHscAnchorPointsForYear(courseName, LAST_YEAR);
  }
  const allAnchors: HscScaledAnchor[][] = [];
  for (const year of AVG_YEARS) {
    const anchors = getHscAnchorPointsForYear(courseName, year);
    if (anchors) allAnchors.push(anchors);
  }
  if (allAnchors.length === 0) return null;
  const anchorCount = allAnchors[0].length;
  const averaged: HscScaledAnchor[] = [];
  for (let i = 0; i < anchorCount; i++) {
    let hscSum = 0;
    let scaledSum = 0;
    for (const anchors of allAnchors) {
      hscSum += anchors[i].hscHalf;
      scaledSum += anchors[i].scaled;
    }
    averaged.push({
      hscHalf: Math.round((hscSum / allAnchors.length) * 10) / 10,
      scaled: Math.round((scaledSum / allAnchors.length) * 10) / 10,
    });
  }
  return averaged;
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

function generateHscPoints(courseName: string, mode: YearMode): CurvePoint[] {
  const anchors = getHscAnchorPoints(courseName, mode);
  if (anchors) {
    const spline = buildMonotoneSpline(anchors);
    const pts: CurvePoint[] = [];
    for (let hsc = 0; hsc <= 100; hsc += 1) {
      const scaled = Math.round(spline(hsc / 2) * 10) / 10;
      if (scaled > 0 || hsc === 0) pts.push({ x: hsc, scaled });
    }
    return pts;
  }
  // fallback to z-score
  const params = getScalingParams(courseName, mode);
  if (!params) return [];
  const pts: CurvePoint[] = [];
  for (let hsc = 0; hsc <= 100; hsc += 1) {
    const s = computeScaledMarkZScore(hsc, params);
    if (s > 0 || hsc === 0) pts.push({ x: hsc, scaled: s });
  }
  return pts;
}

function getPercentilePointsForYear(courseName: string, year: string): CurvePoint[] | null {
  const normalized = normalizeCourseName(courseName);
  const course = PERCENTILE_DATA[year]?.table_a3.find(
    (c) => normalizeCourseName(c.course) === normalized
  );
  if (!course) return null;
  return PERCENTILE_KEYS.map((key) => ({
    x: PERCENTILE_LABELS[key],
    scaled: course.scaled[key],
  }));
}

export function getPercentileCurve(courseName: string, mode: YearMode): CurvePoint[] | null {
  if (mode === "last") return getPercentilePointsForYear(courseName, LAST_YEAR);
  const allPoints: Map<number, number[]> = new Map();
  let count = 0;
  for (const year of AVG_YEARS) {
    const pts = getPercentilePointsForYear(courseName, year);
    if (pts) {
      count++;
      for (const pt of pts) {
        if (!allPoints.has(pt.x)) allPoints.set(pt.x, []);
        allPoints.get(pt.x)!.push(pt.scaled);
      }
    }
  }
  if (count === 0) return null;
  return PERCENTILE_KEYS.map((key) => {
    const x = PERCENTILE_LABELS[key];
    const vals = allPoints.get(x) || [];
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    return { x, scaled: Math.round(avg * 10) / 10 };
  });
}

export function generateCurve(courseName: string, yearMode: YearMode, graphMode: GraphMode): CourseCurve {
  if (graphMode === "percentile") {
    const points = getPercentileCurve(courseName, yearMode);
    if (points) return { course: courseName, points };
    const params = getScalingParams(courseName, yearMode);
    if (!params) return { course: courseName, points: [] };
    return {
      course: courseName,
      points: [25, 50, 75, 90, 99].map((x) => {
        const hscEst = params.hsc_mean + 0.5 * params.hsc_sd * (x === 25 ? -0.67 : x === 50 ? 0 : x === 75 ? 0.67 : x === 90 ? 1.28 : 2.33);
        const hscMark = Math.round(Math.min(100, Math.max(0, hscEst * 2)) * 10) / 10;
        return { x, scaled: computeScaledMarkZScore(hscMark, params) };
      }).filter((p) => p.scaled > 0),
    };
  }
  return { course: courseName, points: generateHscPoints(courseName, yearMode) };
}

export function mergeCurvesForRecharts(curves: CourseCurve[]): Array<{ x: number } & Record<string, number>> {
  if (curves.length === 0) return [];
  const allX = new Set<number>();
  for (const c of curves) {
    for (const p of c.points) allX.add(p.x);
  }
  const sortedX = Array.from(allX).sort((a, b) => a - b);
  return sortedX.map((x) => {
    const row: { x: number } & Record<string, number> = { x } as any;
    for (const curve of curves) {
      const pt = curve.points.find((p) => p.x === x);
      if (pt) row[curve.course] = pt.scaled;
    }
    return row;
  });
}

function getEnvelope(curves: CourseCurve[]): { xMin: number; xMax: number; yMin: number; yMax: number } {
  const xVals = curves.flatMap((c) => c.points.map((p) => p.x));
  const yVals = curves.flatMap((c) => c.points.map((p) => p.scaled));
  const yRawMin = Math.min(...yVals);
  const yRawMax = Math.max(...yVals);
  const pad = (yRawMax - yRawMin) * 0.06;
  return {
    xMin: Math.min(...xVals),
    xMax: Math.max(...xVals),
    yMin: Math.max(0, Math.floor((yRawMin - pad) / 2) * 2),
    yMax: Math.min(50, Math.ceil((yRawMax + pad) / 2) * 2),
  };
}

export { getEnvelope };

const TABLE_HSC_MARKS = [60, 70, 80, 90, 100];

export interface ComparisonRow {
  x: number;
  values: { course: string; scaled: number }[];
}

export function buildComparisonTable(
  courseNames: string[],
  yearMode: YearMode,
  graphMode: GraphMode
): ComparisonRow[] {
  if (graphMode === "percentile") {
    const xPoints = [50, 75, 90, 99];
    return xPoints.map((x) => {
      const values = courseNames.map((course) => {
        const curve = getPercentileCurve(course, yearMode);
        const scaled = curve?.find((pt) => pt.x === x)?.scaled ?? 0;
        return { course, scaled };
      });
      return { x, values };
    });
  }
  return TABLE_HSC_MARKS.map((hsc) => {
    const values = courseNames.map((course) => {
      const anchors = getHscAnchorPoints(course, yearMode);
      let scaled = 0;
      if (anchors) {
        scaled = Math.round(buildMonotoneSpline(anchors)(hsc / 2) * 10) / 10;
      } else {
        const params = getScalingParams(course, yearMode);
        scaled = params ? computeScaledMarkZScore(hsc, params) : 0;
      }
      return { course, scaled };
    });
    return { x: hsc, values };
  });
}
