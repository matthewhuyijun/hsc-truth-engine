'use client';

import { Suspense, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X, School, BookOpen, BarChart3, ScatterChart } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CourseEntry { code: string; name: string; category: string; }
interface SchoolEntry { name: string; band6Count: number; uniqueStudents: number; stateRanks: number; slug: string; }
interface SchoolDetail {
  name: string; courses: { code: string; band6Count: number; stateRanks: number[] }[];
}

const AVAILABLE_YEARS = ['2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010','2009','2008','2007','2006','2005','2004','2003','2002','2001'];

const CAT_COLORS: Record<string, string> = {
  English: '#10b981', Mathematics: '#3b82f6', Science: '#f59e0b', HSIE: '#ef4444',
  'Creative Arts': '#8b5cf6', PDHPE: '#ec4899', Languages: '#06b6d4', Technology: '#84cc16', VET: '#f97316',
  Discontinued: '#6b7280',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  return <Suspense fallback={<div className="p-8 text-center text-muted">Loading...</div>}><CompareContent /></Suspense>;
}

function CompareContent() {
  const [mode, setMode] = useState<'bar' | 'bubble'>('bar');
  const [metric, setMetric] = useState<'band6' | 'stateRank'>('band6');
  const [allCourses, setAllCourses] = useState<CourseEntry[]>([]);
  const [allSchools, setAllSchools] = useState<string[]>([]);
  const [selCourses, setSelCourses] = useState<string[]>([]);
  const [selSchools, setSelSchools] = useState<string[]>([]);
  const [selYears, setSelYears] = useState<string[]>(['2025','2024','2023','2022']);
  const [data, setData] = useState<Map<string, Map<string, Record<string, number>>> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/data/course-categories.json').then(r => r.json())
      .then((d: Record<string, { name: string; category: string }>) => setAllCourses(
        Object.entries(d).map(([code, info]) => ({ code, name: info.name, category: info.category }))
      )).catch(() => {});
    fetch('/data/schools.json').then(r => r.json()).then(setAllSchools).catch(() => {});
  }, []);

  useEffect(() => {
    if (selSchools.length === 0 || selYears.length === 0) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    // data: schoolName -> courseCode -> year -> value
    const schoolData = new Map<string, Map<string, Record<string, number>>>();

    Promise.all(selYears.map(y =>
      fetch(`/data/school-detail-${y}.json`).then(r => r.json())
        .then((d: Record<string, SchoolDetail>) => ({ year: y, detail: d }))
        .catch(() => ({ year: y, detail: {} as Record<string, SchoolDetail> }))
    )).then(results => {
      if (cancelled) return;
      for (const { year, detail } of results) {
        for (const schoolName of selSchools) {
          const slug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const sd = detail[slug];
          if (!sd) continue;
          if (!schoolData.has(schoolName)) schoolData.set(schoolName, new Map());
          const sm = schoolData.get(schoolName)!;
          for (const c of sd.courses) {
            if (!sm.has(c.code)) sm.set(c.code, {});
            sm.get(c.code)![year] = metric === 'band6' ? c.band6Count : c.stateRanks.length;
          }
        }
      }
      setData(schoolData);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selSchools, selYears, metric]);

  const toggleYear = (y: string) => setSelYears(p => p.includes(y) ? p.filter(v => v !== y) : [...p, y]);

  // Determine active courses (meet threshold for display)
  const activeCourses = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const [, sm] of data) for (const [code, years] of sm) {
      const total = Object.values(years).reduce((a, b) => a + b, 0);
      if (total > 0) set.add(code);
    }
    return allCourses.filter(c => set.has(c.code));
  }, [data, allCourses]);

  const filteredCourses = selCourses.length > 0 ? activeCourses.filter(c => selCourses.includes(c.code)) : activeCourses;

  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold tracking-tight">School Comparison</h1>
          <p className="mt-1 text-sm text-muted">Compare Band 6/E4 and State Rank performance across schools.</p>
        </div>
      </section>

      {/* Controls */}
      <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setMode('bar')} className={`px-3 py-1.5 text-sm font-medium ${mode === 'bar' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>
                <BarChart3 className="h-3.5 w-3.5 inline mr-1" />Bar
              </button>
              <button onClick={() => setMode('bubble')} className={`px-3 py-1.5 text-sm font-medium border-l border-border ${mode === 'bubble' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>
                <ScatterChart className="h-3.5 w-3.5 inline mr-1" />Bubble
              </button>
            </div>
            {/* Metric toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setMetric('band6')} className={`px-3 py-1.5 text-sm font-medium ${metric === 'band6' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>B6/E4</button>
              <button onClick={() => setMetric('stateRank')} className={`px-3 py-1.5 text-sm font-medium border-l border-border ${metric === 'stateRank' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>State Ranks</button>
            </div>
            <span className="text-xs text-muted">Pick schools below to start</span>
          </div>

          {/* Year pills */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted mr-1">Years:</span>
            {AVAILABLE_YEARS.slice(0, 15).map(y => (
              <button key={y} onClick={() => toggleYear(y)}
                className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${selYears.includes(y) ? 'bg-foreground text-background' : 'text-muted hover:text-foreground border border-border'}`}>
                {y}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {!data && (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">Select schools above to see comparison charts.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {allSchools.slice(0, 50).map(s => (
                <button key={s} onClick={() => setSelSchools(p => p.includes(s) ? p.filter(v => v !== s) : [...p, s])}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${selSchools.includes(s) ? 'bg-foreground text-background' : 'text-muted hover:text-foreground border border-border'}`}>
                  {s}
                </button>
              ))}
            </div>
            {allSchools.length > 50 && <p className="mt-2 text-xs text-muted">Showing 50 of {allSchools.length} schools</p>}
          </div>
        )}

        {/* Selected pills */}
        {selSchools.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {selSchools.map(s => (
              <span key={s} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-sm">
                <School className="h-3.5 w-3.5 text-muted" />{s}
                <button onClick={() => setSelSchools(p => p.filter(v => v !== s))} className="text-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
            <button onClick={() => setSelSchools([])} className="text-xs text-muted hover:text-foreground">Clear all</button>
          </div>
        )}

        {/* Graph */}
        {data && (
          <CompareGraph
            mode={mode} metric={metric}
            schools={selSchools} courses={filteredCourses}
            schoolData={data} years={selYears}
            selCourses={selCourses} setSelCourses={setSelCourses}
            loading={loading}
          />
        )}
      </section>
    </div>
  );
}

// ─── Graph Component ─────────────────────────────────────────────────────────

function CompareGraph({
  mode, metric, schools, courses, schoolData, years, selCourses, setSelCourses, loading,
}: {
  mode: 'bar' | 'bubble'; metric: 'band6' | 'stateRank';
  schools: string[]; courses: CourseEntry[]; schoolData: Map<string, Map<string, Record<string, number>>>;
  years: string[]; selCourses: string[]; setSelCourses: (v: string[]) => void; loading: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 400 });

  useEffect(() => {
    if (containerRef.current) {
      setDims({ w: containerRef.current.clientWidth, h: mode === 'bar' ? 400 : 500 });
    }
  }, [mode]);

  const padding = { top: 20, right: 20, bottom: 60, left: 80 };
  const graphW = dims.w - padding.left - padding.right;
  const graphH = dims.h - padding.top - padding.bottom;

  if (courses.length === 0) {
    return <div className="rounded-xl border border-border bg-surface p-8 text-center">
      <p className="text-sm text-muted">No course data for selected schools. Try selecting different schools.</p>
    </div>;
  }

  if (mode === 'bar') {
    // Bar chart: schools as groups, courses as stacked/side-by-side bars per year
    const visibleCourses = selCourses.length > 0 ? courses.filter(c => selCourses.includes(c.code)) : courses.slice(0, 8);
    const barW = graphW / (schools.length * visibleCourses.length * years.length + schools.length * 2);
    const maxVal = Math.max(1, ...Array.from(schoolData.values())
      .flatMap(sm => Array.from(sm.values()))
      .flatMap(yd => Object.values(yd)));

    return <div ref={containerRef}>
      {loading && <div className="text-xs text-muted mb-2">Loading...</div>}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-muted">Filter courses:</span>
        {courses.slice(0, 15).map(c => (
          <button key={c.code} onClick={() => setSelCourses(selCourses.includes(c.code) ? selCourses.filter(v => v !== c.code) : [...selCourses, c.code])}
            className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${selCourses.length === 0 || selCourses.includes(c.code) ? '' : 'opacity-30'} border`}
            style={{ borderColor: selCourses.length === 0 || selCourses.includes(c.code) ? CAT_COLORS[c.category] || '#888' : '#888', color: CAT_COLORS[c.category] || '#888' }}>
            {c.name}
          </button>
        ))}
        {selCourses.length > 0 && <button onClick={() => setSelCourses([])} className="text-xs text-muted hover:text-foreground">Show all</button>}
      </div>
      <svg width={dims.w} height={dims.h}>
        {/* Y axis */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <g key={p}>
            <line x1={padding.left} y1={padding.top + graphH * (1-p)} x2={padding.left + graphW} y2={padding.top + graphH * (1-p)} stroke="#333" strokeWidth={0.5} />
            <text x={padding.left - 5} y={padding.top + graphH * (1-p) + 4} textAnchor="end" fontSize={10} fill="#888">{Math.round(maxVal * p)}</text>
          </g>
        ))}
        {/* Bars */}
        {schools.map((school, si) => {
          const sm = schoolData.get(school);
          if (!sm) return null;
          const groupX = padding.left + (graphW / schools.length) * si + graphW / schools.length * 0.1;
          const groupW = graphW / schools.length * 0.8;
          const subW = groupW / (visibleCourses.length * years.length + 1);

          return <g key={school}>
            {visibleCourses.map((course, ci) => {
              const cy = sm.get(course.code);
              return years.map((year, yi) => {
                let val = cy?.[year] || 0;
                if (metric === 'stateRank') val = Math.max(0.3, val); // make tiny ranks visible
                const barH = (val / maxVal) * graphH;
                const x = groupX + (ci * years.length + yi) * subW;
                const y = padding.top + graphH - barH;
                const color = CAT_COLORS[course.category] || '#888';
                return <rect key={`${school}-${course.code}-${year}`} x={x} y={y} width={Math.max(subW - 1, 1)} height={Math.max(barH, 0.5)}
                  fill={color} opacity={0.85} />;
              });
            })}
            {/* School label */}
            <text x={groupX + groupW/2} y={dims.h - 5} textAnchor="middle" fontSize={9} fill="#888" transform={`rotate(-30, ${groupX + groupW/2}, ${dims.h - 5})`}>
              {school.length > 20 ? school.slice(0, 18) + '…' : school}
            </text>
          </g>;
        })}
      </svg>
    </div>;
  }

  // Bubble chart
  const visibleCourses = selCourses.length > 0 ? courses.filter(c => selCourses.includes(c.code)) : courses;
  const maxVal = Math.max(1, ...Array.from(schoolData.values())
    .flatMap(sm => Array.from(sm.values()))
    .flatMap(yd => Object.values(yd)));
  const maxBubble = Math.min(60, maxVal > 0 ? 60 : 20);

  return <div ref={containerRef}>
    <div className="flex items-center gap-2 mb-3 flex-wrap">
      <span className="text-xs text-muted">Filter courses:</span>
      {courses.slice(0, 20).map(c => (
        <button key={c.code} onClick={() => setSelCourses(selCourses.includes(c.code) ? selCourses.filter(v => v !== c.code) : [...selCourses, c.code])}
          className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${selCourses.length === 0 || selCourses.includes(c.code) ? '' : 'opacity-30'} border`}
          style={{ borderColor: selCourses.length === 0 || selCourses.includes(c.code) ? CAT_COLORS[c.category] || '#888' : '#888', color: CAT_COLORS[c.category] || '#888' }}>
          {c.name}
        </button>
      ))}
    </div>
    <svg width={dims.w} height={dims.h}>
      {schools.map((school, si) => {
        const sm = schoolData.get(school);
        if (!sm) return null;
        const x = padding.left + (graphW / (schools.length - 1 || 1)) * si + (schools.length === 1 ? graphW / 2 : 0);
        let yCursor = padding.top + 20;

        return visibleCourses.map((course, ci) => {
          const cy = sm.get(course.code);
          if (!cy) return null;
          const total = Object.values(cy).reduce((a, b) => a + b, 0);
          if (total === 0) return null;
          const r = Math.max(3, Math.sqrt(total / maxVal) * maxBubble);
          const color = CAT_COLORS[course.category] || '#888';
          yCursor += r * 2 + 4;
          return <g key={`${school}-${course.code}`}>
            <circle cx={x} cy={yCursor - r} r={r} fill={color} opacity={0.7} stroke={color} strokeWidth={0.5} />
            {r > 10 && <text x={x} y={yCursor - r + 1} textAnchor="middle" fontSize={Math.min(r * 0.7, 10)} fill="#fff" fontWeight={600}>{total}</text>}
          </g>;
        });
      })}
      {/* School labels */}
      {schools.map((school, si) => {
        const x = padding.left + (graphW / (schools.length - 1 || 1)) * si + (schools.length === 1 ? graphW / 2 : 0);
        return <text key={school} x={x} y={dims.h - 5} textAnchor="middle" fontSize={9} fill="#888">
          {school.length > 15 ? school.slice(0, 13) + '…' : school}
        </text>;
      })}
    </svg>
  </div>;
}
