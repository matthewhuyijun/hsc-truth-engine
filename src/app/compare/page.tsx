'use client';

import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { X, School, BookOpen, BarChart3, Search, Map as MapIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

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
  const [mode, setMode] = useState<'bar' | 'map'>('bar');
  const [metric, setMetric] = useState<'band6' | 'stateRank' | 'sparo'>('band6');
  const [allCourses, setAllCourses] = useState<CourseEntry[]>([]);
  const [allSchools, setAllSchools] = useState<string[]>([]);
  const [popularity, setPopularity] = useState<Map<string, number>>(new Map());
  const [selSchools, setSelSchools] = useState<string[]>([]);
  const [selCourses, setSelCourses] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState('2021');
  const [yearTo, setYearTo] = useState('2025');
  const [sparoData, setSparoData] = useState<Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null>(null);
  const [coords, setCoords] = useState<Record<string, [number, number]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [yearByYear, setYearByYear] = useState<Map<string, Map<string, Map<string, number>>> | null>(null);

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
    if (selSchools.length === 0) { setYearByYear(null); return; }
    let cancelled = false; setLoading(true);
    const years = YEARS.filter(y => y >= yearFrom && y <= yearTo);

    Promise.all(years.map(y => fetch(`/data/school-detail-${y}.json`).then(r => r.json())
      .then((d: Record<string, SchoolDetail>) => ({ year: y, detail: d }))
      .catch(() => ({ year: y, detail: {} as Record<string, SchoolDetail> }))
    )).then(results => {
      if (cancelled) return;
      const yby = new Map<string, Map<string, Map<string, number>>>();
      for (const { year, detail } of results) {
        if (!yby.has(year)) yby.set(year, new Map());
        for (const school of selSchools) {
          const slug = school.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const sd = detail[slug]; if (!sd) continue;
          if (!yby.get(year)!.has(school)) yby.get(year)!.set(school, new Map());
          for (const c of sd.courses) {
            const val = metric === 'band6' ? c.band6Count : c.stateRanks.length;
            if (val > 0) yby.get(year)!.get(school)!.set(c.code, val);
          }
        }
      }
      setYearByYear(yby); setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selSchools, yearFrom, yearTo, metric]);

  // Active courses (those with data in selected schools)
  const activeCourses = useMemo(() => {
    if (!yearByYear) return [];
    const codes = new Set<string>();
    for (const [, sm] of yearByYear) for (const [, cm] of sm) for (const code of cm.keys()) codes.add(code);
    return allCourses.filter(c => codes.has(c.code));
  }, [yearByYear, allCourses]);

  const displayCourses = selCourses.length > 0 ? activeCourses.filter(c => selCourses.includes(c.code)) : activeCourses;

  // Aggregated data for map
  const aggSum = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    if (!yearByYear) return m;
    for (const [, sm] of yearByYear) for (const [school, cm] of sm) {
      if (!m.has(school)) m.set(school, new Map());
      for (const [code, val] of cm) m.get(school)!.set(code, (m.get(school)!.get(code) || 0) + val);
    }
    return m;
  }, [yearByYear]);

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
              {(['bar','map'] as const).map((m, i) => {
                const Icon = m === 'bar' ? BarChart3 : MapIcon;
                const label = m === 'bar' ? 'Bar' : 'Map';
                return <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 text-sm font-medium ${mode === m ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'} ${i > 0 ? 'border-l border-border' : ''}`}>
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
        {yearByYear && activeCourses.length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted block mb-1">Subjects ({activeCourses.length})</span>
            <SubjectPicker courses={activeCourses} selected={selCourses} onToggle={c => setSelCourses(p => p.includes(c) ? p.filter(v => v !== c) : [...p, c])} />
          </div>
        )}

        {!yearByYear && (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-sm text-muted">Select schools above to see comparison charts.</p>
          </div>
        )}

        {yearByYear && mode === 'bar' && metric !== 'sparo' && <BarChartView schools={selSchools} courses={displayCourses} yearByYear={yearByYear} yearFrom={yearFrom} yearTo={yearTo} />}
        {yearByYear && mode === 'bar' && metric === 'sparo' && <SparoLineView schools={selSchools} courses={displayCourses} sparoData={sparoData} />}
        {yearByYear && mode === 'map' && <SchoolMap schools={selSchools} courses={activeCourses} schoolData={aggSum} coords={coords} selCourses={selCourses} />}
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const cr = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return () => {};
    const h = (e: MouseEvent) => { if (cr.current && !cr.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('click', h); return () => document.removeEventListener('click', h);
  }, [open]);

  const grouped = useMemo(() => {
    let items = [...courses];
    if (search) { const q = search.toLowerCase(); items = items.filter(c => c.name.toLowerCase().includes(q)); }
    // Group by category, sort categories
    const groups: Record<string, CourseEntry[]> = {};
    for (const c of items) {
      const cat = c.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    }
    // Sort: selected first, then by name
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => {
        if (selected.includes(a.code) !== selected.includes(b.code)) return selected.includes(a.code) ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }
    return Object.entries(groups).sort(([, a], [, b]) => a.length === b.length ? 0 : b.length - a.length);
  }, [courses, search, selected]);

  return <div className="relative" ref={cr}>
    <div className="flex items-center gap-2 flex-wrap mb-2">
      {selected.map(code => {
        const c = courses.find(x => x.code === code);
        if (!c) return null;
        return <span key={code} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-sm" style={{ borderColor: CAT_COLORS[c.category] || '#888' }}>
          {c.name}<button onClick={() => onToggle(code)} className="text-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        </span>;
      })}
    </div>
    <button onClick={() => setOpen(v => !v)} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-sm text-muted hover:text-foreground hover:border-foreground/30">
      <BookOpen className="h-3.5 w-3.5" />+ Add Subject
    </button>
    {open && <div className="absolute left-0 top-full mt-1 w-80 rounded-lg border border-border bg-background shadow-lg z-50">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted shrink-0" /><input autoFocus type="text" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none" />
      </div>
      <div className="max-h-80 overflow-y-auto">
        {grouped.length === 0 ? <p className="px-3 py-4 text-sm text-muted text-center">No matches</p> :
          grouped.map(([cat, items]) => <div key={cat}>
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-muted/60 bg-surface/50 border-b border-border/50" style={{ color: CAT_COLORS[cat] || '#888' }}>{cat} ({items.length})</div>
            {items.map(c => <button key={c.code} onMouseDown={e => e.preventDefault()}
              onClick={() => onToggle(c.code)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex items-center gap-2 ${selected.includes(c.code) ? 'bg-accent-dim' : ''}`}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[c.category] || '#888' }} />
              <span>{c.name}</span>
            </button>)}
          </div>)
        }
      </div>
    </div>}
  </div>;
}

// ─── Charts ──────────────────────────────────────────────────────────────────

function BarChartView({ schools, courses, yearByYear, yearFrom, yearTo }: {
  schools: string[]; courses: CourseEntry[];
  yearByYear: Map<string, Map<string, Map<string, number>>>;
  yearFrom: string; yearTo: string;
}) {
  // Build data: one entry per (year, school) -> each subject is a dataKey  
  const data = useMemo(() => {
    const rows: Record<string, string | number>[] = [];
    const years = YEARS.filter(y => y >= yearFrom && y <= yearTo);
    for (const year of years) {
      for (const school of schools) {
        const row: Record<string, string | number> = { year, schoolFull: school };
        const sm = yearByYear.get(year)?.get(school);
        for (const c of courses) row[c.code] = sm?.get(c.code) || 0;
        rows.push(row);
      }
    }
    return rows;
  }, [schools, courses, yearByYear, yearFrom, yearTo]);

  if (data.length === 0) return <div className="p-8 text-center text-muted">No data.</div>;

  return <div className="rounded-xl border border-border bg-surface p-4">
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#888' }} />
        <YAxis tick={{ fontSize: 11, fill: '#888' }} />
        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
          formatter={(value) => [String(value || 0), '']}
          labelFormatter={(label, payload) => {
            const p = Array.isArray(payload) ? payload[0]?.payload as Record<string, unknown> | undefined : undefined;
            const s = p?.['schoolFull'] as string || '';
            return s ? `${s} (${label})` : label;
          }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {courses.slice(0, 20).map(c => (
          <Bar key={c.code} dataKey={c.code} stackId="a" fill={CAT_COLORS[c.category] || '#888'}
            name={c.name.length > 25 ? c.name.slice(0, 23) + '…' : c.name} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </div>;
}


function SparoLineView({ schools, courses, sparoData }: {
  schools: string[]; courses: CourseEntry[];
  sparoData: Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null;
}) {
  if (!sparoData) return <div className="p-8 text-center text-muted">SPaRO data not available.</div>;
  const data = useMemo(() => {
    const rows: Record<string, string | number>[] = [];
    for (const school of schools) {
      const slug = school.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const sd = sparoData[slug]; if (!sd) continue;
      for (const c of courses) {
        const subj = sd.subjects?.find(s => s.subject === c.name);
        if (subj) { const row: Record<string, string | number> = { school: school.slice(0, 15) }; row[c.code] = subj.school_average; rows.push(row); }
      }
    }
    return rows;
  }, [schools, courses, sparoData]);
  return <div className="rounded-xl border border-border bg-surface p-4">
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="school" tick={{ fontSize: 11, fill: "#888" }} />
        <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#888" }} />
        <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {courses.slice(0, 20).map(c => (
          <Line key={c.code} type="monotone" dataKey={c.code} stroke={CAT_COLORS[c.category] || "#888"} strokeWidth={2}
            name={c.name.length > 25 ? c.name.slice(0, 23) + "…" : c.name} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
