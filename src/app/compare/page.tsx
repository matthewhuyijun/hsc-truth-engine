'use client';

import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { X, School, BookOpen, BarChart3, ScatterChart, Search, Map as MapIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart as RScatterChart, Scatter, ZAxis, Cell } from 'recharts';

const SchoolMap = dynamic(() => import('./SchoolMap'), { ssr: false, loading: () => <div className="p-8 text-center text-muted">Loading map...</div> });

// ─── Types ───────────────────────────────────────────────────────────────────

interface CourseEntry { code: string; name: string; category: string; }
interface SchoolDetail { name: string; courses: { code: string; band6Count: number; stateRanks: number[] }[]; }

const YEARS = ['2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010','2009','2008','2007','2006','2005','2004','2003','2002','2001'];

const CAT_COLORS: Record<string, string> = {
  English: '#10b981', Mathematics: '#3b82f6', Science: '#f59e0b', HSIE: '#ef4444',
  'Creative Arts': '#8b5cf6', PDHPE: '#ec4899', Languages: '#06b6d4', Technology: '#84cc16', VET: '#f97316', Discontinued: '#6b7280',
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  return <Suspense fallback={<div className="p-8 text-center text-muted">Loading...</div>}><CompareContent /></Suspense>;
}

function CompareContent() {
  const [mode, setMode] = useState<'bar' | 'bubble' | 'map'>('bar');
  const [metric, setMetric] = useState<'band6' | 'stateRank' | 'sparo'>('band6');
  const [allCourses, setAllCourses] = useState<CourseEntry[]>([]);
  const [allSchools, setAllSchools] = useState<string[]>([]);
  const [popularity, setPopularity] = useState<Map<string, number>>(new Map());
  const [selSchools, setSelSchools] = useState<string[]>([]);
  const [selCourses, setSelCourses] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState('2017');
  const [yearTo, setYearTo] = useState('2025');
  const [sparoData, setSparoData] = useState<Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null>(null);
  const [coords, setCoords] = useState<Record<string, [number, number]> | null>(null);
  const [loading, setLoading] = useState(false);

  // Aggregated data: school -> course code -> value (summed over year range)
  const [agg, setAgg] = useState<Map<string, Map<string, number>> | null>(null);

  // Load metadata
  useEffect(() => {
    fetch('/data/course-categories.json').then(r => r.json())
      .then((d: Record<string, { name: string; category: string }>) => setAllCourses(
        Object.entries(d).map(([code, info]) => ({ code, name: info.name, category: info.category }))
      )).catch(() => {});
    fetch('/data/schools.json').then(r => r.json()).then(setAllSchools).catch(() => {});
    fetch('/data/schools-2025.json').then(r => r.json())
      .then((d: { name: string; band6Count: number }[]) => {
        const m = new Map<string, number>(); d.forEach(s => m.set(s.name, s.band6Count)); setPopularity(m);
      }).catch(() => {});
    fetch('/data/sparo-schools.json').then(r => r.json()).then(setSparoData).catch(() => {});
    fetch('/data/school-coordinates.json').then(r => r.json()).then(setCoords).catch(() => {});
  }, []);

  // Fetch data when schools/years change
  useEffect(() => {
    if (selSchools.length === 0) { setAgg(null); return; }
    let cancelled = false; setLoading(true);
    const years = YEARS.filter(y => y >= yearFrom && y <= yearTo);

    Promise.all(years.map(y => fetch(`/data/school-detail-${y}.json`).then(r => r.json())
      .then((d: Record<string, SchoolDetail>) => ({ year: y, detail: d }))
      .catch(() => ({ year: y, detail: {} as Record<string, SchoolDetail> }))
    )).then(results => {
      if (cancelled) return;
      const m = new Map<string, Map<string, number>>();
      for (const { detail } of results) {
        for (const school of selSchools) {
          const slug = school.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const sd = detail[slug]; if (!sd) continue;
          if (!m.has(school)) m.set(school, new Map());
          for (const c of sd.courses) {
            const val = metric === 'band6' ? c.band6Count : c.stateRanks.length;
            if (val > 0) m.get(school)!.set(c.code, (m.get(school)!.get(c.code) || 0) + val);
          }
        }
      }
      setAgg(m); setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selSchools, yearFrom, yearTo, metric]);

  // Active courses (those with data in selected schools)
  const activeCourses = useMemo(() => {
    if (!agg) return [];
    const codes = new Set<string>();
    for (const [, cm] of agg) for (const code of cm.keys()) codes.add(code);
    return allCourses.filter(c => codes.has(c.code));
  }, [agg, allCourses]);

  const displayCourses = selCourses.length > 0 ? activeCourses.filter(c => selCourses.includes(c.code)) : activeCourses.slice(0, 12);

  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold tracking-tight">School Comparison</h1>
          <p className="mt-1 text-sm text-muted">Compare Band 6/E4 and State Rank performance across schools.</p>
        </div>
      </section>

      <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['bar','bubble','map'] as const).map(m => {
                const Icon = m === 'bar' ? BarChart3 : m === 'bubble' ? ScatterChart : MapIcon;
                const label = m === 'bar' ? 'Bar' : m === 'bubble' ? 'Bubble' : 'Map';
                return <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 text-sm font-medium ${mode === m ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'} ${m !== 'bar' ? 'border-l border-border' : ''}`}>
                  <Icon className="h-3.5 w-3.5 inline mr-1" />{label}</button>;
              })}
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['band6','stateRank','sparo'] as const).map((m, i) =>
                <button key={m} onClick={() => setMetric(m)} className={`px-3 py-1.5 text-sm font-medium ${metric === m ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'} ${i > 0 ? 'border-l border-border' : ''}`}>
                  {m === 'band6' ? 'B6/E4' : m === 'stateRank' ? 'State Ranks' : 'School Avg'}</button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-xs text-muted">Years:</span>
            <select value={yearFrom} onChange={e => setYearFrom(e.target.value)} className="rounded border border-border bg-surface px-2 py-1 text-sm">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-muted">to</span>
            <select value={yearTo} onChange={e => setYearTo(e.target.value)} className="rounded border border-border bg-surface px-2 py-1 text-sm">
              {YEARS.filter(y => y >= yearFrom).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* School picker */}
        <div>
          <span className="text-xs font-medium text-muted block mb-1">Schools</span>
          <SchoolPicker items={allSchools} popularity={popularity} selected={selSchools} onToggle={s => setSelSchools(p => p.includes(s) ? p.filter(v => v !== s) : [...p, s])} />
        </div>

        {/* Subject picker */}
        {agg && activeCourses.length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted block mb-1">Subjects ({activeCourses.length})</span>
            <SubjectPicker courses={activeCourses} selected={selCourses} onToggle={c => setSelCourses(p => p.includes(c) ? p.filter(v => v !== c) : [...p, c])} />
          </div>
        )}

        {!agg && (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">Select schools above to see comparison charts.</p>
          </div>
        )}

        {agg && mode === 'bar' && <BarChartView schools={selSchools} courses={displayCourses} agg={agg} metric={metric} sparoData={sparoData} />}
        {agg && mode === 'bubble' && <BubbleChartView schools={selSchools} courses={displayCourses} agg={agg} />}
        {agg && mode === 'map' && <SchoolMap schools={selSchools} courses={activeCourses} schoolData={agg} coords={coords} selCourses={selCourses} />}
        {loading && <div className="text-xs text-muted">Loading data...</div>}
      </section>
    </div>
  );
}

// ─── Pickers ─────────────────────────────────────────────────────────────────

function SchoolPicker({ items, popularity, selected, onToggle }: {
  items: string[]; popularity: Map<string, number>; selected: string[]; onToggle: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const cr = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return () => {};
    const h = (e: MouseEvent) => { if (cr.current && !cr.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', h); return () => document.removeEventListener('click', h);
  }, [open]);

  const sorted = useMemo(() => {
    let r = [...items];
    if (search) { const q = search.toLowerCase(); r = r.filter(s => s.toLowerCase().includes(q)); }
    r.sort((a, b) => {
      if (selected.includes(a) !== selected.includes(b)) return selected.includes(a) ? -1 : 1;
      return (popularity.get(b) || 0) - (popularity.get(a) || 0) || a.localeCompare(b);
    });
    return r.slice(0, 100);
  }, [items, popularity, search, selected]);

  return <div className="relative" ref={cr}>
    <div className="flex items-center gap-2 flex-wrap mb-2">
      {selected.map(s => (
        <span key={s} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-sm">
          {s}<button onClick={() => onToggle(s)} className="text-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        </span>
      ))}
    </div>
    <button onClick={() => setOpen(v => !v)} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-sm text-muted hover:text-foreground hover:border-foreground/30">
      <School className="h-3.5 w-3.5" />+ Add School
    </button>
    {open && <div className="absolute left-0 top-full mt-1 w-80 rounded-lg border border-border bg-background shadow-lg z-50">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted shrink-0" /><input autoFocus type="text" placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none" />
      </div>
      <div className="max-h-72 overflow-y-auto">
        {sorted.length === 0 ? <p className="px-3 py-4 text-sm text-muted text-center">No matches</p> :
          sorted.map(s => <button key={s} onMouseDown={e => e.preventDefault()} onClick={() => onToggle(s)} className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex justify-between ${selected.includes(s) ? 'bg-accent-dim' : ''}`}>
            <span>{s}</span><span className="text-xs text-muted/50 font-mono">{popularity.get(s)?.toLocaleString() || ''}</span></button>
          )}
      </div>
    </div>}
  </div>;
}

function SubjectPicker({ courses, selected, onToggle }: {
  courses: CourseEntry[]; selected: string[]; onToggle: (code: string) => void;
}) {
  return <div className="flex flex-wrap gap-2">
    {courses.map(c => {
      const sel = selected.length === 0 || selected.includes(c.code);
      return <button key={c.code} onClick={() => onToggle(c.code)}
        className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${sel ? '' : 'opacity-30'}`}
        style={{ borderColor: CAT_COLORS[c.category] || '#888', color: sel ? CAT_COLORS[c.category] || '#888' : '#888' }}>
        {c.name}
      </button>;
    })}
  </div>;
}

// ─── Charts ──────────────────────────────────────────────────────────────────

function BarChartView({ schools, courses, agg, metric, sparoData }: {
  schools: string[]; courses: CourseEntry[]; agg: Map<string, Map<string, number>>;
  metric: string; sparoData: Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null;
}) {
  // Build data: one entry per school
  const data = useMemo(() => schools.map(school => {
    const cm = agg.get(school);
    const entry: Record<string, string | number> = { school: school.length > 18 ? school.slice(0, 16) + '…' : school };
    if (metric === 'sparo' && sparoData) {
      // For SPaRO, get average per course from sparoData
      const slug = school.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const sd = sparoData[slug];
      for (const c of courses) {
        const subj = sd?.subjects?.find(s => s.subject === c.name);
        entry[c.code] = subj ? subj.school_average : 0;
      }
    } else if (cm) {
      for (const c of courses) entry[c.code] = cm.get(c.code) || 0;
    } else {
      for (const c of courses) entry[c.code] = 0;
    }
    return entry;
  }), [schools, courses, agg, metric, sparoData]);

  return <div className="rounded-xl border border-border bg-surface p-4">
    <ResponsiveContainer width="100%" height={Math.max(300, schools.length * 80)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
        <YAxis type="category" dataKey="school" tick={{ fontSize: 11, fill: '#888' }} width={110} />
        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
        {courses.map(c => (
          <Bar key={c.code} dataKey={c.code} stackId="a" fill={CAT_COLORS[c.category] || '#888'} name={c.name} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </div>;
}

function BubbleChartView({ schools, courses, agg }: {
  schools: string[]; courses: CourseEntry[]; agg: Map<string, Map<string, number>>;
}) {
  const data = useMemo(() => {
    const pts: { x: number; y: number; z: number; school: string; course: string }[] = [];
    schools.forEach((school, si) => {
      const cm = agg.get(school);
      if (!cm) return;
      courses.forEach((course, ci) => {
        const v = cm.get(course.code) || 0;
        if (v > 0) pts.push({ x: si, y: ci, z: v, school: school.length > 15 ? school.slice(0, 13) + '…' : school, course: course.name });
      });
    });
    return pts;
  }, [schools, courses, agg]);

  if (data.length === 0) return <div className="p-8 text-center text-muted">No data for selected filters.</div>;

  return <div className="rounded-xl border border-border bg-surface p-4">
    <ResponsiveContainer width="100%" height={500}>
      <RScatterChart margin={{ top: 10, right: 20, bottom: 60, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis type="number" dataKey="x" tick={false} label={{ value: 'Schools →', position: 'bottom', offset: 10, fill: '#888', fontSize: 12 }} />
        <YAxis type="number" dataKey="y" tick={false} label={{ value: 'Subjects →', angle: -90, position: 'left', fill: '#888', fontSize: 12 }} />
        <ZAxis type="number" dataKey="z" range={[5, 600]} />
        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
          formatter={(value: unknown) => String(value)} />
        <Scatter data={data} fill="#3b82f6" opacity={0.6}>
          {data.map((_, i) => {
            const d = data[i];
            const courseEntry = courses.find(c => c.name === d.course);
            return <Cell key={i} fill={CAT_COLORS[courseEntry?.category || ''] || '#3b82f6'} />;
          })}
        </Scatter>
      </RScatterChart>
    </ResponsiveContainer>
    <div className="flex flex-wrap gap-3 mt-2 justify-center text-xs text-muted">
      {schools.map((s, i) => <span key={s}>{i}: {s}</span>)}
    </div>
  </div>;
}
