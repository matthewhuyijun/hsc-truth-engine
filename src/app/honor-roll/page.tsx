'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface SchoolEntry {
  name: string;
  band6Count: number;
  uniqueStudents: number;
  stateRanks: number;
}

interface CourseEntry {
  code: string;
  name: string;
  band6Count: number;
}

type Tab = 'schools' | 'courses';
type SortField = 'name' | 'band6Count' | 'uniqueStudents' | 'stateRanks';
type SortDir = 'asc' | 'desc';

const AVAILABLE_YEARS = ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp className="h-3.5 w-3.5 opacity-25" />;
  return dir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5" />
    : <ChevronDown className="h-3.5 w-3.5" />;
}

export default function HonorRollPage() {
  return (
    <Suspense fallback={<HonorRollSkeleton />}>
      <HonorRollContent />
    </Suspense>
  );
}

function HonorRollSkeleton() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-5 w-5 bg-surface rounded animate-pulse" />
            <div className="h-4 w-36 bg-surface rounded animate-pulse" />
          </div>
          <div className="h-9 w-48 bg-surface rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-surface rounded animate-pulse" />
        </div>
      </section>

      <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-40 bg-surface rounded-lg animate-pulse" />
              <div className="h-9 w-20 bg-surface rounded-lg animate-pulse" />
              <div className="h-4 w-24 bg-surface rounded animate-pulse" />
            </div>
            <div className="h-10 w-full sm:w-64 bg-surface rounded-lg animate-pulse" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium text-muted">
            <div className="col-span-1">#</div>
            <div className="col-span-5">School</div>
            <div className="col-span-2 flex justify-end">B6/E4</div>
            <div className="col-span-2 flex justify-end">Students</div>
            <div className="col-span-2 flex justify-end">Ranks</div>
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-3">
                <div className="col-span-1">
                  <div className="h-4 w-6 bg-surface rounded animate-pulse" />
                </div>
                <div className="col-span-5">
                  <div className="h-4 w-48 bg-surface rounded animate-pulse" />
                </div>
                <div className="col-span-2 flex justify-end">
                  <div className="h-5 w-12 bg-surface rounded animate-pulse" />
                </div>
                <div className="col-span-2 flex justify-end">
                  <div className="h-4 w-10 bg-surface rounded animate-pulse" />
                </div>
                <div className="col-span-2 flex justify-end">
                  <div className="h-4 w-6 bg-surface rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-6 py-3">
            <div className="h-4 w-96 bg-surface rounded animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
}

function HonorRollContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab || 'schools';
  const yearParam = searchParams.get('year') || '2025';

  const [tab, setTab] = useState<Tab>(tabParam === 'courses' ? 'courses' : 'schools');
  const [year, setYear] = useState(yearParam);
  const [schools, setSchools] = useState<SchoolEntry[] | null>(null);
  const [courses, setCourses] = useState<CourseEntry[] | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('band6Count');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;
    if (tab === 'schools') {
      setCourses(null);
      fetch(`/data/schools-${year}.json`)
        .then(res => res.json())
        .then(data => { if (!cancelled) setSchools(data); })
        .catch(() => { if (!cancelled) setSchools([]); });
    } else {
      setSchools(null);
      fetch(`/data/courses-${year}.json`)
        .then(res => res.json())
        .then(data => { if (!cancelled) setCourses(data); })
        .catch(() => { if (!cancelled) setCourses([]); });
    }
    return () => { cancelled = true; };
  }, [year, tab]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const loading = tab === 'schools' ? schools === null : courses === null;

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    setSearch('');
    setSortField(newTab === 'schools' ? 'band6Count' : 'band6Count');
    setSortDir('desc');
    router.push(`/honor-roll?tab=${newTab}&year=${year}`, { scroll: false });
  };

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    setSearch('');
    router.push(`/honor-roll?tab=${tab}&year=${newYear}`, { scroll: false });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'band6Count' ? 'desc' : 'asc');
    }
  };

  const filteredSchools = useMemo(() => {
    let result = [...(schools || [])];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(s));
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'band6Count') cmp = a.band6Count - b.band6Count;
      else if (sortField === 'uniqueStudents') cmp = a.uniqueStudents - b.uniqueStudents;
      else if (sortField === 'stateRanks') cmp = a.stateRanks - b.stateRanks;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [schools, search, sortField, sortDir]);

  const filteredCourses = useMemo(() => {
    let result = [...(courses || [])];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(s));
    }
    result.sort((a, b) => {
      return sortDir === 'asc'
        ? a.band6Count - b.band6Count
        : b.band6Count - a.band6Count;
    });
    return result;
  }, [courses, search, sortDir]);

  function schoolSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function courseSlug(code: string): string {
    return code;
  }

  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="flex items-center gap-3 mb-3">
            <Award className="h-5 w-5 text-muted" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Distinguished Achievers
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Honor Roll
          </h1>
          <p className="mt-2 text-sm text-muted">
            Band 6 achievements across NSW schools, 2017–2025
          </p>
        </div>
      </section>

      <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => handleTabChange('schools')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === 'schools'
                      ? 'bg-foreground text-background'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Schools
                </button>
                <button
                  onClick={() => handleTabChange('courses')}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-border ${
                    tab === 'courses'
                      ? 'bg-foreground text-background'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Courses
                </button>
              </div>

              <select
                value={year}
                onChange={(e) => handleYearChange(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium
                  focus:outline-none focus:ring-2 focus:ring-foreground/10"
              >
                {AVAILABLE_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <span className="text-xs text-muted">
                {tab === 'schools'
                  ? `${filteredSchools.length.toLocaleString()} schools`
                  : `${filteredCourses.length.toLocaleString()} courses`}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder={tab === 'schools' ? 'Search schools...' : 'Search courses...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm
                  placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 sm:w-64"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {tab === 'schools' ? (
            <>
              <div className="grid grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium text-muted">
                <div className="col-span-1">#</div>
                <div
                  className="col-span-5 flex items-center gap-1 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort('name')}
                >
                  School
                  <SortIcon active={sortField === 'name'} dir={sortDir} />
                </div>
                <div
                  className="col-span-2 flex items-center justify-end gap-1 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort('band6Count')}
                >
                  B6/E4
                  <SortIcon active={sortField === 'band6Count'} dir={sortDir} />
                </div>
                <div
                  className="col-span-2 flex items-center justify-end gap-1 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort('uniqueStudents')}
                >
                  Students
                  <SortIcon active={sortField === 'uniqueStudents'} dir={sortDir} />
                </div>
                <div
                  className="col-span-2 flex items-center justify-end gap-1 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort('stateRanks')}
                >
                  Ranks
                  <SortIcon active={sortField === 'stateRanks'} dir={sortDir} />
                </div>
              </div>

              {loading ? (
                <div className="px-6 py-16 text-center">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                  <p className="mt-2 text-sm text-muted">Loading...</p>
                </div>
              ) : filteredSchools.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-sm text-muted">No schools found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredSchools.slice(0, 300).map((school, idx) => (
                    <Link
                      key={`${school.name}-${idx}`}
                      href={`/honor-roll/school/${schoolSlug(school.name)}?year=${year}`}
                      className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-surface-hover transition-colors"
                    >
                      <div className="col-span-1 flex items-center">
                        <span className="text-xs text-muted font-mono">{idx + 1}</span>
                      </div>
                      <div className="col-span-5 flex items-center">
                        <span className="text-sm font-medium">{school.name}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">
                          {school.band6Count.toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <span className="text-sm text-muted font-mono">
                          {school.uniqueStudents.toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <span className="text-sm text-muted font-mono">
                          {school.stateRanks > 0 ? school.stateRanks : '—'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {filteredSchools.length > 300 && (
                <div className="border-t border-border px-6 py-3 text-center">
                  <p className="text-xs text-muted">
                    Showing top 300 of {filteredSchools.length.toLocaleString()} schools.
                    Use search to find specific schools.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium text-muted">
                <div className="col-span-1">#</div>
                <div className="col-span-9 flex items-center gap-1">
                  Course
                </div>
                <div
                  className="col-span-2 flex items-center justify-end gap-1 cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => handleSort('band6Count')}
                >
                  B6/E4
                  <SortIcon active={sortField === 'band6Count'} dir={sortDir} />
                </div>
              </div>

              {loading ? (
                <div className="px-6 py-16 text-center">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                  <p className="mt-2 text-sm text-muted">Loading...</p>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-sm text-muted">No courses found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredCourses.map((course, idx) => (
                    <Link
                      key={course.code}
                      href={`/honor-roll/course/${courseSlug(course.code)}?year=${year}`}
                      className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-surface-hover transition-colors"
                    >
                      <div className="col-span-1 flex items-center">
                        <span className="text-xs text-muted font-mono">{idx + 1}</span>
                      </div>
                      <div className="col-span-9 flex items-center">
                        <span className="text-sm font-medium">{course.name}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">
                          {course.band6Count.toLocaleString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="border-t border-border px-6 py-3">
            <p className="text-xs text-muted">
              Data sourced from NESA official publications. Band 6 = Distinguished Achievers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
