"use client";

import { useMemo, useRef, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import type { CourseCurve, YearMode, GraphMode } from "@/lib/scaling";

const LINE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
  "#06b6d4",
  "#f97316",
];

interface ScalingGraphProps {
  curves: CourseCurve[];
  yearMode: YearMode;
  graphMode: GraphMode;
}

function mergeCurvesForRecharts(curves: CourseCurve[]): Array<{ x: number } & Record<string, number>> {
  if (curves.length === 0) return [];
  return curves[0].points.map((_, i) => {
    const row: { x: number } & Record<string, number> = { x: curves[0].points[i].x } as any;
    for (const curve of curves) {
      row[curve.course] = curve.points[i].scaled;
    }
    return row;
  });
}

function computeDataBounds(curves: CourseCurve[]): {
  xMin: number; xMax: number; yMin: number; yMax: number;
} {
  const xVals = curves.flatMap((c) => c.points.map((p) => p.x));
  const yVals = curves.flatMap((c) => c.points.map((p) => p.scaled));
  const rawYMin = Math.min(...yVals);
  const rawYMax = Math.max(...yVals);
  const rawXMin = Math.min(...xVals);
  const rawXMax = Math.max(...xVals);

  const yPad = (rawYMax - rawYMin) * 0.08;
  const yMin = Math.max(0, Math.floor((rawYMin - yPad) / 2) * 2);
  const yMax = Math.min(50, Math.ceil((rawYMax + yPad) / 2) * 2);

  return {
    xMin: rawXMin,
    xMax: rawXMax,
    yMin,
    yMax,
  };
}

function niceTicks(min: number, max: number, count: number = 6): number[] {
  const step = Math.ceil((max - min) / (count - 1));
  const ticks: number[] = [];
  for (let v = min; v <= max; v += step) {
    ticks.push(v);
  }
  return ticks;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-lg">
      <p className="text-xs font-mono text-muted mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-mono tabular-nums text-foreground">
            {entry.value.toFixed(1)}
          </span>
          <span className="text-muted text-xs">{entry.name}</span>
        </div>
      ))}
    </div>
  );
}

function downloadGraph(svgElement: SVGSVGElement) {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  const bbox = svgElement.getBoundingClientRect();
  const w = bbox.width || 800;
  const h = bbox.height || 500;
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));

  // Set white background
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", "100%");
  bg.setAttribute("height", "100%");
  bg.setAttribute("fill", "white");
  clone.insertBefore(bg, clone.firstChild);

  const svgData = new XMLSerializer().serializeToString(clone);
  const canvas = document.createElement("canvas");
  canvas.width = w * 2;
  canvas.height = h * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  const img = new Image();
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.download = "hsc-scaling-graph.png";
      a.href = URL.createObjectURL(blob);
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };

  img.src = url;
}

export function ScalingGraph({ curves, yearMode, graphMode }: ScalingGraphProps) {
  const chartData = useMemo(() => mergeCurvesForRecharts(curves), [curves]);
  const bounds = useMemo(() => computeDataBounds(curves), [curves]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const svg = containerRef.current?.querySelector("svg");
    if (svg) downloadGraph(svg as unknown as SVGSVGElement);
  }, []);

  const yearLabel = yearMode === "last" ? "2025" : "2021–2025 Avg";
  const isPercentile = graphMode === "percentile";

  const xLabel = isPercentile ? "Percentile" : "HSC Mark / 100";
  const yTicks = niceTicks(bounds.yMin, bounds.yMax, 6);
  const xTicks = niceTicks(bounds.xMin, bounds.xMax, 8);

  if (curves.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-12 text-center">
        <p className="text-sm text-muted">Select courses above to see scaling curves.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {isPercentile ? "Percentile → Scaled Mark" : "HSC Mark → Scaled Mark"}
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {yearLabel} · Per unit scaled mark (out of 50)
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
          title="Download graph as PNG"
        >
          <Download className="h-3 w-3" />
          PNG
        </button>
      </div>
      <div ref={containerRef}>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={chartData}
          margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="x"
            type="number"
            domain={[bounds.xMin, bounds.xMax]}
            ticks={xTicks}
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "var(--muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            label={{
              value: xLabel,
              position: "insideBottom",
              offset: -4,
              style: { fontSize: 11, fill: "var(--muted)", fontFamily: "var(--font-sans)" },
            }}
          />
          <YAxis
            type="number"
            domain={[bounds.yMin, bounds.yMax]}
            ticks={yTicks}
            width={40}
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "var(--muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            label={{
              value: "Scaled / 50",
              position: "insideLeft",
              angle: -90,
              offset: 32,
              style: { fontSize: 11, fill: "var(--muted)", fontFamily: "var(--font-sans)" },
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--muted)", strokeWidth: 1, strokeDasharray: "4 4" }} />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-sans)", paddingTop: 8 }}
          />
          {curves.map((curve, i) => (
            <Line
              key={curve.course}
              type="monotone"
              dataKey={curve.course}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1, stroke: "var(--background)" }}
              animationDuration={400}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
