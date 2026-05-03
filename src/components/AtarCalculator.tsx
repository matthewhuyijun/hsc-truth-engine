"use client";

import { useState, useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { Trash2, Search, ChevronDown, AlertTriangle } from "lucide-react";
import {
  getAllCourses,
  calculateAtar,
  resolveUnits,
  shouldExcludeCourse,
  type CourseInput,
  type CalculatorResult,
} from "@/lib/atar";

const YEARS = ["2025", "2024", "2023", "2022", "2021", "2020", "2019"];
const DEFAULT_ROWS = 5;

interface RowState {
  course: string;
  hscMark: number;
}

interface DropdownState {
  rowIndex: number;
  top: number;
  left: number;
  width: number;
  searchQuery: string;
  activeIdx: number;
}

function createEmptyRow(): RowState {
  return { course: "", hscMark: 0 };
}

export function AtarCalculator() {
  const [rows, setRows] = useState<RowState[]>(() =>
    Array.from({ length: DEFAULT_ROWS }, () => createEmptyRow())
  );
  const [dropdown, setDropdown] = useState<DropdownState | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);
  const [yearView, setYearView] = useState<"all" | string>("all");

  const allCourses = useMemo(() => getAllCourses(), []);

  const filterCourses = (q: string, rowIndex: number) => {
    const hasEnglishSelected = rows.some(
      (r) => r.course !== "" && /^english (advanced|standard|eal|studies)/i.test(r.course)
    );
    const query = q.trim().toLowerCase();

    let pool = allCourses;
    if (rowIndex === 0 && !hasEnglishSelected) {
      pool = allCourses.filter((c) => /^english (advanced|standard|eal|studies)/i.test(c));
    }

    if (!query) return pool.slice(0, 30);
    return pool.filter((c) => c.toLowerCase().includes(query)).slice(0, 30);
  };

  const dropdownFiltered = useMemo(() => {
    if (!dropdown) return [] as string[];
    return filterCourses(dropdown.searchQuery, dropdown.rowIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdown?.rowIndex, dropdown?.searchQuery, allCourses, rows]);

  function updateRow(idx: number, partial: Partial<RowState>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...partial } : r)));
  }

  function selectCourse(idx: number, courseName: string) {
    updateRow(idx, { course: courseName });
    setDropdown(null);
  }

  function removeCourse(idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    updateRow(idx, createEmptyRow());
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function toggleDropdown(idx: number, btn: HTMLElement) {
    if (dropdown?.rowIndex === idx) {
      setDropdown(null);
      triggerRef.current = null;
      return;
    }
    triggerRef.current = btn;
    const rect = btn.getBoundingClientRect();
    const filtered = filterCourses("", idx);
    const dropH = Math.min(filtered.length * 40 + 44, 360);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    setDropdown({
      rowIndex: idx,
      top: spaceBelow >= dropH + 8 ? rect.bottom + 4 : rect.top - dropH - 4,
      left: rect.left,
      width: rect.width,
      searchQuery: "",
      activeIdx: 0,
    });
  }

  function updateDropdown(partial: Partial<DropdownState>) {
    setDropdown((prev) => (prev ? { ...prev, ...partial } : null));
  }

  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        tableRef.current && !tableRef.current.contains(target) &&
        !dropdownContainerRef.current?.contains(target)
      ) {
        setDropdown(null);
        triggerRef.current = null;
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  useLayoutEffect(() => {
    if (!dropdown || !triggerRef.current || !dropdownContainerRef.current) return;
    const btn = triggerRef.current;
    const el = dropdownContainerRef.current;
    let rafId: number;

    function syncPosition() {
      const rect = btn.getBoundingClientRect();
      const dropH = Math.min(dropdownFiltered.length * 40 + 44, 360);
      const spaceBelow = window.innerHeight - rect.bottom;
      el.style.top = `${spaceBelow >= dropH + 8 ? rect.bottom + 4 : rect.top - dropH - 4}px`;
      el.style.left = `${rect.left}px`;
      el.style.width = `${rect.width}px`;
      el.style.maxHeight = `${Math.min(360, window.innerHeight - 16)}px`;
      rafId = requestAnimationFrame(syncPosition);
    }

    rafId = requestAnimationFrame(syncPosition);

    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdown?.rowIndex, dropdown?.searchQuery]);

  const inputs: CourseInput[] = useMemo(
    () => rows.filter((r) => r.course !== "").map((r) => ({ course: r.course, hscMark: r.hscMark })),
    [rows]
  );

  const result: CalculatorResult | null = useMemo(() => {
    if (inputs.length === 0) return null;
    return calculateAtar(inputs);
  }, [inputs]);

  const activeInputsForUnits = inputs;
  const hasMarks = inputs.some((inp) => inp.hscMark > 0);

  return (
    <div className="space-y-8">
      {/* How to use */}
      <div className="space-y-2 text-sm text-muted leading-relaxed">
        <h3 className="text-base font-semibold text-foreground">How to use this calculator</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            <strong className="text-foreground">Select your subjects:</strong>{" "}
            Choose your 10 or more units of study from the dropdowns below.
          </li>
          <li>
            <strong className="text-foreground">Enter your marks:</strong>{" "}
            Enter your estimated HSC marks (out of 100). For 1-unit extension courses, double
            your NESA mark (e.g. 45/50 → 90/100).
          </li>
          <li>
            <strong className="text-foreground">Analyse the result:</strong>{" "}
            The scaled marks and ATAR estimate based on past scaling data (2019–2025) are shown below.
          </li>
        </ol>
      </div>

      {/* Year filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted">Year filter:</span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setYearView("all")}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors border ${
              yearView === "all"
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted hover:text-foreground hover:border-foreground/30"
            }`}
          >
            All
          </button>
          {YEARS.map((year) => (
            <button
              key={year}
              onClick={() => setYearView(year)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium font-mono transition-colors border ${
                yearView === year
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto" ref={tableRef}>
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="w-8 px-2 py-2.5 text-center font-medium text-xs uppercase tracking-wider">#</th>
              <th className="px-2 py-2.5 text-left font-medium text-xs uppercase tracking-wider">Course</th>
              <th className="w-[13%] px-1 py-2.5 text-center font-medium text-xs uppercase tracking-wider">
                HSC Mark
              </th>
              {yearView === "all"
                ? YEARS.map((year) => (
                    <th
                      key={year}
                      className="hidden sm:table-cell w-[8%] px-1 py-2.5 text-center font-mono text-xs text-muted"
                    >
                      {year}
                    </th>
                  ))
                : (
                    <th className="px-1 py-2.5 text-center font-mono text-xs text-muted">
                      {yearView}
                    </th>
                  )}
            </tr>
            <tr className="border-b border-border">
              <th></th>
              <th className="px-2 py-1 text-left">
                <span className="text-xs text-muted/50">Units auto-detected</span>
              </th>
              <th className="px-1 py-1 text-center">
                <span className="text-xs text-muted/50">/100</span>
              </th>
              {yearView === "all"
                ? YEARS.map((year) => (
                    <th key={year} className="hidden sm:table-cell px-1 py-1 text-center">
                      <span className="text-xs text-muted/50 font-mono">Scaled</span>
                    </th>
                  ))
                : (
                    <th className="px-1 py-1 text-center">
                      <span className="text-xs text-muted/50 font-mono">Scaled</span>
                    </th>
                  )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const courseResult = result?.courses.find((c) => c.course === row.course);
              const units = row.course ? resolveUnits(row.course, activeInputsForUnits) : undefined;
              const excluded = row.course ? shouldExcludeCourse(row.course, activeInputsForUnits) : false;

              return (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-2 py-2.5 text-center text-xs text-muted/60 font-mono">
                    {i + 1}
                  </td>

                  {/* Course Select */}
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => toggleDropdown(i, e.currentTarget)}
                        className="flex items-center justify-between rounded border border-border bg-background px-2.5 py-1.5 text-left text-sm hover:border-foreground/30 transition-colors min-w-0"
                        style={{ width: dropdown?.rowIndex === i ? dropdown.width : "100%" }}
                      >
                        <span className={row.course ? "text-foreground truncate" : "text-muted/50 truncate"}>
                          {row.course || "Select course..."}
                        </span>
                        <span className="text-xs text-muted/40 font-mono ml-1 flex-shrink-0">
                          {units !== undefined ? `${units}u` : ""}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted/40 ml-1 flex-shrink-0" />
                      </button>

                      {row.course && (
                        <button
                          onClick={(e) => removeCourse(i, e)}
                          className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded text-muted/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {excluded && (
                        <span className="flex-shrink-0 text-xs text-amber-500 font-mono">excluded</span>
                      )}
                    </div>
                  </td>

                  {/* HSC Mark */}
                  <td className="px-1 py-2.5">
                    <div className="flex items-center justify-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={row.hscMark || ""}
                        onChange={(e) =>
                          updateRow(i, {
                            hscMark: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                          })
                        }
                        placeholder="—"
                        disabled={!row.course}
                        className="w-16 rounded border border-border bg-background px-2 py-1.5 text-center font-mono text-sm focus:border-foreground/30 focus:outline-none disabled:opacity-30"
                      />
                    </div>
                  </td>

                  {/* Per-Year Scaled Marks */}
                  {yearView === "all"
                    ? YEARS.map((year) => {
                        const yd = courseResult?.perYearScaled.find((ys) => ys.year === year);
                        if (!row.hscMark || !yd) {
                          return (
                            <td key={year} className="hidden sm:table-cell px-1 py-2.5 text-center">
                              <span className="text-sm text-muted/30 font-mono">—</span>
                            </td>
                          );
                        }
                        if (!yd.courseExists && courseResult?.perYearScaled.some((ys) => ys.courseExists)) {
                          return (
                            <td key={year} className="hidden sm:table-cell px-1 py-2.5 text-center">
                              <span className="text-sm text-muted/40 font-mono">a</span>
                            </td>
                          );
                        }
                        return (
                          <td key={year} className="hidden sm:table-cell px-1 py-2.5 text-center">
                            <span className="font-mono text-sm tabular-nums">
                              {yd.scaledMark > 0 ? yd.scaledMark.toFixed(1) : "—"}
                            </span>
                          </td>
                        );
                      })
                    : (() => {
                        const yd = courseResult?.perYearScaled.find((ys) => ys.year === yearView);
                        if (!row.hscMark || !yd) {
                          return (
                            <td className="px-1 py-2.5 text-center">
                              <span className="text-sm text-muted/30 font-mono">—</span>
                            </td>
                          );
                        }
                        return (
                          <td className="px-1 py-2.5 text-center">
                            <span className="font-mono text-sm tabular-nums">
                              {yd.scaledMark > 0 ? yd.scaledMark.toFixed(1) : "—"}
                            </span>
                          </td>
                        );
                      })()}
                </tr>
              );
            })}

            {/* Aggregate Row */}
            {result && hasMarks && (
              <tr className="border-b border-border bg-surface-hover/30">
                <td></td>
                <td className="px-2 py-2.5 text-sm font-semibold text-foreground">Aggregate</td>
                <td></td>
                {yearView === "all"
                  ? YEARS.map((year) => {
                      const yr = result.yearResults.find((r) => r.year === year);
                      return (
                        <td key={year} className="hidden sm:table-cell px-1 py-2.5 text-center">
                          <span className="font-mono text-sm font-medium tabular-nums">
                            {yr?.aggregate ? yr.aggregate.toFixed(1) : "—"}
                          </span>
                        </td>
                      );
                    })
                  : (() => {
                      const yr = result.yearResults.find((r) => r.year === yearView);
                      return (
                        <td className="px-1 py-2.5 text-center">
                          <span className="font-mono text-sm font-medium tabular-nums">
                            {yr?.aggregate ? yr.aggregate.toFixed(1) : "—"}
                          </span>
                        </td>
                      );
                    })()}
              </tr>
            )}

            {/* Est. ATAR Row */}
            {result && hasMarks && (
              <tr className="border-b border-border bg-surface-hover/30">
                <td></td>
                <td className="px-2 py-2.5 text-sm font-semibold text-foreground">Est. ATAR</td>
                <td></td>
                {yearView === "all"
                  ? YEARS.map((year) => {
                      const yr = result.yearResults.find((r) => r.year === year);
                      const atarVal = yr?.atar;
                      return (
                        <td key={year} className="hidden sm:table-cell px-1 py-2.5 text-center">
                          <span className="font-mono text-sm font-semibold tabular-nums">
                            {atarVal !== undefined && atarVal > 0 ? atarVal.toFixed(2) : "—"}
                          </span>
                        </td>
                      );
                    })
                  : (() => {
                      const yr = result.yearResults.find((r) => r.year === yearView);
                      const atarVal = yr?.atar;
                      return (
                        <td className="px-1 py-2.5 text-center">
                          <span className="font-mono text-sm font-semibold tabular-nums">
                            {atarVal !== undefined && atarVal > 0 ? atarVal.toFixed(2) : "—"}
                          </span>
                        </td>
                      );
                    })()}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dropdown overlay (fixed position, kept in sync via RAF) */}
      {dropdown && (
        <div
          ref={dropdownContainerRef}
          className="fixed z-[100] rounded-md border border-border bg-background shadow-lg overflow-hidden flex flex-col"
          style={{
            top: dropdown.top,
            left: dropdown.left,
            width: dropdown.width,
          }}
          onScroll={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 border-b border-border p-1.5 bg-background">
            <div className="flex items-center gap-1.5 rounded border border-border px-2 py-1">
              <Search className="h-3.5 w-3.5 text-muted/50 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                value={dropdown.searchQuery}
                onChange={(e) =>
                  updateDropdown({ searchQuery: e.target.value, activeIdx: 0 })
                }
                placeholder="Search courses..."
                className="flex-1 bg-transparent text-sm placeholder:text-muted/50 focus:outline-none"
                onKeyDown={(e) => {
                  if (dropdownFiltered.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    updateDropdown({
                      activeIdx: dropdown.activeIdx < dropdownFiltered.length - 1 ? dropdown.activeIdx + 1 : 0,
                    });
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    updateDropdown({
                      activeIdx: dropdown.activeIdx > 0 ? dropdown.activeIdx - 1 : dropdownFiltered.length - 1,
                    });
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    selectCourse(dropdown.rowIndex, dropdownFiltered[dropdown.activeIdx]);
                  } else if (e.key === "Escape") {
                    triggerRef.current = null;
                    setDropdown(null);
                  }
                }}
              />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: dropdownFiltered.length * 40 }}>
            {dropdownFiltered.map((name, idx) => {
              const selected = rows.some((r) => r.course === name);
              const u = resolveUnits(name, activeInputsForUnits);
              return (
                <button
                  key={name}
                  onClick={() => !selected && selectCourse(dropdown.rowIndex, name)}
                  disabled={selected}
                  className={`flex w-full items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                    idx === dropdown.activeIdx ? "bg-surface-hover" : "hover:bg-surface-hover/50"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <span className="truncate">{name}</span>
                  <span className="text-xs text-muted/50 font-mono ml-2 flex-shrink-0">{u}u</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add course button */}
      <div className="flex justify-center">
        <button
          onClick={addRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2 text-sm font-medium text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          + Add course
        </button>
      </div>

      {/* Notation */}
      <p className="text-xs text-muted/60 leading-relaxed">
        <strong className="text-muted/80">a</strong> = insufficient scaling data, uses average of available years.
        Math Ext 1 = 2 units when paired with Ext 2. Math Advanced excluded when Ext 1 + 2 selected.
      </p>

      {/* ATAR Result */}
      {hasMarks && result && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">Your estimated ATAR is:</p>
          <p className="text-5xl font-bold font-mono tabular-nums tracking-tight mt-1">
            {result.atar.toFixed(2)}
          </p>
          {result.atarRange.min > 0 && (
            <p className="mt-2 text-sm text-muted font-mono">
              Range: {result.atarRange.min.toFixed(2)} – {result.atarRange.max.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {!hasMarks && (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">Your estimated ATAR is:</p>
          <p className="text-5xl font-bold font-mono text-muted/20 mt-1">—</p>
        </div>
      )}

      {/* Warnings */}
      {result && result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.filter((w, i, a) => a.indexOf(w) === i).map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-600 dark:text-amber-400">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {/* Best 10 breakdown */}
      {result && hasMarks && result.courses.some((c) => c.unitsCounted > 0) && (
        <div className="rounded-lg border border-border p-5">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted mb-3">
            Best 10 Unit Breakdown
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.courses
              .filter((c) => c.unitsCounted > 0)
              .map((c) => (
                <div
                  key={c.course}
                  className="flex items-center justify-between rounded border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="font-medium truncate">{c.course}</span>
                  <span className="text-xs font-mono text-muted tabular-nums ml-2 flex-shrink-0">
                    {c.unitsCounted}/{c.units}u
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-lg border border-border/50 px-4 py-3 space-y-2">
        <p className="text-xs text-muted/60 leading-relaxed">
          Uses UAC scaling data 2019–2025. Marks entered out of 100 for all courses
          (extension: double NESA mark). Results are estimates using historical statistics.
          For the most theoretically accurate ATAR estimate, use{" "}
          <a
            href="https://www.uac.edu.au/atar-compass"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            UAC ATAR Compass
          </a>
          {" "}— the official calculator. Not affiliated with NESA or UAC.
        </p>
      </div>
    </div>
  );
}
