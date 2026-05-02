'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Trophy, Search } from 'lucide-react';
import { getRenameHistory } from '@/lib/course-aliases';

const AVAILABLE_YEARS = ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
const ALL_YEARS = 'all';
type YearValue = 'all' | string;

interface YearData {
  year: number;
  band6Count: number;
}

interface CourseData {
  code: string;
  name: string;
  allNames?: string[];
  years: YearData[];
}

interface StudentCourse {
  code: string;
  name: string;
  rank: number;
}

interface StudentEntry {
  firstName: string;
  lastName: string;
  courses: StudentCourse[];
  b6Count: number;
  stateRankCount: number;
  isAllRounder: boolean;
}

interface CourseAggregate {
  code: string;
  name: string;
  band6Count: number;
  stateRanks: number[];
}

interface SchoolDetail {
  name: string;
  stats: {
    band6Count: number;
    uniqueStudents: number;
    stateRanks: number;
    allRounders: number;
  };
  students: StudentEntry[];
  courses: CourseAggregate[];
}

interface StateRankEntry {
  firstName: string;
  lastName: string;
  schoolName: string;
  rank: number;
}

interface SchoolB6Entry {
  name: string;
  slug: string;
  band6Count: number;
}

interface B6StudentEntry {
  firstName: string;
  lastName: string;
  schoolName: string;
  schoolSlug: string;
}

interface CourseStats {
  name: string;
  total: number;
  male: number;
  female: number;
  non_binary: number;
  bands?: Record<string, number>;
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<CourseDetailSkeleton />}>
      <CourseDetailContent params={params} />
    </Suspense>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-surface rounded animate-pulse" />
            <div className="h-3 w-3 bg-surface rounded animate-pulse" />
            <div className="h-5 w-16 bg-surface rounded animate-pulse" />
            <div className="h-3 w-3 bg-surface rounded animate-pulse" />
            <div className="h-5 w-40 bg-surface rounded animate-pulse" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
          <div className="space-y-3">
            <div className="h-9 w-64 bg-surface rounded animate-pulse" />
            <div className="h-4 w-48 bg-surface rounded animate-pulse" />
          </div>
        </div>
      </section>

      <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-7 w-14 bg-surface rounded animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-5">
              <div className="h-3 w-16 bg-surface rounded animate-pulse mb-2" />
              <div className="h-7 w-20 bg-surface rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
        <div className="h-6 w-48 bg-surface rounded animate-pulse mb-4" />
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium text-muted">
            <div className="col-span-1">#</div>
            <div className="col-span-8">School</div>
            <div className="col-span-3 flex justify-end">B6/E4</div>
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-3">
                <div className="col-span-1">
                  <div className="h-4 w-6 bg-surface rounded animate-pulse" />
                </div>
                <div className="col-span-8">
                  <div className="h-4 w-56 bg-surface rounded animate-pulse" />
                </div>
                <div className="col-span-3 flex justify-end">
                  <div className="h-5 w-10 bg-surface rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function CourseDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resolvedParams, setResolvedParams] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const yearParam = searchParams.get('year') || '2025';
  const currentYear: YearValue = yearParam === ALL_YEARS ? ALL_YEARS : yearParam;
  const isAllYears = currentYear === ALL_YEARS;

  const [allCourseData, setAllCourseData] = useState<CourseData[] | null>(null);
  const [schoolDetailMap, setSchoolDetailMap] = useState<Record<string, SchoolDetail> | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!resolvedParams) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(false);
    setSchoolDetailMap(null);
    setCourseStats(null);

    if (isAllYears) {
      fetch('/data/courses.json')
        .then(r => r.json())
        .then((data: CourseData[]) => {
          if (cancelled) return;
          setAllCourseData(data);
          const found = data.find((c: CourseData) => c.code === resolvedParams.slug);
          if (!found) setNotFound(true);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) { setError(true); setLoading(false); }
        });
    } else {
      Promise.all([
        fetch('/data/courses.json').then(r => r.json()),
        fetch(`/data/school-detail-${currentYear}.json`).then(r => r.json()),
        fetch(`/data/course-stats-${currentYear}.json`).then(r => r.json().catch(() => null)),
      ])
        .then(([allData, detailData, statsData]) => {
          if (cancelled) return;
          setAllCourseData(allData);
          setSchoolDetailMap(detailData);
          if (statsData && resolvedParams?.slug) {
            setCourseStats(statsData[resolvedParams.slug] || null);
          }
          const found = allData.find((c: CourseData) => c.code === resolvedParams.slug);
          if (!found) setNotFound(true);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) { setError(true); setLoading(false); }
        });
    }

    return () => { cancelled = true; };
  }, [currentYear, resolvedParams, isAllYears]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const courseData = useMemo(() => {
    if (!resolvedParams || !allCourseData) return null;
    return allCourseData.find((c: CourseData) => c.code === resolvedParams.slug) || null;
  }, [allCourseData, resolvedParams]);

  const renameHistory = useMemo(() => {
    if (!resolvedParams) return null;
    return getRenameHistory(resolvedParams.slug);
  }, [resolvedParams]);

  const stateRanks = useMemo((): StateRankEntry[] => {
    if (!schoolDetailMap || !resolvedParams) return [];
    const results: StateRankEntry[] = [];
    const courseCode = resolvedParams.slug;
    for (const [, school] of Object.entries(schoolDetailMap)) {
      for (const student of school.students) {
        for (const course of student.courses) {
          if (course.code === courseCode && course.rank > 0) {
            results.push({
              firstName: student.firstName,
              lastName: student.lastName,
              schoolName: school.name,
              rank: course.rank,
            });
          }
        }
      }
    }
    results.sort((a, b) => a.rank - b.rank);
    return results;
  }, [schoolDetailMap, resolvedParams]);

  const b6Students = useMemo((): B6StudentEntry[] => {
    if (!schoolDetailMap || !resolvedParams) return [];
    const results: B6StudentEntry[] = [];
    const courseCode = resolvedParams.slug;
    const seen = new Set<string>();
    for (const [schoolSlug, school] of Object.entries(schoolDetailMap)) {
      for (const student of school.students) {
        for (const course of student.courses) {
          if (course.code === courseCode) {
            const key = `${student.lastName}|${student.firstName}|${schoolSlug}`;
            if (seen.has(key)) continue;
            seen.add(key);
            results.push({
              firstName: student.firstName,
              lastName: student.lastName,
              schoolName: school.name,
              schoolSlug,
            });
            break;
          }
        }
      }
    }
    results.sort((a, b) => {
      const ln = a.lastName.localeCompare(b.lastName);
      if (ln !== 0) return ln;
      return a.firstName.localeCompare(b.firstName);
    });
    return results;
  }, [schoolDetailMap, resolvedParams]);

  const topSchools = useMemo((): SchoolB6Entry[] => {
    if (!schoolDetailMap || !resolvedParams) return [];
    const results: SchoolB6Entry[] = [];
    const courseCode = resolvedParams.slug;
    for (const [slug, school] of Object.entries(schoolDetailMap)) {
      const ca = school.courses.find(c => c.code === courseCode);
      if (ca && ca.band6Count > 0) {
        results.push({
          name: school.name,
          slug,
          band6Count: ca.band6Count,
        });
      }
    }
    results.sort((a, b) => b.band6Count - a.band6Count);
    return results;
  }, [schoolDetailMap, resolvedParams]);

  const totalStateRanks = useMemo(() => stateRanks.length, [stateRanks]);

  const handleYearSelect = (y: YearValue) => {
    if (!resolvedParams) return;
    const params = new URLSearchParams();
    params.set('year', y);
    router.push(`/honor-roll/course/${resolvedParams.slug}?${params.toString()}`, { scroll: false });
  };

  if (!resolvedParams) return null;

  const currentYearB6Count = courseData?.years.find(
    y => y.year === parseInt(currentYear)
  )?.band6Count || null;

  const allYearsTotalB6 = courseData
    ? courseData.years.reduce((sum, y) => sum + y.band6Count, 0)
    : 0;

  return (
    <div className="min-h-screen">
      <HeaderSection
        courseData={courseData}
        loading={loading}
        notFound={notFound}
        error={error}
        currentYear={currentYear}
        yearB6Count={currentYearB6Count}
        allYearsTotalB6={allYearsTotalB6}
        totalStateRanks={totalStateRanks}
        renameHistory={renameHistory}
        courseStats={courseStats}
      />

      {!loading && !notFound && !error && courseData && (
        <>
          <YearTabBar currentYear={currentYear} onSelect={handleYearSelect} />

          {isAllYears ? (
            <div className="mx-auto max-w-7xl divide-y divide-border">
              <YearBreakdownSection courseData={courseData} courseCode={resolvedParams.slug} />
              <TopSchoolsOverTimeSection courseCode={resolvedParams.slug} />
            </div>
          ) : (
            <div className="mx-auto max-w-7xl divide-y divide-border">
              {courseStats && (
                <CourseEnrollmentSection courseStats={courseStats} year={currentYear} />
              )}
              <TopSchoolsSection schools={topSchools} year={currentYear} />
              <StateRanksSection stateRanks={stateRanks} year={currentYear} />
              <Band6ListSection students={b6Students} year={currentYear} />
            </div>
          )}

          <Footer />
        </>
      )}
    </div>
  );
}

function HeaderSection({
  courseData,
  loading,
  notFound,
  error,
  currentYear,
  yearB6Count,
  allYearsTotalB6,
  totalStateRanks,
  renameHistory,
  courseStats,
}: {
  courseData: CourseData | null;
  loading: boolean;
  notFound: boolean;
  error: boolean;
  currentYear: YearValue;
  yearB6Count: number | null;
  allYearsTotalB6: number;
  totalStateRanks: number;
  renameHistory: { name: string; years: string }[] | null;
  courseStats: CourseStats | null;
}) {
  const yearLabel = currentYear === ALL_YEARS ? '2017–2025' : currentYear;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center gap-2 text-base text-muted/70">
          <Link href="/honor-roll" className="hover:text-foreground transition-colors">
            Honor Roll
          </Link>
          <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-muted/40" />
          <Link
            href={`/honor-roll?year=${currentYear === ALL_YEARS ? '2025' : currentYear}`}
            className="hover:text-foreground transition-colors"
          >
            Courses
          </Link>
          <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-muted/40" />
          <span className="text-foreground/80 font-medium truncate">
            {loading ? '...' : courseData?.name || ''}
          </span>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
        {loading ? (
          <div className="space-y-3">
            <div className="h-9 w-64 bg-surface rounded" />
            <div className="h-4 w-48 bg-surface rounded" />
          </div>
        ) : notFound ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Course Not Found</h1>
            <p className="mt-2 text-sm text-muted">
              We couldn&apos;t find this course. Try browsing from the Courses tab.
            </p>
          </>
        ) : error ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted">
              Failed to load course data. Please try again.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight">
              {courseData?.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {yearLabel} HSC Distinguished Achievers
            </p>

            {renameHistory && (
              <div className="mt-4 rounded-lg border border-border bg-accent-dim px-4 py-3">
                <p className="text-xs text-muted mb-1">This course has been renamed:</p>
                {renameHistory.map((r, i) => (
                  <span key={r.name} className="text-sm">
                    {r.name} ({r.years})
                    {i < renameHistory.length - 1 && (
                      <span className="mx-2 text-muted">→</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <div className="text-3xl font-bold font-mono tracking-tight">
                  {currentYear === ALL_YEARS
                    ? allYearsTotalB6.toLocaleString()
                    : yearB6Count?.toLocaleString() || '—'}
                </div>
                <div className="mt-1 text-xs text-muted font-medium">
                  B6/E4
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold font-mono tracking-tight">
                  {currentYear === ALL_YEARS ? '—' : totalStateRanks.toLocaleString() || '—'}
                </div>
                <div className="mt-1 text-xs text-muted font-medium">
                  State Ranks
                </div>
              </div>
              {courseStats && (
                <div>
                  <div className="text-3xl font-bold font-mono tracking-tight">
                    {courseStats.total.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-muted font-medium">
                    Enrollment
                  </div>
                </div>
              )}
              <div>
                <div className="text-3xl font-bold font-mono tracking-tight">
                  {courseData?.years.length.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-muted font-medium">
                  Years of Data
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function YearTabBar({
  currentYear,
  onSelect,
}: {
  currentYear: YearValue;
  onSelect: (year: YearValue) => void;
}) {
  return (
    <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => onSelect(ALL_YEARS)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              currentYear === ALL_YEARS
                ? 'bg-foreground text-background'
                : 'text-muted hover:text-foreground hover:bg-surface-hover'
            }`}
          >
            All
          </button>
          {AVAILABLE_YEARS.map(y => (
            <button
              key={y}
              onClick={() => onSelect(y)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                currentYear === y
                  ? 'bg-foreground text-background'
                  : 'text-muted hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 1: Top Schools ─────────────────────────────────────────────────

function TopSchoolsSection({
  schools,
  year,
}: {
  schools: SchoolB6Entry[];
  year: string;
}) {
  const INITIAL_COUNT = 30;
  const [showAll, setShowAll] = useState(false);
  const displaySchools = showAll ? schools : schools.slice(0, INITIAL_COUNT);

  if (schools.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Top Schools</h2>
        <p className="mt-1 text-sm text-muted">
          {schools.length} school{schools.length !== 1 ? 's' : ''} with at least one B6/E4 in this course during {year}.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
          <div className="col-span-1">#</div>
          <div className="col-span-9">School</div>
          <div className="col-span-2 flex justify-end">B6/E4</div>
        </div>

        <div className="divide-y divide-border">
          {displaySchools.map((school, idx) => (
            <Link
              key={school.slug}
              href={`/honor-roll/school/${school.slug}?year=${year}`}
              className="grid grid-cols-12 gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
            >
              <div className="col-span-1 flex items-center">
                <span className="text-xs text-muted font-mono">{idx + 1}</span>
              </div>
              <div className="col-span-9 flex items-center min-w-0">
                <span className="text-sm font-medium truncate">{school.name}</span>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">
                  {school.band6Count.toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="border-t border-border px-5 py-2 text-xs text-muted flex items-center justify-between">
          <span>
            {displaySchools.length} of {schools.length} school{schools.length !== 1 ? 's' : ''}
          </span>
          {schools.length > INITIAL_COUNT && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${schools.length}`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: State Ranks ─────────────────────────────────────────────────

function StateRanksSection({
  stateRanks,
  year,
}: {
  stateRanks: StateRankEntry[];
  year: string;
}) {
  if (stateRanks.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">State Ranks</h2>
        <p className="mt-1 text-sm text-muted">
          Top {stateRanks.length} student{stateRanks.length !== 1 ? 's' : ''} in this course for {year}.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Student</div>
          <div className="col-span-5">School</div>
          <div className="col-span-2 flex justify-end">Rank</div>
        </div>

        <div className="divide-y divide-border">
          {stateRanks.map((entry, idx) => (
            <div
              key={`${entry.lastName}-${entry.firstName}-${entry.rank}`}
              className="grid grid-cols-12 gap-3 px-5 py-3"
            >
              <div className="col-span-1 flex items-center">
                <span className="text-xs text-muted font-mono">{idx + 1}</span>
              </div>
              <div className="col-span-4 flex items-center min-w-0">
                <span className="text-sm font-medium truncate">
                  {entry.firstName} {entry.lastName}
                </span>
              </div>
              <div className="col-span-5 flex items-center min-w-0">
                <Link
                  href={`/honor-roll/school/${slugify(entry.schoolName)}?year=${year}`}
                  className="text-sm text-foreground hover:underline underline-offset-4 transition-colors truncate"
                >
                  {entry.schoolName}
                </Link>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">
                  {entry.rank}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-5 py-2 text-xs text-muted">
          {stateRanks.length} state rank{stateRanks.length !== 1 ? 's' : ''}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: B6/E4 List ──────────────────────────────────────────────────

function Band6ListSection({
  students,
  year,
}: {
  students: B6StudentEntry[];
  year: string;
}) {
  const [search, setSearch] = useState('');
  const INITIAL_COUNT = 30;
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return students;
    const s = search.toLowerCase();
    return students.filter(
      stu =>
        `${stu.firstName} ${stu.lastName}`.toLowerCase().includes(s) ||
        stu.schoolName.toLowerCase().includes(s)
    );
  }, [students, search]);

  const displayStudents = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);

  if (students.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Band 6 / E4 List</h2>
        <p className="mt-1 text-sm text-muted">
          All {students.length} student{students.length !== 1 ? 's' : ''} who achieved a B6/E4 in this course during {year}.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search student or school..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-sm
              placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
        </div>
        {search && (
          <span className="text-xs text-muted">
            {filtered.length} of {students.length}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
          <div className="col-span-5">Student</div>
          <div className="col-span-7">School</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted">No students match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayStudents.map((entry) => (
              <div
                key={`${entry.lastName}-${entry.firstName}-${entry.schoolSlug}`}
                className="grid grid-cols-12 gap-3 px-5 py-3"
              >
                <div className="col-span-5 flex items-center min-w-0">
                  <span className="text-sm font-medium truncate">
                    {entry.firstName} {entry.lastName}
                  </span>
                </div>
                <div className="col-span-7 flex items-center min-w-0">
                  <Link
                    href={`/honor-roll/school/${entry.schoolSlug}?year=${year}`}
                    className="text-sm text-foreground hover:underline underline-offset-4 transition-colors truncate"
                  >
                    {entry.schoolName}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border px-5 py-2 text-xs text-muted flex items-center justify-between">
          <span>
            {displayStudents.length} of {filtered.length} student{filtered.length !== 1 ? 's' : ''}
            {filtered.length < students.length && (
              <span className="text-muted/60"> (filtered from {students.length})</span>
            )}
          </span>
          {filtered.length > INITIAL_COUNT && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${filtered.length}`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── All Years: Year Breakdown ──────────────────────────────────────────────

function YearBreakdownSection({
  courseData,
  courseCode,
}: {
  courseData: CourseData;
  courseCode: string;
}) {
  const sortedYears = useMemo(
    () => [...courseData.years].sort((a, b) => b.year - a.year),
    [courseData.years]
  );

  const maxB6 = useMemo(
    () => Math.max(...courseData.years.map(y => y.band6Count), 1),
    [courseData.years]
  );

  return (
    <section className="px-4 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Year by Year</h2>
        <p className="mt-1 text-sm text-muted">
          B6/E4 counts across all available years. Click a year to see details.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-end gap-1 h-28">
            {[...sortedYears].reverse().map(y => {
              const heightPct = maxB6 > 0 ? (y.band6Count / maxB6) * 100 : 0;
              return (
                <Link
                  key={y.year}
                  href={`/honor-roll/course/${courseCode}?year=${y.year}`}
                  className="flex-1 flex flex-col items-center gap-1 group min-w-0"
                >
                  <span className="text-xs text-muted font-mono group-hover:text-foreground transition-colors">
                    {y.band6Count}
                  </span>
                  <div
                    className="w-full rounded-t-sm bg-foreground/15 group-hover:bg-foreground/30 transition-colors min-h-[4px]"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                  <span className="text-xs text-muted group-hover:text-foreground transition-colors">
                    {y.year}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border px-5 py-3">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">Details</span>
        </div>

        <div className="divide-y divide-border">
          {sortedYears.map(y => (
            <Link
              key={y.year}
              href={`/honor-roll/course/${courseCode}?year=${y.year}`}
              className="grid grid-cols-12 gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
            >
              <div className="col-span-3 flex items-center">
                <span className="text-sm font-mono font-medium">{y.year}</span>
              </div>
              <div className="col-span-6 flex items-center">
                <div className="h-2 flex-1 rounded-full bg-accent-dim overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/30"
                    style={{ width: `${Math.min(100, (y.band6Count / maxB6) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="col-span-3 flex items-center justify-end">
                <span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">
                  {y.band6Count.toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="border-t border-border px-5 py-2 text-xs text-muted">
          {sortedYears.length} year{sortedYears.length !== 1 ? 's' : ''} of data
        </div>
      </div>
    </section>
  );
}

// ─── All Years: Top Schools Over Time ───────────────────────────────────────

function TopSchoolsOverTimeSection({
  courseCode,
}: {
  courseCode: string;
}) {
  const [allData, setAllData] = useState<Map<string, { name: string; totalB6: number }> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all(
      AVAILABLE_YEARS.map(y =>
        fetch(`/data/school-detail-${y}.json`)
          .then(r => r.json())
          .then((detailMap: Record<string, SchoolDetail>) => ({ year: y, detailMap }))
          .catch(() => ({ year: y, detailMap: {} as Record<string, SchoolDetail> }))
      )
    ).then(results => {
      if (cancelled) return;
      const aggregate = new Map<string, { name: string; totalB6: number }>();
      for (const { detailMap } of results) {
        for (const [slug, school] of Object.entries(detailMap)) {
          const ca = school.courses.find(c => c.code === courseCode);
          if (ca && ca.band6Count > 0) {
            if (!aggregate.has(slug)) {
              aggregate.set(slug, { name: school.name, totalB6: 0 });
            }
            aggregate.get(slug)!.totalB6 += ca.band6Count;
          }
        }
      }
      setAllData(aggregate);
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [courseCode]);

  const sorted = useMemo(() => {
    if (!allData) return [];
    return Array.from(allData.entries())
      .map(([slug, data]) => ({ slug, ...data }))
      .sort((a, b) => b.totalB6 - a.totalB6)
      .slice(0, 100);
  }, [allData]);

  const INITIAL_COUNT = 30;
  const [showAll, setShowAll] = useState(false);
  const displaySchools = showAll ? sorted : sorted.slice(0, INITIAL_COUNT);

  return (
    <section className="px-4 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Top Schools Over Time</h2>
        <p className="mt-1 text-sm text-muted">
          Cumulative B6/E4 counts across {AVAILABLE_YEARS.length} years (2017–2025).
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
          <div className="col-span-1">#</div>
          <div className="col-span-9">School</div>
          <div className="col-span-2 flex justify-end">Total B6/E4</div>
        </div>

        {isLoading ? (
          <div className="px-5 py-16 text-center">
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
            <p className="mt-2 text-sm text-muted">Computing data across all years...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted">No data available.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displaySchools.map((school, idx) => (
              <Link
                key={school.slug}
                href={`/honor-roll/school/${school.slug}?year=all`}
                className="grid grid-cols-12 gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
              >
                <div className="col-span-1 flex items-center">
                  <span className="text-xs text-muted font-mono">{idx + 1}</span>
                </div>
                <div className="col-span-9 flex items-center min-w-0">
                  <span className="text-sm font-medium truncate">{school.name}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">
                    {school.totalB6.toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="border-t border-border px-5 py-2 text-xs text-muted flex items-center justify-between">
          <span>
            {displaySchools.length} of {sorted.length} school{sorted.length !== 1 ? 's' : ''}
          </span>
          {sorted.length > INITIAL_COUNT && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${sorted.length}`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Course Enrollment & Band Distribution ─────────────────────────────────

function CourseEnrollmentSection({
  courseStats,
  year,
}: {
  courseStats: CourseStats;
  year: string;
}) {
  const hasBands = courseStats.bands && Object.keys(courseStats.bands).length > 0;
  const bandOrder = ['6', '5', '4', '3', '2', '1'] as const;

  return (
    <section className="px-4 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Course Statistics</h2>
        <p className="mt-1 text-sm text-muted">
          {courseStats.total.toLocaleString()} students enrolled in {year}.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {/* Enrollment by Sex */}
        <div className="px-5 py-5">
          <div className="flex h-4 rounded overflow-hidden bg-accent-dim mb-3">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${Math.max(courseStats.total > 0 ? (courseStats.female / courseStats.total) * 100 : 0, 0.5)}%`, opacity: 0.8 }}
            />
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${Math.max(courseStats.total > 0 ? (courseStats.male / courseStats.total) * 100 : 0, 0.5)}%`, opacity: 0.5 }}
            />
            {courseStats.non_binary > 0 && (
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${Math.max((courseStats.non_binary / courseStats.total) * 100, 0.5)}%`, opacity: 0.22 }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { label: 'Female', value: courseStats.female, opacity: 0.8 },
              { label: 'Male', value: courseStats.male, opacity: 0.5 },
              ...(courseStats.non_binary > 0 ? [{ label: 'Non-binary', value: courseStats.non_binary, opacity: 0.22 as number }] : []),
            ].map(item => {
              const pct = courseStats.total > 0 ? Math.round((item.value / courseStats.total) * 100) : 0;
              return (
                <span key={item.label} className="inline-flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-sm shrink-0 bg-foreground" style={{ opacity: item.opacity }} />
                  <span className="text-muted">{item.label}</span>
                  <span className="font-mono tabular-nums">{item.value.toLocaleString()}</span>
                  <span className="text-muted/50">({pct}%)</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Band Distribution */}
        {hasBands && (
          <div className="border-t border-border px-5 py-5">
            <div className="mb-3">
              <div className="flex h-4 rounded overflow-hidden bg-accent-dim">
                {bandOrder.map((band, i) => {
                  const pct = courseStats.bands![`Band ${band}`] || 0;
                  const opacities = [0.80, 0.64, 0.48, 0.34, 0.22, 0.12];
                  return (
                    <div
                      key={band}
                      className="h-full bg-foreground transition-all"
                      style={{ width: `${Math.max(pct, 0.5)}%`, opacity: opacities[i] }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {bandOrder.map((band, i) => {
                const pct = courseStats.bands![`Band ${band}`] || 0;
                const count = courseStats.total > 0 ? Math.round(courseStats.total * pct / 100) : 0;
                const opacities = [0.80, 0.64, 0.48, 0.34, 0.22, 0.12];
                return (
                  <span key={band} className="inline-flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-sm shrink-0 bg-foreground" style={{ opacity: opacities[i] }} />
                    <span className="text-muted">B{band}</span>
                    <span className="font-mono tabular-nums">{count.toLocaleString()}</span>
                    <span className="text-muted/50">({pct}%)</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-muted">
          Data sourced from NESA official publications. Not affiliated with NESA or UAC.
        </p>
      </div>
    </section>
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
