'use client';

import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, School, Search, Check, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const YEARS = ['2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010','2009','2008','2007','2006','2005','2004','2003','2002','2001'];
const YEAR_MIN = 2001;
const YEAR_MAX = 2025;

interface CourseEntry { code: string; name: string; category: string; }
interface SchoolDetail { name: string; courses: { code: string; name: string; band6Count: number; stateRanks: number[] }[]; }
type Metric = 'band6' | 'stateRank' | 'sparo';

const CAT_HUES: Record<string, number> = {
  English: 0, Mathematics: 210, Science: 270, HSIE: 30,
  'Creative Arts': 300, PDHPE: 330, Languages: 180, Technology: 120, VET: 60, Discontinued: 0,
};
const CAT_ORDER = ['English','Mathematics','Science','HSIE','Languages','Creative Arts','PDHPE','Technology','VET','Discontinued'];

export default function ComparePage() {
  return <Suspense fallback={<div className="p-8 text-center text-muted">Loading...</div>}><CompareContent /></Suspense>;
}

function CompareContent() {
  const t = useTranslations("Compare");
  const [metric, setMetric] = useState<Metric>('band6');
  const [allCourses, setAllCourses] = useState<CourseEntry[]>([]);
  const [allSchools, setAllSchools] = useState<string[]>([]);
  const [popularity, setPopularity] = useState<Map<string, number>>(new Map());
  const [selSchools, setSelSchools] = useState<string[]>([]);
  const [selCourses, setSelCourses] = useState<string[]>([]);
  const [yearFrom, setYearFrom] = useState(2016);
  const [yearTo, setYearTo] = useState(2025);
  const [loading, setLoading] = useState(false);
  const [yearByYear, setYearByYear] = useState<Map<string, Map<string, Map<string, number>>> | null>(null);
  const [sparoData, setSparoData] = useState<Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null>(null);
  const [sparoYearly, setSparoYearly] = useState<Record<string, { name: string; years: Record<string, { subject: string; school_average: number; state_average: number }[]> }> | null>(null);

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
    fetch('/data/sparo-yearly.json').then(r => r.json()).then(setSparoYearly).catch(() => {});
  }, []);

  useEffect(() => {
    if (selSchools.length === 0 || metric === 'sparo') { setYearByYear(null); return; }
    let cancelled = false; setLoading(true);
    const years = YEARS.filter(y => +y >= yearFrom && +y <= yearTo);
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
            const val = metric === 'stateRank' ? c.stateRanks.length : c.band6Count;
            if (val > 0) yby.get(year)!.get(school)!.set(c.code, val);
          }
        }
      }
      setYearByYear(yby); setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selSchools, yearFrom, yearTo, metric]);

  const activeCourses = useMemo(() => {
    if (!yearByYear) return [];
    const codes = new Set<string>();
    for (const [, sm] of yearByYear) for (const [, cm] of sm) for (const code of cm.keys()) codes.add(code);
    return allCourses.filter(c => codes.has(c.code));
  }, [yearByYear, allCourses]);

  const defaultViewMode = metric === 'stateRank' ? 'all' : 'all';

  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold tracking-tight">{t("heading")}</h1>
          <p className="mt-1 text-sm text-muted">{t("description")}</p>
        </div>
      </section>
      <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          {/* Metric picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted">{t('metric')}</span>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {[
                { key: 'band6' as Metric, label: t('metricB6E4') },
                { key: 'stateRank' as Metric, label: t('metricStateRanks') },
                { key: 'sparo' as Metric, label: t('metricSchoolAvg') },
              ].map((m, i) => (
                <button key={m.key} onClick={() => setMetric(m.key)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${metric === m.key ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'} ${i > 0 ? 'border-l border-border' : ''}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {metric !== 'sparo' ? (
            <>
              <div>
                <span className="text-xs font-medium text-muted block mb-1">{t('schoolsLabel')}</span>
                <SchoolPicker items={allSchools} popularity={popularity} selected={selSchools} onToggle={s => setSelSchools(p => p.includes(s) ? p.filter(v => v !== s) : [...p, s])} />
              </div>
              <div>
                <span className="text-xs font-medium text-muted block mb-1">{t('years')}</span>
                <IntervalSlider min={YEAR_MIN} max={YEAR_MAX} value={[yearFrom, yearTo]} onChange={([f, t]) => { setYearFrom(f); setYearTo(t); }} />
              </div>
            </>
          ) : (
            <>
              {sparoYearly && (() => {
                const sparoSchools = allSchools.filter(s => {
                  const slug = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                  return sparoYearly[slug];
                });
                const normName = (n: string) => n.toLowerCase().replace(/[()]/g, '').trim();
                const hasCourseInSchool = (slug: string, courseName: string): boolean => {
                  const sd = sparoYearly[slug];
                  if (!sd) return false;
                  const years = Object.keys(sd.years || {});
                  return years.some(y => sd.years[y]?.some(subj => normName(subj.subject) === normName(courseName)));
                };
                // Active schools: only those with data for AT LEAST ONE selected course
                const activeSparoSchools = selCourses.length > 0
                  ? sparoSchools.filter(s => {
                      const slug = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                      return selCourses.some(code => {
                        const c = allCourses.find(x => x.code === code);
                        return c && hasCourseInSchool(slug, c.name);
                      });
                    })
                  : sparoSchools;
                // Courses: only show those with data in AT LEAST ONE selected school
                const courseSchools = selSchools.length > 0 ? selSchools.filter(s => sparoSchools.includes(s)) : sparoSchools;
                const sparoCourses = allCourses.filter(c => {
                  return courseSchools.some(s => {
                    const slug = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    return hasCourseInSchool(slug, c.name);
                  });
                });
                return (
                  <>
                    <div>
                        <span className="text-xs font-medium text-muted block mb-1">{t('schoolsLabelCount', { count: activeSparoSchools.length })}{selCourses.length > 1 ? t('maxOneCourse') : ''}</span>
                        <SchoolPicker items={activeSparoSchools} popularity={popularity} selected={selSchools.filter(s => activeSparoSchools.includes(s))} addDisabled={selCourses.length > 1}
                        onToggle={s => setSelSchools(p => {
                          if (selCourses.length > 1 && !p.includes(s)) return p; // block adding another school
                          return p.includes(s) ? p.filter(v => v !== s) : [...p, s];
                        })} />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted block mb-1">{t('coursesLabelCount', { count: sparoCourses.length })}{selSchools.length > 1 ? t('maxOneSchool') : ''}</span>
                      <CoursePicker courses={sparoCourses} selected={selCourses.filter(c => sparoCourses.some(sc => sc.code === c))} addDisabled={selSchools.length > 1}
                        onToggle={c => setSelCourses(p => {
                          if (selSchools.length > 1 && !p.includes(c)) return p; // block adding another course
                          return p.includes(c) ? p.filter(v => v !== c) : [...p, c];
                        })} />
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {loading && <div className="text-xs text-muted mb-4">{t('loadingData')}</div>}

        {metric === 'sparo' ? (
          sparoYearly && <SparoChart schools={selSchools} selCourses={selCourses} courses={allCourses} sparoYearly={sparoYearly} />
        ) : (
          <>
            {!selSchools.length && <div className="rounded-xl border border-border bg-surface p-8 text-center"><p className="text-sm text-muted">{t('emptyPrompt')}</p></div>}
            {yearByYear && activeCourses.length > 0 && selSchools.length > 0 && (
              <CombinedChart schools={selSchools} courses={activeCourses} yearByYear={yearByYear} yearFrom={yearFrom} yearTo={yearTo} metric={metric} defaultViewMode={defaultViewMode} />
            )}
            {yearByYear && !loading && activeCourses.length === 0 && selSchools.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-8 text-center"><p className="text-sm text-muted">{t('noCourseData')}</p></div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function IntervalSlider({ min, max, value, onChange }: { min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void; }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'oldest' | 'newest' | null>(null);
  const [hoverThumb, setHoverThumb] = useState<'oldest' | 'newest' | null>(null);
  const range = max - min;
  const pctNewest = ((max - value[1]) / range) * 100;
  const pctOldest = ((max - value[0]) / range) * 100;

  const snap = useCallback((clientX: number): number => {
    if (!trackRef.current) return max;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return max - Math.round(pct * range);
  }, [min, range, max]);

  // Click on track: move nearest thumb
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (dragging) return;
    const v = snap(e.clientX);
    const distNewest = Math.abs(v - value[1]);
    const distOldest = Math.abs(v - value[0]);
    if (distNewest <= distOldest) {
      onChange([value[0], Math.max(v, value[0] + 1)]);
    } else {
      onChange([Math.min(v, value[1] - 1), value[1]]);
    }
  }, [snap, value, onChange, dragging]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const v = snap(e.clientX);
      if (dragging === 'newest') onChange([value[0], Math.max(v, value[0] + 1)]);
      else onChange([Math.min(v, value[1] - 1), value[1]]);
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, value, onChange, snap]);

  return (
    <div className="flex items-center gap-3 select-none py-1">
      <span className="text-sm font-mono text-muted w-10 text-right">{value[1]}</span>
      <div ref={trackRef} className="relative flex-1 h-12 flex items-center cursor-pointer group" onClick={handleTrackClick}>
        {/* Track bg */}
        <div className="absolute inset-x-0 h-1.5 bg-muted/30 rounded-full top-1/2 -translate-y-1/2" />
        {/* Active range */}
        <div className="absolute h-1.5 bg-foreground/40 rounded-full top-1/2 -translate-y-1/2 group-hover:bg-foreground/50 transition-colors" style={{ left: `${pctNewest}%`, width: `${pctOldest - pctNewest}%` }} />
        {/* Tick marks with labels */}
        {[2020,2015,2010,2005].map(y => {
          const pct = ((max - y) / range) * 100;
          return (
            <div key={y} className="absolute" style={{ left: `${pct}%` }}>
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-px h-2.5 bg-border" />
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] text-muted/50 font-mono leading-none">{y}</span>
            </div>
          );
        })}
        {/* Newest thumb (left) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full border-2 border-background shadow-md cursor-grab active:cursor-grabbing transition-transform ${dragging === 'newest' || hoverThumb === 'newest' ? 'scale-125' : ''}`}
          style={{ left: `calc(${pctNewest}% - 9px)`, backgroundColor: 'var(--color-foreground)' }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDragging('newest'); }}
          onMouseEnter={() => setHoverThumb('newest')}
          onMouseLeave={() => setHoverThumb(null)}
        />
        {/* Oldest thumb (right) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full border-2 border-background shadow-md cursor-grab active:cursor-grabbing transition-transform ${dragging === 'oldest' || hoverThumb === 'oldest' ? 'scale-125' : ''}`}
          style={{ left: `calc(${pctOldest}% - 9px)`, backgroundColor: 'var(--color-foreground)' }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDragging('oldest'); }}
          onMouseEnter={() => setHoverThumb('oldest')}
          onMouseLeave={() => setHoverThumb(null)}
        />
      </div>
      <span className="text-sm font-mono text-muted w-10">{value[0]}</span>
    </div>
  );
}

function SchoolPicker({ items, popularity, selected, onToggle, addDisabled }: { items: string[]; popularity: Map<string, number>; selected: string[]; onToggle: (s: string) => void; addDisabled?: boolean; }) {
  const t = useTranslations("Compare");
  const [open, setOpen] = useState(false); const [search, setSearch] = useState(''); const cr = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (!open) return () => {}; const h = (e: MouseEvent) => { if (cr.current && !cr.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [open]);
  const sorted = useMemo(() => { let r = [...items]; if (search) { const q = search.toLowerCase(); r = r.filter(s => s.toLowerCase().includes(q)); } r.sort((a, b) => { if (selected.includes(a) !== selected.includes(b)) return selected.includes(a) ? -1 : 1; return (popularity.get(b) || 0) - (popularity.get(a) || 0) || a.localeCompare(b); }); return r.slice(0, 100); }, [items, popularity, search, selected]);
  return <div className="relative" ref={cr}>
    <div className="flex items-center gap-2 overflow-x-auto">
      {selected.map(s => <span key={s} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-sm shrink-0">{s}<button onClick={() => onToggle(s)} className="text-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button></span>)}
      <button onClick={() => { if (!addDisabled) { setOpen(v => !v); setSearch(''); } }} className={`inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-sm shrink-0 ${addDisabled ? 'opacity-40 cursor-not-allowed text-muted' : 'text-muted hover:text-foreground hover:border-foreground/30'}`}><School className="h-3.5 w-3.5" />{t('addSchool')}</button>
    </div>
    {open && <div className="absolute left-0 top-full mt-1 w-80 rounded-lg border border-border bg-background shadow-lg z-50">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2"><Search className="h-3.5 w-3.5 text-muted shrink-0" /><input autoFocus type="text" placeholder={t("schoolSearch")} value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none" /></div>
      <div className="max-h-72 overflow-y-auto">{sorted.length === 0 ? <p className="px-3 py-4 text-sm text-muted text-center">{t("noMatches")}</p> : sorted.map(s => <button key={s} onMouseDown={e => e.preventDefault()} onClick={() => { onToggle(s); setSearch(''); setOpen(false); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex justify-between ${selected.includes(s) ? 'bg-accent-dim' : ''}`}><span>{s}</span><span className="text-xs text-muted/50 font-mono">{popularity.get(s)?.toLocaleString() || ''}</span></button>)}</div>
    </div>}
  </div>;
}

function CoursePicker({ courses, selected, onToggle, addDisabled }: { courses: CourseEntry[]; selected: string[]; onToggle: (code: string) => void; addDisabled?: boolean; }) {
  const t = useTranslations("Compare");
  const [open, setOpen] = useState(false); const [search, setSearch] = useState(''); const cr = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (!open) return () => {}; const h = (e: MouseEvent) => { if (cr.current && !cr.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [open]);
  const grouped = useMemo(() => {
    let items = [...courses]; if (search) { const q = search.toLowerCase(); items = items.filter(c => c.name.toLowerCase().includes(q)); }
    const groups: Record<string, CourseEntry[]> = {}; for (const c of items) { if (!groups[c.category]) groups[c.category] = []; groups[c.category].push(c); }
    return CAT_ORDER.filter(cat => groups[cat]).map(cat => [cat, groups[cat]] as [string, CourseEntry[]]);
  }, [courses, search]);
  return <div className="relative" ref={cr}>
    <div className="flex items-center gap-2 overflow-x-auto">
      {selected.map(code => { const c = courses.find(x => x.code === code); if (!c) return null; return <span key={code} className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-sm shrink-0">{c.name}<button onClick={() => onToggle(code)} className="text-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button></span>; })}
      <button onClick={() => { if (!addDisabled) { setOpen(v => !v); setSearch(''); } }} className={`inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-sm shrink-0 ${addDisabled ? 'opacity-40 cursor-not-allowed text-muted' : 'text-muted hover:text-foreground hover:border-foreground/30'}`}>{t('addCourse')}</button>
    </div>
    {open && <div className="absolute left-0 top-full mt-1 w-80 rounded-lg border border-border bg-background shadow-lg z-50">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2"><Search className="h-3.5 w-3.5 text-muted shrink-0" /><input autoFocus type="text" placeholder={t("courseSearch")} value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none" /></div>
      <div className="max-h-80 overflow-y-auto">{grouped.length === 0 ? <p className="px-3 py-4 text-sm text-muted text-center">{t("noMatches")}</p> : grouped.map(([cat, items]) => <div key={cat}><div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-muted/60 bg-surface/50 border-b border-border/50" style={{ color: `hsl(${CAT_HUES[cat] ?? 0} 70% 50%)` }}>{cat} ({items.length})</div>{items.map(c => <button key={c.code} onMouseDown={e => e.preventDefault()} onClick={() => { onToggle(c.code); setSearch(''); setOpen(false); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex items-center gap-2 ${selected.includes(c.code) ? 'bg-accent-dim' : ''}`}><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: `hsl(${CAT_HUES[c.category] ?? 0} 70% 50%)` }} /><span>{c.name}</span></button>)}</div>)}</div>
    </div>}
  </div>;
}

function Checkbox({ checked, partial, size = 'md', onChange }: { checked: boolean; partial?: boolean; size?: 'md' | 'sm'; onChange: () => void; }) {
  const dim = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'; const inner = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  return <button onClick={onChange} className={`${dim} shrink-0 rounded-[3px] border border-border flex items-center justify-center transition-colors hover:border-foreground/50 cursor-pointer`} style={{ backgroundColor: checked && !partial ? 'var(--color-foreground)' : 'transparent' }}>{checked && !partial && <Check className={`${inner} text-background`} strokeWidth={3} />}{partial && <Minus className={`${inner} text-foreground`} strokeWidth={3} />}</button>;
}

function CleanTooltip({ active, payload, label, courses, multiSchool, multiCourse }: { active?: boolean; payload?: { dataKey: string; value: number; color: string; name?: string }[]; label?: string; courses: CourseEntry[]; multiSchool?: boolean; multiCourse?: boolean; }) {
  if (!active || !payload?.length) return null;
  // When multiple courses selected, hide state average lines (they're also hidden on the chart)
  const sorted = [...payload].filter(p => p.value > 0 && !(multiCourse && String(p.dataKey).startsWith('state_'))).sort((a, b) => b.value - a.value);
  // Exclude state_ lines from uniqueCodes — they were causing singleCourse=false even with 1 real course
  const nonState = sorted.filter(p => !String(p.dataKey).startsWith('state_'));
  const uniqueCodes = new Set(nonState.map(p => { const parts = (p.dataKey as string).split('__'); return parts.length > 1 ? parts[1] : parts[0]; }));
  const singleCourse = uniqueCodes.size <= 1;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2.5 shadow-lg text-xs min-w-[210px]">
      <p className="text-muted font-medium mb-1.5">{label}</p>
      {sorted.map(p => {
        const isState = String(p.dataKey).startsWith('state_');
        const parts = (p.dataKey as string).split('__');
        const school = parts.length > 1 ? parts[0] : '';
        const code = parts.length > 1 ? parts[1] : parts[0];
        const c = courses.find(x => x.code === code);
        let displayName: string;
        if (isState) {
          displayName = p.name || p.dataKey;
        } else if (multiCourse !== undefined) {
          displayName = (multiSchool && !multiCourse && school) ? school : (c?.name || p.name || p.dataKey);
        } else if (multiSchool && singleCourse && school) {
          displayName = school;
        } else if (multiSchool && school) {
          displayName = c?.name || code;
        } else {
          displayName = c?.name || p.name || p.dataKey;
        }
        return (
          <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
              <span className="truncate">{displayName}</span>
            </div>
            <span className="font-mono font-semibold tabular-nums text-foreground ml-2">
              {typeof p.value === 'number' ? (p.value % 1 ? p.value.toFixed(1) : p.value) : p.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CombinedChart({ schools, courses, yearByYear, yearFrom, yearTo, metric, defaultViewMode }: { schools: string[]; courses: CourseEntry[]; yearByYear: Map<string, Map<string, Map<string, number>>>; yearFrom: number; yearTo: number; metric: Metric; defaultViewMode: 'top10' | 'all'; }) {
  const t = useTranslations("Compare");
  const [viewMode, setViewMode] = useState<'top10' | 'all'>(defaultViewMode);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const years = useMemo(() => YEARS.filter(y => +y >= yearFrom && +y <= yearTo), [yearFrom, yearTo]);
  const globalTotals = useMemo(() => { const totals = new Map<string, number>(); for (const school of schools) { for (const year of years) { const cm = yearByYear.get(year)?.get(school); if (!cm) continue; for (const [code, count] of cm) totals.set(`${school}__${code}`, (totals.get(`${school}__${code}`) || 0) + count); } } return totals; }, [yearByYear, schools, years]);
  const rankedByTotal = useMemo(() => [...globalTotals.entries()].filter(([, total]) => total > 0).sort(([, a], [, b]) => b - a).map(([key]) => key), [globalTotals]);
  const topPairs = useMemo(() => { const perSchool = new Map<string, string[]>(); for (const key of rankedByTotal) { const [school] = key.split('__'); if (!perSchool.has(school)) perSchool.set(school, []); if (perSchool.get(school)!.length < 10) perSchool.get(school)!.push(key); } return [...perSchool.values()].flat(); }, [rankedByTotal]);
  const displayPairs = useMemo(() => { const pool = (viewMode === 'top10' && metric !== 'stateRank') ? topPairs : rankedByTotal; return [...pool].sort((a, b) => { const [, codeA] = a.split('__'); const [, codeB] = b.split('__'); const catA = courses.find(x => x.code === codeA)?.category || ''; const catB = courses.find(x => x.code === codeB)?.category || ''; const oA = CAT_ORDER.includes(catA) ? CAT_ORDER.indexOf(catA) : CAT_ORDER.length; const oB = CAT_ORDER.includes(catB) ? CAT_ORDER.indexOf(catB) : CAT_ORDER.length; if (oA !== oB) return oA - oB; return (globalTotals.get(b) || 0) - (globalTotals.get(a) || 0); }); }, [viewMode, topPairs, rankedByTotal, globalTotals, courses, metric]);
  const chartData = useMemo(() => years.map(year => { const row: Record<string, number | string> = { year }; for (const key of rankedByTotal) { const [school, code] = key.split('__'); const cm = yearByYear.get(year)?.get(school); row[key] = cm?.get(code) || 0; } return row; }), [years, yearByYear, rankedByTotal]);
  const visible = useMemo(() => displayPairs.filter(k => !hidden.has(k)), [displayPairs, hidden]);
  const colorMap = useMemo(() => { const map = new Map<string, string>(); const byCat: Record<string, { code: string; total: number }[]> = {}; const seenCodes = new Set<string>(); for (const key of displayPairs) { const [, code] = key.split('__'); if (seenCodes.has(code)) continue; seenCodes.add(code); const c = courses.find(x => x.code === code); const cat = c?.category || ''; if (!byCat[cat]) byCat[cat] = []; byCat[cat].push({ code, total: 0 }); } for (const [key, total] of globalTotals) { const [, code] = key.split('__'); for (const catItems of Object.values(byCat)) { const item = catItems.find(x => x.code === code); if (item) item.total += total; } } for (const [cat, items] of Object.entries(byCat)) { const hue = CAT_HUES[cat] ?? 0; const sat = cat === 'Discontinued' ? 5 : 65; items.sort((a, b) => b.total - a.total); const n = items.length; items.forEach(({ code }, i) => { const light = n <= 1 ? 48 : 28 + Math.round((i / (n - 1)) * 42); map.set(code, `hsl(${hue} ${sat}% ${light}%)`); }); } return map; }, [displayPairs, courses, globalTotals]);
  const toggle = useCallback((key: string) => { setHidden(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; }); }, []);
  if (chartData.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">{schools.join(' vs ')}</h3>
        {metric !== 'stateRank' && (
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button onClick={() => setViewMode('all')} className={`px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'all' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>All ({rankedByTotal.length})</button>
          <button onClick={() => setViewMode('top10')} className={`px-2.5 py-1 text-xs font-medium border-l border-border transition-colors ${viewMode === 'top10' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>{t('top10')}</button>
        </div>
        )}
      </div>
      <p className="text-xs text-muted/60 mb-3">{metric === 'stateRank' ? t('coursesByTotalSR') : t('coursesByTotalB6')}</p>
      <div className="h-[400px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} allowDecimals={metric === 'stateRank' ? false : undefined} axisLine={false} tickLine={false} />
            <Tooltip content={<CleanTooltip courses={courses} multiSchool={schools.length > 1} />} cursor={{ fill: 'var(--color-surface)', opacity: 0.5 }} />
            {visible.map(key => { const [school, code] = key.split('__'); const si = schools.indexOf(school); return <Bar key={key} dataKey={key} stackId={si} fill={colorMap.get(code) || '#888'} />; })}
            {viewMode === 'top10' && rankedByTotal
              .filter(k => !displayPairs.includes(k) && !hidden.has(k))
              .map(key => { const [school, code] = key.split('__'); const si = schools.indexOf(school); return <Bar key={key} dataKey={key} stackId={si} fill="#9ca3af" />; })}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 border-t border-border pt-3">
        {schools.map(school => { const schoolPairs = displayPairs.filter(k => k.startsWith(`${school}__`)); if (schoolPairs.length === 0) return null; const grouped: Record<string, string[]> = {}; for (const key of schoolPairs) { const [, code] = key.split('__'); const cat = courses.find(x => x.code === code)?.category || 'Other'; if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(key); } const catsToShow = CAT_ORDER.filter(cat => grouped[cat]); return <div key={school} className="flex-1 min-w-0"><p className="text-xs font-semibold text-foreground mb-2 truncate">{school}</p><p className="text-xs text-muted/60 mb-2">{t('clickToToggle')}</p><div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">{catsToShow.map(cat => { const keys = grouped[cat]; const allHidden = keys.every(k => hidden.has(k)); const partial = !allHidden && keys.some(k => hidden.has(k)); return <div key={cat}><label className="flex items-center gap-2 cursor-pointer hover:bg-surface-hover/50 rounded px-1 py-0.5 -mx-1 transition-colors" onClick={() => { keys.forEach(k => allHidden ? setHidden(prev => { const n = new Set(prev); n.delete(k); return n; }) : setHidden(prev => { const n = new Set(prev); n.add(k); return n; })); }}><Checkbox checked={!allHidden} partial={partial} onChange={() => {}} /><div className={`w-2.5 h-2.5 rounded-full shrink-0 ${allHidden ? 'opacity-25' : ''}`} style={{ backgroundColor: `hsl(${CAT_HUES[cat] ?? 0} 70% 50%)` }} /><span className="text-sm font-medium truncate">{cat}</span></label><div className="ml-5 space-y-0.5 mt-1">{keys.map(key => { const [, code] = key.split('__'); const c = courses.find(x => x.code === code); const h = hidden.has(key); const col = colorMap.get(code) || '#888'; return <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-surface-hover/50 rounded px-1 py-0.5 -mx-1 transition-colors" onClick={() => toggle(key)}><Checkbox checked={!h} size="sm" onChange={() => {}} /><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col, opacity: h ? 0.25 : 1 }} /><span className={`text-xs truncate ${h ? 'text-muted/50 line-through' : ''}`}>{c?.name || code}</span></label>; })}</div></div>; })}{viewMode === 'top10' && (() => { const otherForSchool = rankedByTotal.filter(k => k.startsWith(`${school}__`) && !displayPairs.includes(k)); if (otherForSchool.length === 0) return null; const allHidden = otherForSchool.every(k => hidden.has(k)); return <div className="mt-2"><label className="flex items-center gap-2 cursor-pointer hover:bg-surface-hover/50 rounded px-1 py-0.5 -mx-1 transition-colors" onClick={() => { otherForSchool.forEach(k => allHidden ? setHidden(prev => { const n = new Set(prev); n.delete(k); return n; }) : setHidden(prev => { const n = new Set(prev); n.add(k); return n; })); }}><Checkbox checked={!allHidden} onChange={() => {}} /><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#9ca3af' }} /><span className="text-sm font-medium truncate">{t("othersCount", { count: otherForSchool.length })}</span></label><div className="ml-5 space-y-0.5 mt-1">{otherForSchool.map(key => { const [, code] = key.split('__'); const c = courses.find(x => x.code === code); const h = hidden.has(key); return <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-surface-hover/50 rounded px-1 py-0.5 -mx-1 transition-colors" onClick={() => toggle(key)}><Checkbox checked={!h} size="sm" onChange={() => {}} /><div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#9ca3af', opacity: h ? 0.25 : 1 }} /><span className={`text-xs truncate ${h ? 'text-muted/50 line-through' : ''}`}>{c?.name || code}</span></label>; })}</div></div>; })()}</div></div>; })}
      </div>
    </div>
  );
}

function SparoChart({ schools, selCourses, courses, sparoYearly }: { schools: string[]; selCourses: string[]; courses: CourseEntry[]; sparoYearly: Record<string, { name: string; years: Record<string, { subject: string; school_average: number; state_average: number }[]> }>; }) {
  const t = useTranslations("Compare");
  const SPARO_YEARS = ['2019','2020','2021','2022','2023','2024','2025'];
  const normName = (n: string) => n.toLowerCase().replace(/[()]/g, '').trim();
  // Generate distinct line colors
  const totalLines = schools.length * selCourses.length;
  function lineColor(index: number): string {
    const hue = (index * 137.5) % 360; // golden angle spacing
    return `hsl(${hue} 65% ${40 + (index % 3) * 12}%)`;
  }

  if (selCourses.length === 0) return null;

  // Build data: each course gets its own dataKey, each school gets its own series
  // dataKey format: "school__courseCode" or just "courseCode"
  const data = SPARO_YEARS.map(year => {
    const row: Record<string, unknown> = { year };
    for (const school of schools) {
      const slug = school.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const sd = sparoYearly[slug];
      for (const code of selCourses) {
        const c = courses.find(x => x.code === code);
        const name = c?.name || '';
        const subj = sd?.years?.[year]?.find((s: { subject: string; school_average: number; state_average: number }) => normName(s.subject) === normName(name));
        const key = schools.length > 1 ? `${school}__${code}` : code;
        row[key] = subj?.school_average ?? null;
        if (!row[`state_${code}`] && subj?.state_average != null) row[`state_${code}`] = subj.state_average;
      }
    }
    return row;
  });

  const hasData = data.some(row => selCourses.some(code => {
    for (const school of schools) {
      const key = schools.length > 1 ? `${school}__${code}` : code;
      if (row[key] != null) return true;
    }
    return false;
  }));
  if (!hasData) return null;

  return (
    <div className="rounded-xl border border-border bg-surface/30 p-4">
      <h3 className="text-sm font-semibold text-foreground mb-1">{selCourses.map(c => courses.find(x => x.code === c)?.name || c).join(', ')} — School Averages Over Time</h3>
      <p className="text-xs text-muted/60 mb-3">{t('sparoSubtitle')}</p>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CleanTooltip courses={courses} multiSchool={schools.length > 1} multiCourse={selCourses.length > 1} />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {schools.map((school, si) =>
              selCourses.map((code, ci) => {
                const c = courses.find(x => x.code === code);
                const key = schools.length > 1 ? `${school}__${code}` : code;
                const label = schools.length > 1 && selCourses.length === 1 ? (school.length > 10 ? school.slice(0, 9) + '…' : school) : schools.length > 1 ? `${c?.name || code} (${school.length > 10 ? school.slice(0, 9) + '…' : school})` : c?.name || code;
                return <Line key={key} type="monotone" dataKey={key} name={label} stroke={lineColor(si * selCourses.length + ci)} strokeWidth={2} dot={{ r: 3 }} connectNulls />;
              })
            )}
            {selCourses.map(code => {
              const c = courses.find(x => x.code === code);
              const hidden = selCourses.length > 1;
              return <Line key={`state_${code}`} type="monotone" dataKey={`state_${code}`} name={selCourses.length === 1 ? String(t('stateAvg')) : c?.name ? `${c.name} ${t('stateAvg')}` : String(t('stateAvg'))} stroke={hidden ? 'transparent' : '#9ca3af'} strokeWidth={hidden ? 0 : 1.5} strokeDasharray={hidden ? undefined : '6 3'} dot={false} connectNulls />;
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted/60 mt-2">{t('sparoSource')}</p>
    </div>
  );
}
