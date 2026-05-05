import { buildMonotoneSpline } from "./spline";
import type { HscScaledAnchor } from "./spline";
import {
  PERCENTILE_DATA,
  PERCENTILE_KEYS,
  PERCENTILE_LABELS,
  normalizeCourseName,
  getAllCourses as _getAllCourses,
  getCourseData as _getCourseData,
  getPercentileAnchorsForYear,
} from "./course-data";

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

export function getAllScalingCourses(): string[] {
  return _getAllCourses();
}

const LAST_YEAR = "2025";
const AVG_YEARS = ["2021", "2022", "2023", "2024", "2025"];

export const YEAR_MODES = [
  { value: "last", label: "2025" },
  { value: "avg5", label: "5-Year Avg" },
] as const;

export const GRAPH_MODES = [
  { value: "percentile", label: "% → Scaled" },
  { value: "hsc", label: "HSC → Scaled" },
] as const;

export type YearMode = "last" | "avg5";
export type GraphMode = "hsc" | "percentile";

function getParamsForYear(courseName: string, year: string): ScalingParams | null {
  const course = _getCourseData(courseName, year);
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

function getHscAnchorPoints(courseName: string, mode: YearMode): ReturnType<typeof getPercentileAnchorsForYear> {
  if (mode === "last") {
    return getPercentileAnchorsForYear(courseName, LAST_YEAR);
  }
  const allAnchors = [];
  for (const year of AVG_YEARS) {
    const anchors = getPercentileAnchorsForYear(courseName, year);
    if (anchors) allAnchors.push(anchors);
  }
  if (allAnchors.length === 0) return null;
  const anchorCount = allAnchors[0].length;
  const averaged = [];
  for (let i = 0; i < anchorCount; i++) {
    let hscSum = 0;
    let scaledSum = 0;
    for (const a of allAnchors) {
      hscSum += a[i].hscHalf;
      scaledSum += a[i].scaled;
    }
    averaged.push({
      hscHalf: Math.round((hscSum / allAnchors.length) * 10) / 10,
      scaled: Math.round((scaledSum / allAnchors.length) * 10) / 10,
    });
  }
  return averaged;
}

function generateHscPoints(courseName: string, mode: YearMode): CurvePoint[] {
  const anchors = getHscAnchorPoints(courseName, mode);
  if (anchors && anchors.length > 0) {
    const spline = buildMonotoneSpline(anchors);
    const pts: CurvePoint[] = [];
    // Only within data range (p25 to max) — no extrapolation.
    const hhMin = anchors[0].hscHalf;
    const hhMax = anchors[anchors.length - 1].hscHalf;
    for (let i = 0; i <= Math.round((hhMax - hhMin) * 10); i++) {
      const hh = hhMin + i * 0.1;
      const scaled = Math.round(spline(hh) * 10) / 10;
      pts.push({ x: Math.round(hh * 20) / 10, scaled });
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
    const anchors = getPercentileCurve(courseName, yearMode);
    if (anchors && anchors.length > 0) {
      // Build spline from percentile anchors and generate a smooth curve
      // spanning only the data range — no extrapolation.
      const splineAnchors: HscScaledAnchor[] = anchors.map((p) => ({
        hscHalf: p.x,
        scaled: p.scaled,
      }));
      const spline = buildMonotoneSpline(splineAnchors);
      const pts: CurvePoint[] = [];
      const xMin = splineAnchors[0].hscHalf;
      const xMax = splineAnchors[splineAnchors.length - 1].hscHalf;
      for (let x = xMin; x <= xMax; x += 1) {
        const scaled = Math.round(spline(x) * 10) / 10;
        pts.push({ x, scaled });
      }
      return { course: courseName, points: pts };
    }
    // fallback when no percentile data exists
    const params = getScalingParams(courseName, yearMode);
    if (!params) return { course: courseName, points: [] };
    const estAnchors: HscScaledAnchor[] = [
      { hscHalf: 0, scaled: 0 },
      ...[25, 50, 75, 90, 99, 100].map((x) => {
        const hscEst = params.hsc_mean + 0.5 * params.hsc_sd * (x === 25 ? -0.67 : x === 50 ? 0 : x === 75 ? 0.67 : x === 90 ? 1.28 : x === 99 ? 2.33 : 3.0);
        const hscMark = Math.round(Math.min(100, Math.max(0, hscEst * 2)) * 10) / 10;
        return { hscHalf: x, scaled: computeScaledMarkZScore(hscMark, params) };
      }).filter((a) => a.scaled > 0),
    ];
    if (estAnchors.length === 0) return { course: courseName, points: [] };
    const spline = buildMonotoneSpline(estAnchors);
    const pts: CurvePoint[] = [];
    for (let x = 0; x <= 100; x += 1) {
      const scaled = Math.round(spline(x) * 10) / 10;
      if (scaled > 0 || x === 0) pts.push({ x, scaled });
    }
    return { course: courseName, points: pts };
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
    const xPoints = [50, 75, 90, 99, 100];
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
      if (anchors && anchors.length > 0) {
        const hscHalf = hsc / 2;
        // Only use the spline within the data range; fall back to z-score
        // for marks outside the empirical anchors.
        if (hscHalf >= anchors[0].hscHalf && hscHalf <= anchors[anchors.length - 1].hscHalf) {
          scaled = Math.round(buildMonotoneSpline(anchors)(hscHalf) * 10) / 10;
        } else {
          const params = getScalingParams(course, yearMode);
          scaled = params ? computeScaledMarkZScore(hsc, params) : 0;
        }
      } else {
        const params = getScalingParams(course, yearMode);
        scaled = params ? computeScaledMarkZScore(hsc, params) : 0;
      }
      return { course, scaled };
    });
    return { x: hsc, values };
  });
}
