'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from "next-intl";
import { Search, ChevronUp, ChevronDown, X, School, BookOpen, Info } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SchoolEntry { name: string; band6Count: number; uniqueStudents: number; stateRanks: number; }
interface CourseMeta { code: string; name: string; }
interface StudentCourse { code: string; name: string; rank: number; }
interface StudentEntry { firstName: string; lastName: string; courses: StudentCourse[]; b6Count: number; stateRankCount: number; isAllRounder: boolean; }
interface CourseAgg { code: string; name: string; band6Count: number; stateRanks: number[]; }
interface SchoolDetail { name: string; stats: { band6Count: number; uniqueStudents: number; stateRanks: number; allRounders: number }; students: StudentEntry[]; courses: CourseAgg[]; }
interface CourseStats { name: string; total: number; male: number; female: number; non_binary: number; bands?: Record<string, number>; }

type SortField = 'name' | 'band6Count' | 'uniqueStudents' | 'stateRanks';
type SortDir = 'asc' | 'desc';

const ALL_YEARS = ['2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2015','2014','2013','2012','2011','2010','2009','2008','2007','2006','2005','2004','2003','2002','2001'];

function slugify(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp className="h-3.5 w-3.5 opacity-25" />;
  return dir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HonorRollPage() {
  return <Suspense fallback={<Skeleton />}><HonorRollContent /></Suspense>;
}

function Skeleton() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-border"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-9 w-48 bg-surface rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-surface rounded animate-pulse" />
      </div></section>
      <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-10 bg-surface rounded-lg animate-pulse" /></div>
      </section>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-6 py-16 text-center"><p className="text-sm text-muted">Loading...</p></div>
        </div>
      </section>
    </div>
  );
}

function HonorRollContent() {
  const t = useTranslations("HonorRoll");
  const router = useRouter();
  const sp = useSearchParams();
  const yearParam = sp.get('year') || '2025';
  const schoolParam = sp.get('school') || '';
  const courseParam = sp.get('course') || '';

  const [year, setYear] = useState(yearParam);
  const [selSchool, setSelSchool] = useState<string | null>(schoolParam || null);
  const [selCourse, setSelCourse] = useState<CourseMeta | null>(courseParam ? { code: courseParam, name: '' } : null);

  const [allCourses, setAllCourses] = useState<CourseMeta[]>([]);
  const [schools, setSchools] = useState<SchoolEntry[] | null>(null);
  const [courses, setCourses] = useState<{ code: string; name: string; band6Count: number }[] | null>(null);
  const [schoolDetail, setSchoolDetail] = useState<SchoolDetail | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [allDetail, setAllDetail] = useState<Record<string, SchoolDetail> | null>(null);
  const [sparoData, setSparoData] = useState<Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFilters = !!(selSchool || selCourse);

  useEffect(() => {
    fetch('/data/courses.json').then(r => r.json())
      .then((d: { code: string; name: string }[]) => setAllCourses(d.map(c => ({ code: c.code, name: c.name }))))
      .catch(() => {});
    fetch('/data/sparo-schools.json').then(r => r.json()).then(setSparoData).catch(() => {});
  }, []);

  const syncUrl = useCallback((y: string, s: string | null, c: CourseMeta | null) => {
    const p = new URLSearchParams();
    if (y !== '2025') p.set('year', y);
    if (s) p.set('school', s);
    if (c) p.set('course', c.code);
    const qs = p.toString();
    router.push('/honor-roll' + (qs ? '?' + qs : ''), { scroll: false });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    if (!hasFilters) {
      setLoading(true);
      setAllDetail(null); setSchoolDetail(null); setCourseStats(null);
      fetch(`/data/schools-${year}.json`).then(r => r.json()).then(d => { if (!cancelled) { setSchools(d); setLoading(false); } }).catch(() => { if (!cancelled) setLoading(false); });
      fetch(`/data/courses-${year}.json`).then(r => r.json()).then(d => { if (!cancelled) setCourses(d); }).catch(() => {});
    } else {
      setLoading(true);
      fetch(`/data/school-detail-${year}.json`).then(r => r.json())
        .then((dm: Record<string, SchoolDetail>) => {
          if (cancelled) return;
          setAllDetail(dm);
          if (selSchool) setSchoolDetail(dm[slugify(selSchool)] || null); else setSchoolDetail(null);
          if (selCourse) {
            fetch(`/data/course-stats-${year}.json`).then(r => r.json())
              .then((stats: Record<string, CourseStats>) => { if (!cancelled) setCourseStats(stats[selCourse.code] || null); })
              .catch(() => {});
          } else setCourseStats(null);
          setLoading(false);
        }).catch(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [year, selSchool, selCourse, hasFilters]);

  useEffect(() => {
    if (selCourse && !selCourse.name && allCourses.length > 0) {
      const m = allCourses.find(c => c.code === selCourse.code);
      if (m) setSelCourse(m);
    }
  }, [allCourses, selCourse]);

  const handleYear = (y: string) => { setYear(y); syncUrl(y, selSchool, selCourse); };
  const handleSchool = (s: string | null) => { setSelSchool(s); syncUrl(year, s, selCourse); };
  const handleCourse = (c: CourseMeta | null) => { setSelCourse(c); syncUrl(year, selSchool, c); };
  const clearAll = () => { setSelSchool(null); setSelCourse(null); syncUrl(year, null, null); };

  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {!selSchool && !selCourse ? t("defaultTitle") : selSchool && selCourse ? `${selSchool} · ${selCourse.name}` : selSchool || selCourse?.name}
          </h1>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={year} onChange={e => handleYear(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/10">
              {ALL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {selSchool ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-sm">
                <School className="h-3.5 w-3.5 text-muted" />{selSchool}
                <button onClick={() => handleSchool(null)} className="text-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </span>
            ) : (
              <span className="text-xs text-muted/60">
                <School className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                Click a school below to filter
              </span>
            )}
            {selCourse ? (
              <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-sm">
                <BookOpen className="h-3.5 w-3.5 text-muted" />{selCourse.name}
                <button onClick={() => handleCourse(null)} className="text-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </span>
            ) : (
              <span className="text-xs text-muted/60">
                <BookOpen className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
                Click a course below to filter
              </span>
            )}
            {hasFilters && <button onClick={clearAll} className="text-xs text-muted hover:text-foreground flex items-center gap-1"><X className="h-3 w-3" />Clear all</button>}
          </div>
        </div>
      </section>

      {/* Content */}
      {loading && <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="text-xs text-muted py-2">Loading...</div></section>}
      {selSchool && selCourse ? <IntersectionView detail={schoolDetail} course={selCourse} stats={courseStats} year={year} /> :
       selSchool ? <SchoolView detail={schoolDetail} name={selSchool} year={year} slug={slugify(selSchool)} sparoData={sparoData} onCourse={handleCourse} /> :
       selCourse ? <CourseView course={selCourse} stats={courseStats} year={year} allDetail={allDetail} sparoData={sparoData} onSchool={handleSchool} /> :
       !loading && <DefaultView schools={schools} courses={courses} onSchool={handleSchool} onCourse={handleCourse} />}
    </div>
  );
}

function LoadingView() {
  return <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
    <div className="rounded-xl border border-border bg-surface p-16 text-center">
      <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      <p className="mt-2 text-sm text-muted">Loading...</p>
    </div>
  </section>;
}

// ─── Default View: Schools & Courses tabs ─────────────────────────────────────

function DefaultView({ schools, courses, onSchool, onCourse }: {
  schools: SchoolEntry[] | null; courses: { code: string; name: string; band6Count: number }[] | null;
  onSchool: (s: string) => void; onCourse: (c: CourseMeta) => void;
}) {
  const [tab, setTab] = useState<'schools' | 'courses'>('schools');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('band6Count');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const items = tab === 'schools' ? schools : courses;

  const filtered = useMemo(() => {
    if (!items) return [];
    let r = [...items];
    if (search) { const s = search.toLowerCase(); r = r.filter((x: { name: string }) => x.name.toLowerCase().includes(s)); }
    r.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'band6Count') cmp = a.band6Count - b.band6Count;
      else if (sortField === 'uniqueStudents') cmp = (a as SchoolEntry).uniqueStudents - (b as SchoolEntry).uniqueStudents;
      else if (sortField === 'stateRanks') cmp = (a as SchoolEntry).stateRanks - (b as SchoolEntry).stateRanks;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [items, search, sortField, sortDir]);

  const isSchool = tab === 'schools';

  return <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setTab('schools')} className={`px-3 py-1.5 text-sm font-medium ${isSchool ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>Schools</button>
            <button onClick={() => setTab('courses')} className={`px-3 py-1.5 text-sm font-medium border-l border-border ${!isSchool ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>Courses</button>
          </div>
          </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search list..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-border bg-surface py-1.5 pl-9 pr-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium text-muted">
        <div className="col-span-1">#</div>
        <div className={isSchool ? 'col-span-5' : 'col-span-9'} style={{ cursor:'pointer' }} onClick={() => { setSortField('name'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
          {isSchool ? 'School' : 'Course'} <SortIcon active={sortField==='name'} dir={sortDir} />
        </div>
        <div className="col-span-2 flex justify-end" style={{ cursor:'pointer' }} onClick={() => { setSortField('band6Count'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
          B6/E4 <SortIcon active={sortField==='band6Count'} dir={sortDir} />
        </div>
        {isSchool && <>
          <div className="col-span-2 flex justify-end" style={{ cursor:'pointer' }} onClick={() => { setSortField('uniqueStudents'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
            Students <SortIcon active={sortField==='uniqueStudents'} dir={sortDir} />
          </div>
          <div className="col-span-2 flex justify-end" style={{ cursor:'pointer' }} onClick={() => { setSortField('stateRanks'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
            Ranks <SortIcon active={sortField==='stateRanks'} dir={sortDir} />
          </div>
        </>}
      </div>

      {!items ? <div className="px-6 py-16 text-center"><p className="text-sm text-muted">Loading...</p></div> :
       filtered.length === 0 ? <div className="px-6 py-16 text-center"><p className="text-sm text-muted">No matches</p></div> :
       <div className="divide-y divide-border">
        {filtered.slice(0, 300).map((item, idx) => (
          <button key={isSchool ? item.name : (item as { code: string }).code}
            onClick={() => isSchool ? onSchool(item.name) : onCourse({ code: (item as { code: string }).code, name: item.name })}
            className="w-full text-left grid grid-cols-12 gap-4 px-6 py-3 hover:bg-surface-hover transition-colors">
            <div className="col-span-1 flex items-center"><span className="text-xs text-muted font-mono">{idx + 1}</span></div>
            <div className={isSchool ? 'col-span-5' : 'col-span-9'}><span className="text-sm font-medium">{item.name}</span></div>
            <div className="col-span-2 flex items-center justify-end">
              <span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">{item.band6Count.toLocaleString()}</span>
            </div>
            {isSchool && <>
              <div className="col-span-2 flex items-center justify-end"><span className="text-sm text-muted font-mono">{(item as SchoolEntry).uniqueStudents.toLocaleString()}</span></div>
              <div className="col-span-2 flex items-center justify-end"><span className="text-sm text-muted font-mono">{(item as SchoolEntry).stateRanks > 0 ? (item as SchoolEntry).stateRanks : '—'}</span></div>
            </>}
          </button>
        ))}
      </div>}

      <div className="border-t border-border px-6 py-2 text-xs text-muted">
        Showing {Math.min(filtered.length, 300)} of {filtered.length}
      </div>
    </div>
  </section>;
}

// ─── School View ──────────────────────────────────────────────────────────────

function SchoolView({ detail, name, year, slug, sparoData, onCourse }: {
  detail: SchoolDetail | null; name: string; year: string; slug: string;
  sparoData: Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null;
  onCourse: (c: CourseMeta) => void;
}) {
  const sparoSchool = sparoData?.[slug];
  const sparoSubjects = sparoSchool?.subjects || [];

  const sparoMap = useMemo(() => {
    const m = new Map<string, { school_average: number; state_average: number }>();
    for (const s of sparoSubjects) m.set(s.subject, { school_average: s.school_average, state_average: s.state_average });
    return m;
  }, [sparoSubjects]);

  const sparoRank = useMemo(() => {
    if (!sparoData || sparoSubjects.length === 0) return new Map<string, number>();
    const ranks = new Map<string, number>();
    for (const subj of sparoSubjects) {
      const averages = Object.entries(sparoData)
        .filter(([, s]) => s.subjects.some(sb => sb.subject === subj.subject))
        .map(([, s]) => s.subjects.find(sb => sb.subject === subj.subject)!)
        .sort((a, b) => b.school_average - a.school_average);
      const rank = averages.findIndex(a => a.school_average === subj.school_average) + 1;
      ranks.set(subj.subject, rank > 0 ? rank : 0);
    }
    return ranks;
  }, [sparoData, sparoSubjects]);

  const hasSparo = sparoSubjects.length > 0;
  const [tab, setTab] = useState<'subjects' | 'students'>('subjects');
  const [courseSearch, setCourseSearch] = useState('');

  const filteredCourses = useMemo(() => {
    if (!detail) return [];
    if (!courseSearch) return detail.courses;
    const q = courseSearch.toLowerCase();
    return detail.courses.filter(c => c.name.toLowerCase().includes(q));
  }, [detail, courseSearch]);

  if (!detail) return <EmptyView msg={`No data for ${name} in ${year}.`} />;

  return <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Band 6/E4" value={detail.stats.band6Count.toLocaleString()} />
      <StatCard label="Students" value={detail.stats.uniqueStudents.toLocaleString()} />
      <StatCard label="State Ranks" value={String(detail.stats.stateRanks)} />
      <StatCard label="All-rounders" value={String(detail.stats.allRounders)} />
    </div>

    <div className="flex items-center gap-2">
      <button onClick={() => setTab('subjects')}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'subjects' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>
        Subject Performance ({detail.courses.length})
      </button>
      <button onClick={() => setTab('students')}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'students' ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>
        Students ({detail.students.length})
      </button>
    </div>

    {tab === 'subjects' && (<>
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg font-semibold">Subject Performance ({detail.courses.length})</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search courses..." value={courseSearch}
            onChange={e => setCourseSearch(e.target.value)}
            className="w-48 rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
        </div>
      </div>
      {hasSparo && <p className="text-sm text-muted">Public school HSC marks from publicly available SPaRO reports. Ranked by school average.</p>}
    <div className="rounded-xl border border-border bg-surface overflow-hidden mt-3">
      <div className={`grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted`}>
        <div className={hasSparo ? 'col-span-3' : 'col-span-6'}>Course</div>
        <div className={`${hasSparo ? 'col-span-3' : 'col-span-3'} flex justify-end`}>B6/E4</div>
        <div className={`${hasSparo ? 'col-span-2' : 'col-span-3'} flex justify-end`}>State Ranks</div>
        {hasSparo && <div className="col-span-4 flex justify-end items-center gap-1">School Avg vs State (Gov) <button type="button" className="inline-flex cursor-help" title="Public school only. HSC marks from publicly available SPaRO reports. Ranked by school average within this course."><Info className="h-3.5 w-3.5 text-muted/70" /></button></div>}
      </div>
      <div className="divide-y divide-border">
        {filteredCourses.map(c => {
          const sp = sparoMap.get(c.name);
          const rk = sparoRank.get(c.name);
          return (
            <button key={c.code} onClick={() => onCourse({ code: c.code, name: c.name })} className="w-full text-left grid grid-cols-12 gap-3 px-5 py-3 hover:bg-surface-hover transition-colors">
              <div className={hasSparo ? 'col-span-3' : 'col-span-6'}><span className="text-sm font-medium">{c.name}</span></div>
              <div className={`${hasSparo ? 'col-span-3' : 'col-span-3'} flex justify-end`}><span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">{c.band6Count.toLocaleString()}</span></div>
              <div className={`${hasSparo ? 'col-span-2' : 'col-span-3'} flex justify-end gap-1 flex-wrap`}>
                {c.stateRanks.length > 0 ? c.stateRanks.map((r, i) => <span key={i} className="inline-flex items-center rounded-md bg-accent-dim px-1.5 py-0.5 text-xs font-mono text-muted">#{r}</span>) : <span className="text-sm text-muted/30 font-mono">—</span>}
              </div>
              {hasSparo && <div className="col-span-4 flex justify-end items-center gap-1">
                {sp ? <><span className="inline-flex items-center rounded-md bg-accent-dim px-1.5 py-0.5 text-xs font-mono font-medium">#{rk}</span><span className="text-xs font-mono text-muted">{sp.school_average.toFixed(1)}<span className="text-muted/40 mx-1">vs</span>{sp.state_average.toFixed(1)}</span></> : <span className="text-xs text-muted/20">—</span>}
              </div>}
            </button>
          );
        })}
      </div>
    </div>
    </>)}
    {tab === 'students' && (
    <div>
      <StudentsTable students={detail.students} onCourseClick={onCourse} highlightCourse={undefined} />
    </div>
    )}
  </div>;
}

// ─── Course View ──────────────────────────────────────────────────────────────

function CourseView({ course, stats, year, allDetail, sparoData, onSchool }: {
  course: CourseMeta; stats: CourseStats | null; year: string;
  allDetail: Record<string, SchoolDetail> | null;
  sparoData: Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null;
  onSchool: (s: string) => void;
}) {
  const stateRanks = useMemo(() => {
    if (!allDetail) return [] as { firstName: string; lastName: string; schoolName: string; rank: number }[];
    const r: { firstName: string; lastName: string; schoolName: string; rank: number }[] = [];
    for (const [, s] of Object.entries(allDetail)) for (const st of s.students) for (const c of st.courses)
      if (c.code===course.code && c.rank>0) r.push({ firstName:st.firstName, lastName:st.lastName, schoolName:s.name, rank:c.rank });
    return r.sort((a,b) => a.rank-b.rank);
  }, [allDetail, course.code]);

  const topSchools = useMemo(() => {
    if (!allDetail) return [] as { name: string; slug: string; band6Count: number }[];
    const r: { name: string; slug: string; band6Count: number }[] = [];
    for (const [slug, s] of Object.entries(allDetail)) { const ca = s.courses.find(c => c.code===course.code); if (ca && ca.band6Count>0) r.push({ name:s.name, slug, band6Count:ca.band6Count }); }
    return r.sort((a,b) => b.band6Count-a.band6Count);
  }, [allDetail, course.code]);

  const totalB6 = topSchools.reduce((s, ts) => s + ts.band6Count, 0);

  const [activeTab, setActiveTab] = useState<'top-schools' | 'state-ranks' | 'enrollment'>('top-schools');

  // Only auto-switch if current tab becomes unavailable
  useEffect(() => {
    if (activeTab === 'state-ranks' && stateRanks.length === 0) {
      setActiveTab('top-schools');
    }
  }, [stateRanks.length]);

  const tabs = [
    { id: 'top-schools' as const, label: 'Top Schools' },
    ...(stateRanks.length > 0 ? [{ id: 'state-ranks' as const, label: 'State Ranks' }] : []),
    ...(stats ? [{ id: 'enrollment' as const, label: 'Enrollment' }] : []),
  ];

  return <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Band 6/E4" value={totalB6.toLocaleString()} />
      <StatCard label="State Ranks" value={String(stateRanks.length)} />
      <StatCard label="Top Schools" value={String(topSchools.length)} />
      {stats && <StatCard label="Total Enrolled" value={(stats.male + stats.female + stats.non_binary).toLocaleString()} />}
    </div>

    {tabs.length > 1 && (
      <div className="flex items-center gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-foreground text-background' : 'text-muted hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>
    )}

    {activeTab === 'enrollment' && stats && <EnrollmentBlock stats={stats} />}

    {activeTab === 'top-schools' && (
      <TopSchoolsExpanded schools={topSchools} sparoData={sparoData} courseName={course.name} onSchool={onSchool} />
    )}

    {activeTab === 'state-ranks' && stateRanks.length > 0 && (
      <div>
        <h2 className="text-lg font-semibold mb-3">State Ranks</h2>
        <TableWrap>
          <TableHeader cols={['#','Student','School','Rank']} widths={['col-span-1','col-span-4','col-span-5','col-span-2']} aligns={['','','','justify-end']} />
          <div className="divide-y divide-border">
            {stateRanks.map((sr, idx) => (
              <div key={sr.lastName+sr.firstName+sr.rank} className="grid grid-cols-12 gap-3 px-5 py-3">
                <div className="col-span-1"><span className="text-xs text-muted font-mono">{idx+1}</span></div>
                <div className="col-span-4"><span className="text-sm font-medium truncate">{sr.lastName}, {sr.firstName}</span></div>
                <div className="col-span-5"><button onClick={() => onSchool(sr.schoolName)} className="text-sm hover:underline truncate">{sr.schoolName}</button></div>
                <div className="col-span-2 flex justify-end"><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-mono font-medium ${sr.rank===1?'border-green-600 bg-green-600 text-white':'border-blue-600 bg-blue-600 text-white'}`}>{sr.rank}</span></div>
              </div>
            ))}
          </div>
        </TableWrap>
      </div>
    )}
  </div>;
}

// ─── Intersection View: School + Course ───────────────────────────────────────

function IntersectionView({ detail, course, stats, year }: {
  detail: SchoolDetail | null; course: CourseMeta; stats: CourseStats | null; year: string;
}) {
  if (!detail) return <EmptyView msg={`No data for this combination in ${year}.`} />;

  const ca = detail.courses.find(c => c.code === course.code);
  const sts = detail.students.filter(st => st.courses.some(c => c.code === course.code));

  return <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Band 6/E4" value={ca ? String(ca.band6Count) : '0'} />
      <StatCard label="Students" value={String(sts.length)} />
      <StatCard label="State Ranks" value={ca ? String(ca.stateRanks.length) : '0'} />
    </div>
    <div>
      <h2 className="text-lg font-semibold mb-3">Students ({sts.length})</h2>
      <StudentsTable students={sts} highlightCourse={course.code} />
    </div>
  </div>;
}

// ─── Shared Components ────────────────────────────────────────────────────────

// ─── Shared Components ────────────────────────────────────────────────────────

// ─── Shared Components ────────────────────────────────────────────────────────

function TopSchoolsExpanded({ schools, sparoData, courseName, onSchool }: {
  schools: { name: string; slug: string; band6Count: number }[];
  sparoData: Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null;
  courseName: string; onSchool: (s: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? schools : schools.slice(0, 30);

  return <div>
    <h2 className="text-lg font-semibold mb-3">Top Schools</h2>
    {sparoData && <p className="text-sm text-muted mb-3">Public school HSC marks from publicly available SPaRO reports.</p>}
    <TableWrap>
      <TableHeader
        cols={sparoData ? ['#','School','B6/E4','School Avg vs State (Gov)'] : ['#','School','B6/E4']}
        widths={sparoData ? ['col-span-1','col-span-4','col-span-2','col-span-5'] : ['col-span-1','col-span-9','col-span-2']}
        aligns={['','','justify-end',sparoData?'justify-end':'']}
      />
      <div className="divide-y divide-border">
        {display.map((s, idx) => {
          const sp = sparoData?.[s.slug]?.subjects?.find(sb => sb.subject === courseName);
          const rk = sp ? (() => {
            const all = Object.entries(sparoData || {})
              .filter(([, sc]) => sc.subjects.some(sb => sb.subject === courseName))
              .map(([, sc]) => sc.subjects.find(sb => sb.subject === courseName)!)
              .sort((a, b) => b.school_average - a.school_average);
            return all.findIndex(a => a.school_average === sp.school_average) + 1;
          })() : null;
          return (
          <button key={s.slug} onClick={() => onSchool(s.name)} className="w-full text-left grid grid-cols-12 gap-3 px-5 py-3 hover:bg-surface-hover transition-colors">
            <div className="col-span-1"><span className="text-xs text-muted font-mono">{idx+1}</span></div>
            <div className={sparoData ? 'col-span-4' : 'col-span-9'}><span className="text-sm font-medium">{s.name}</span></div>
            <div className={`${sparoData ? 'col-span-2' : 'col-span-2'} flex justify-end`}><span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">{s.band6Count.toLocaleString()}</span></div>
            {sparoData && <div className="col-span-5 flex justify-end items-center gap-1">
              {sp ? <><span className="inline-flex items-center rounded-md bg-accent-dim px-1.5 py-0.5 text-xs font-mono font-medium">#{rk}</span><span className="text-xs font-mono text-muted">{sp.school_average.toFixed(1)}<span className="text-muted/40 mx-1">vs</span>{sp.state_average.toFixed(1)}</span></> : <span className="text-xs text-muted/20">—</span>}
            </div>}
          </button>
        );})}
      </div>
      {schools.length > 30 && (
        <div className="border-t border-border px-5 py-2 text-xs text-muted flex items-center justify-between">
          <span>Showing {display.length} of {schools.length}</span>
          <button onClick={() => setShowAll(v => !v)} className="hover:text-foreground">{showAll ? 'Show less' : `Show all ${schools.length}`}</button>
        </div>
      )}
    </TableWrap>
  </div>;
}

function StudentsTable({ students, highlightCourse, onCourseClick }: {
  students: StudentEntry[];
  highlightCourse?: string;
  onCourseClick?: (c: CourseMeta) => void;
}) {
  const [search, setSearch] = useState('');
  const [allRounder, setAllRounder] = useState(false);
  const [hasRank, setHasRank] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    let r = students;
    if (search) { const s = search.toLowerCase(); r = r.filter(st => `${st.firstName} ${st.lastName}`.toLowerCase().includes(s) || st.courses.some(c => c.name.toLowerCase().includes(s))); }
    if (allRounder) r = r.filter(st => st.isAllRounder);
    if (hasRank) r = r.filter(st => st.stateRankCount > 0);
    return r;
  }, [students, search, allRounder, hasRank]);

  const display = showAll ? filtered : filtered.slice(0, 50);

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-48 rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10" />
      </div>
      <span className="text-xs font-medium text-muted">Filters:</span>
      <button onClick={() => setAllRounder(v => !v)}
        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${allRounder ? 'border-foreground bg-foreground text-background' : 'border-border text-muted hover:text-foreground'}`}>All-rounders</button>
      <button onClick={() => setHasRank(v => !v)}
        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${hasRank ? 'border-foreground bg-foreground text-background' : 'border-border text-muted hover:text-foreground'}`}>Has state rank</button>
    </div>

    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
      <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-amber-400 shrink-0" /> All-rounder</span>
      <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0" /> State rank</span>
      <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-green-500 shrink-0" /> First in course</span>
      <span className="flex items-center gap-1.5 ml-auto">
        <span className="inline-flex items-center rounded-full border border-green-600 bg-green-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Course (#1)</span>
        <span className="inline-flex items-center rounded-full border border-blue-600 bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Course (#N)</span>
        <span className="inline-flex items-center rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">Course</span>
      </span>
    </div>

    <TableWrap>
      <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
        <div className="col-span-4">Student Name</div><div className="col-span-6">B6/E4 Courses</div><div className="col-span-1 flex justify-end">Count</div><div className="col-span-1 flex justify-end">Ranks</div>
      </div>
      <div className="divide-y divide-border">
        {display.map((st, idx) => (
          <div key={st.lastName+st.firstName+idx} className="grid grid-cols-12 gap-3 px-5 py-3">
            <div className="col-span-4 flex items-center gap-1.5 min-w-0">
              {st.isAllRounder && <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shrink-0" title="All-rounder" />}
              <span className="text-sm font-medium truncate">{st.lastName}, {st.firstName}</span>
              {st.stateRankCount > 0 && <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0" title="State rank" />}
              {st.courses.some(c => c.rank === 1) && <span className="inline-block h-2 w-2 rounded-full bg-green-500 shrink-0" title="First in course" />}
            </div>
            <div className="col-span-6 flex flex-wrap items-center gap-1">
              {st.courses.map((c, i) => (
                onCourseClick
                  ? <button key={c.code+i} onClick={() => onCourseClick({ code: c.code, name: c.name })}
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${c.rank===1?'border-green-600 bg-green-600 text-white':c.rank>0?'border-blue-600 bg-blue-600 text-white':'border-border text-foreground/70 hover:bg-surface-hover'}`}>
                      {c.name}{c.rank>0 && <span className="ml-1 font-mono">(#{c.rank})</span>}
                    </button>
                  : <span key={c.code+i}
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${c.rank===1?'border-green-600 bg-green-600 text-white':c.rank>0?'border-blue-600 bg-blue-600 text-white':highlightCourse && c.code===highlightCourse?'border-foreground/30 bg-foreground/10 text-foreground':'border-border text-foreground/70'}`}>
                      {c.name}{c.rank>0 && <span className="ml-1 font-mono">(#{c.rank})</span>}
                    </span>
              ))}
            </div>
            <div className="col-span-1 flex items-center justify-end"><span className="text-sm text-muted font-mono">{st.b6Count}</span></div>
            <div className="col-span-1 flex items-center justify-end"><span className="text-sm text-muted font-mono">{st.stateRankCount||'0'}</span></div>
          </div>
        ))}
      </div>
      {filtered.length > 50 && (
        <div className="border-t border-border px-5 py-2 text-xs text-muted flex items-center justify-between">
          <span>Showing {display.length} of {filtered.length}</span>
          <button onClick={() => setShowAll(v => !v)} className="hover:text-foreground">
            {showAll ? 'Show less' : `Show all ${filtered.length}`}
          </button>
        </div>
      )}
    </TableWrap>
  </div>;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-surface p-5"><p className="text-xs text-muted font-medium">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}

function EmptyView({ msg }: { msg: string }) {
  return <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
    <div className="rounded-xl border border-border bg-surface p-16 text-center"><p className="text-sm text-muted">{msg}</p></div>
  </section>;
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface overflow-hidden">{children}</div>;
}

function TableHeader({ cols, widths, aligns }: { cols: string[]; widths: string[]; aligns: string[] }) {
  return <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
    {cols.map((c, i) => <div key={i} className={`${widths[i]} ${aligns[i] ? 'flex '+aligns[i] : ''}`}>{c}</div>)}
  </div>;
}

function EnrollmentBlock({ stats }: { stats: CourseStats }) {
  const total = stats.male + stats.female + stats.non_binary;
  const pct = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0;
  return <div className="rounded-xl border border-border bg-surface overflow-hidden">
    <div className="px-5 py-5">
      <h3 className="text-sm font-medium mb-3">Enrollment Distribution</h3>
      <div className="flex h-4 rounded overflow-hidden bg-accent-dim mb-3">
        <div className="h-full bg-foreground" style={{ width: `${Math.max(pct(stats.female), 0.5)}%`, opacity: 0.8 }} />
        <div className="h-full bg-foreground" style={{ width: `${Math.max(pct(stats.male), 0.5)}%`, opacity: 0.5 }} />
        {stats.non_binary > 0 && <div className="h-full bg-foreground" style={{ width: `${Math.max(pct(stats.non_binary), 0.5)}%`, opacity: 0.22 }} />}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {[{ label:'Female', value:stats.female, o:0.8 },{ label:'Male', value:stats.male, o:0.5 },
           ...(stats.non_binary>0?[{ label:'Non-binary', value:stats.non_binary, o:0.22 }]:[])]
          .map(item =>
            <span key={item.label} className="inline-flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-sm shrink-0 bg-foreground" style={{ opacity:item.o }} />
              <span className="text-muted">{item.label}</span>
              <span className="font-mono">{item.value.toLocaleString()}</span>
              <span className="text-muted/50">({pct(item.value)}%)</span></span>
          )}
      </div>
    </div>
    {stats.bands && <BandDistro bands={stats.bands} />}
  </div>;
}

function BandDistro({ bands }: { bands: Record<string, number> }) {
  const isExt = Object.keys(bands).some(k => k.includes('E'));
  const order = isExt ? ['E4','E3','E2','E1'] as const : ['6','5','4','3','2','1'] as const;
  const opacities = isExt ? [0.8, 0.64, 0.48, 0.34] : [0.8, 0.64, 0.48, 0.34, 0.22, 0.12];
  return <div className="border-t border-border px-5 py-5">
    <h3 className="text-sm font-medium mb-3">Band Distribution</h3>
    <div className="flex h-4 rounded overflow-hidden bg-accent-dim mb-3">
      {order.map((band, i) => {
        const pct = bands[`Band ${band}`] || 0;
        return <div key={band} className="h-full bg-foreground" style={{ width: `${Math.max(pct, 0.5)}%`, opacity: opacities[i] }} />;
      })}
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {order.map((band, i) => {
        const pct = bands[`Band ${band}`] || 0;
        return <span key={band} className="inline-flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-sm shrink-0 bg-foreground" style={{ opacity: opacities[i] }} />
          <span className="text-muted">Band {band}</span>
          <span className="font-mono">{pct.toFixed(1)}%</span>
        </span>;
      })}
    </div>
  </div>;
}
