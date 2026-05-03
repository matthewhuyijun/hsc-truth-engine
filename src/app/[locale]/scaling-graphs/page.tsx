"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, X, ChevronDown, BarChart3 } from "lucide-react";
import {
  getAllScalingCourses,
  generateCurve,
  buildComparisonTable,
  YEAR_MODES,
  GRAPH_MODES,
  type CourseCurve,
  type ComparisonRow,
  type YearMode,
  type GraphMode,
} from "@/lib/scaling";
import { ScalingGraph } from "@/components/ScalingGraph";

const MAX_COURSES = 8;
const TABLE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#6366f1", "#06b6d4", "#f97316"];

export default function ScalingGraphsPage() {
  const t = useTranslations("ScalingGraphs");
  const allCourses = useMemo(() => getAllScalingCourses(), []);
  const [selected, setSelected] = useState<string[]>([]);
  const [yearMode, setYearMode] = useState<YearMode>("last");
  const [graphMode, setGraphMode] = useState<GraphMode>("percentile");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const availableCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = allCourses.filter(
      (c) => !selected.includes(c) && (!q || c.toLowerCase().includes(q))
    );
    return filtered.slice(0, 50);
  }, [allCourses, selected, searchQuery]);

  function addCourse(course: string) {
    if (selected.length >= MAX_COURSES) return;
    setSelected((prev) => [...prev, course]);
    setSearchQuery("");
    setActiveIdx(0);
    setSearchOpen(false);
  }

  function removeCourse(course: string) {
    setSelected((prev) => prev.filter((c) => c !== course));
  }

  function openSearch() {
    if (selected.length >= MAX_COURSES) return;
    setSearchOpen(true);
    setSearchQuery("");
    setActiveIdx(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  const curves: CourseCurve[] = useMemo(() => {
    return selected
      .map((course) => generateCurve(course, yearMode, graphMode))
      .filter((c) => c.points.length > 0);
  }, [selected, yearMode, graphMode]);

  const comparisonTable: ComparisonRow[] = useMemo(() => {
    if (selected.length === 0) return [];
    return buildComparisonTable(selected, yearMode, graphMode);
  }, [selected, yearMode, graphMode]);

  const xHeader = graphMode === "hsc" ? t("xAxisHSC") : t("xAxisPercentile");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("heading")}</h1>
        <p className="mt-1 max-w-xl text-sm text-muted leading-relaxed">
          {t("description")}
        </p>

        {/* Controls */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Course Selector */}
          <div className="flex-1" ref={dropdownRef}>
            <label className="block text-xs font-medium text-muted mb-2">
              {t("courseSelector", { selected: selected.length, max: MAX_COURSES })}
            </label>

            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selected.map((course) => (
                  <span
                    key={course}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    {course}
                    <button
                      onClick={() => removeCourse(course)}
                      className="ml-0.5 rounded-sm p-0.5 hover:bg-surface-hover transition-colors"
                    >
                      <X className="h-3 w-3 text-muted" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <button
                onClick={openSearch}
                disabled={selected.length >= MAX_COURSES}
                className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-foreground/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="text-muted">
                  {selected.length >= MAX_COURSES ? t("maxCourses") : t("searchButton")}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted flex-shrink-0" />
              </button>

              {searchOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-background shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <div className="flex items-center gap-2 rounded border border-border px-2.5 py-1.5">
                      <Search className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setActiveIdx(0);
                        }}
                        placeholder={t("searchPlaceholder")}
                        className="flex-1 bg-transparent text-sm placeholder:text-muted/50 focus:outline-none"
                        onKeyDown={(e) => {
                          if (availableCourses.length === 0) return;
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setActiveIdx((prev) => (prev < availableCourses.length - 1 ? prev + 1 : 0));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setActiveIdx((prev) => (prev > 0 ? prev - 1 : availableCourses.length - 1));
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            addCourse(availableCourses[activeIdx]);
                          } else if (e.key === "Escape") {
                            setSearchOpen(false);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {availableCourses.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-muted/50 text-center">{t("noCoursesFound")}</p>
                    ) : (
                      availableCourses.map((course, i) => (
                        <button
                          key={course}
                          onClick={() => addCourse(course)}
                          className={`flex w-full items-center px-3 py-2 text-sm text-left transition-colors ${
                            i === activeIdx ? "bg-surface-hover text-foreground" : "text-foreground/80 hover:bg-surface-hover/50"
                          }`}
                        >
                          {course}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-3">
            {/* Graph mode */}
            <div>
              <label className="block text-xs font-medium text-muted mb-2">{t("modeLabel")}</label>
              <div className="flex rounded-md border border-border overflow-hidden">
                {GRAPH_MODES.map((gm) => (
                  <button
                    key={gm.value}
                    onClick={() => setGraphMode(gm.value)}
                    className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      graphMode === gm.value
                        ? "bg-foreground text-background"
                        : "bg-background text-muted hover:text-foreground"
                    }`}
                  >
                    {gm.value === "percentile" ? t("modePercentToScaled") : t("modeHSCToScaled")}
                  </button>
                ))}
              </div>
            </div>

            {/* Year mode */}
            <div>
              <label className="block text-xs font-medium text-muted mb-2">{t("yearLabel")}</label>
              <div className="flex rounded-md border border-border overflow-hidden">
                {YEAR_MODES.map((ym) => (
                  <button
                    key={ym.value}
                    onClick={() => setYearMode(ym.value)}
                    className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      yearMode === ym.value
                        ? "bg-foreground text-background"
                        : "bg-background text-muted hover:text-foreground"
                    }`}
                  >
                    {ym.value === "last" ? t("year2025") : t("year5yrAvg")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mt-8">
          <ScalingGraph curves={curves} yearMode={yearMode} graphMode={graphMode} />
        </div>

        {/* Comparison Table */}
        {comparisonTable.length > 0 && (
          <div className="mt-8 rounded-lg border border-border overflow-hidden">
            <div className="bg-surface px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">{t("comparisonHeading")}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      {xHeader}
                    </th>
                    {selected.map((course, i) => (
                      <th key={course} className="px-4 py-2.5 text-right text-xs font-medium text-foreground whitespace-nowrap">
                        <span
                          className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                          style={{ backgroundColor: TABLE_COLORS[i % TABLE_COLORS.length] }}
                        />
                        {course}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.map((row, ri) => (
                    <tr key={row.x} className={ri < comparisonTable.length - 1 ? "border-b border-border/50" : ""}>
                      <td className="px-4 py-2.5 font-mono text-foreground">{row.x}</td>
                      {row.values.map((v, vi) => (
                        <td key={v.course} className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground/80">
                          {v.scaled > 0 ? v.scaled.toFixed(1) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Interpretation */}
        {selected.length > 0 && (
          <div className="mt-8 rounded-lg border border-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t("interpretationHeading")}</h3>
            <ul className="space-y-2 text-sm text-muted leading-relaxed">
              {graphMode === "hsc" ? (
                <>
                  <li>{t("interpHsc1")}</li>
                  <li>{t("interpHsc2")}</li>
                  <li>{t("interpHsc3")}</li>
                </>
              ) : (
                <>
                  <li>{t("interpPer1")}</li>
                  <li>{t("interpPer2")}</li>
                </>
              )}
              <li>{t("interpYear")}</li>
            </ul>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted mb-3">{t("footerCta")}</p>
          <a
            href="/calculator"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            {t("footerButton")}
          </a>
        </div>
      </div>
    </div>
  );
}
