'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, Users, Trophy, Search, X } from 'lucide-react';

const AVAILABLE_YEARS = ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
const ALL_YEARS_VALUE = 'all';

interface SchoolStats {
  name: string;
  band6Count: number;
  uniqueStudents: number;
  stateRanks: number;
}

interface StudentCourse {
  code: string;
  name: string;
  rank: number | null;
}

interface StudentEntry {
  firstName: string;
  lastName: string;
  courses: StudentCourse[];
  b6Count: number;
  stateRankCount: number;
  isAllRounder: boolean;
}

interface CourseEntry {
  code: string;
  name: string;
  band6Count: number;
  stateRanks: number[];
}

interface SchoolDetailData {
  name: string;
  stats: {
    band6Count: number;
    uniqueStudents: number;
    stateRanks: number;
    allRounders: number;
  };
  students: StudentEntry[];
  courses: CourseEntry[];
}

type YearValue = typeof ALL_YEARS_VALUE | string;

export default function SchoolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<SchoolDetailSkeleton />}>
      <SchoolDetailContent params={params} />
    </Suspense>
  );
}

function SchoolDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-surface rounded animate-pulse" />
            <div className="h-3 w-3 bg-surface rounded animate-pulse" />
            <div className="h-5 w-40 bg-surface rounded animate-pulse" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
          <div className="space-y-3">
            <div className="h-9 w-56 bg-surface rounded animate-pulse" />
            <div className="h-4 w-40 bg-surface rounded animate-pulse" />
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
            <div className="col-span-4">Course</div>
            <div className="col-span-3 flex justify-end">B6/E4</div>
            <div className="col-span-4 flex justify-end">State Ranks</div>
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-6 py-3">
                <div className="col-span-1">
                  <div className="h-4 w-6 bg-surface rounded animate-pulse" />
                </div>
                <div className="col-span-4">
                  <div className="h-4 w-44 bg-surface rounded animate-pulse" />
                </div>
                <div className="col-span-3 flex justify-end">
                  <div className="h-5 w-10 bg-surface rounded animate-pulse" />
                </div>
                <div className="col-span-4 flex justify-end">
                  <div className="h-4 w-16 bg-surface rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SchoolDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resolvedParams, setResolvedParams] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const yearParam = searchParams.get('year') || '2025';
  const currentYear = yearParam === ALL_YEARS_VALUE ? ALL_YEARS_VALUE : yearParam;

  const [schoolDetail, setSchoolDetail] = useState<SchoolDetailData | null>(null);
  const [allYearsStats, setAllYearsStats] = useState<Map<string, SchoolStats> | null>(null);
  const [allYearsCourses, setAllYearsCourses] = useState<CourseEntry[] | null>(null);
  const [sparoData, setSparoData] = useState<Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [filterAllRounder, setFilterAllRounder] = useState(false);
  const [filterStateRank, setFilterStateRank] = useState(false);
  const [filterCourseSearch, setFilterCourseSearch] = useState('');
  const [showAllStudents, setShowAllStudents] = useState(false);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
    fetch('/data/sparo-schools.json')
      .then(r => r.json())
      .then((data) => setSparoData(data))
      .catch(() => setSparoData(null));
  }, [params]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!resolvedParams) return;

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setSchoolDetail(null);
    setAllYearsStats(null);
    setAllYearsCourses(null);
    setShowAllStudents(false);

    if (currentYear === ALL_YEARS_VALUE) {
      Promise.all(
        AVAILABLE_YEARS.map(y =>
          Promise.all([
            fetch(`/data/schools-${y}.json`)
              .then(r => r.json())
              .then((data: SchoolStats[]) => ({ year: y, data }))
              .catch(() => ({ year: y, data: [] as SchoolStats[] })),
            fetch(`/data/school-detail-${y}.json`)
              .then(r => r.json())
              .then((data: Record<string, SchoolDetailData>) => data)
              .catch(() => null),
          ]).then(([statsResult, detailMap]) => ({ ...statsResult, detailMap }))
        )
      ).then(results => {
        if (cancelled) return;
        const map = new Map<string, SchoolStats>();
        const courseAgg = new Map<string, CourseEntry>();
        results.forEach(({ year, data, detailMap }) => {
          const found = data.find(
            (s: SchoolStats) => slugify(s.name) === resolvedParams.slug
          );
          if (found) {
            map.set(year, found);
          }
          const schoolDetail = (detailMap as Record<string, SchoolDetailData> | null)?.[resolvedParams.slug];
          if (schoolDetail?.courses) {
            schoolDetail.courses.forEach(c => {
              const existing = courseAgg.get(c.code);
              if (existing) {
                existing.band6Count += c.band6Count;
                existing.stateRanks = [...new Set([...existing.stateRanks, ...c.stateRanks])];
              } else {
                courseAgg.set(c.code, {
                  code: c.code,
                  name: c.name,
                  band6Count: c.band6Count,
                  stateRanks: [...c.stateRanks],
                });
              }
            });
          }
        });
        setAllYearsStats(map);
        setAllYearsCourses(
          Array.from(courseAgg.values()).sort((a, b) => b.band6Count - a.band6Count)
        );
        setLoading(false);
        if (map.size === 0) setNotFound(true);
      });
    } else {
      fetch(`/data/school-detail-${currentYear}.json`)
        .then(r => r.json())
        .then((data: Record<string, SchoolDetailData>) => {
          if (cancelled) return;
          const found = data[resolvedParams.slug];
          if (found) {
            setSchoolDetail(found);
          } else {
            setNotFound(true);
          }
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
        });
    }

    return () => { cancelled = true; };
  }, [currentYear, resolvedParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleYearSelect = (y: YearValue) => {
    if (!resolvedParams) return;
    const params = new URLSearchParams();
    params.set('year', y);
    router.push(
      `/honor-roll/school/${resolvedParams.slug}?${params.toString()}`,
      { scroll: false }
    );
  };

  const filteredStudents = useMemo(() => {
    if (!schoolDetail) return [];
    let result = [...schoolDetail.students];
    if (filterAllRounder) {
      result = result.filter(s => s.isAllRounder);
    }
    if (filterStateRank) {
      result = result.filter(s => s.stateRankCount > 0);
    }
    if (filterCourseSearch) {
      const s = filterCourseSearch.toLowerCase();
      result = result.filter(student =>
        student.courses.some(c => c.name.toLowerCase().includes(s))
      );
    }
    return result;
  }, [schoolDetail, filterAllRounder, filterStateRank, filterCourseSearch]);

  const currentStats = useMemo(() => {
    if (currentYear === ALL_YEARS_VALUE) {
      if (!allYearsStats) return null;
      let totalB6 = 0;
      let totalStudents = 0;
      let totalStateRanks = 0;
      allYearsStats.forEach(s => {
        totalB6 += s.band6Count;
        totalStudents += s.uniqueStudents;
        totalStateRanks += s.stateRanks;
      });
      return { band6Count: totalB6, uniqueStudents: totalStudents, stateRanks: totalStateRanks };
    }
    if (!schoolDetail) return null;
    return schoolDetail.stats;
  }, [currentYear, schoolDetail, allYearsStats]);

  const schoolName =
    (currentYear === ALL_YEARS_VALUE
      ? allYearsStats?.values().next().value?.name
      : schoolDetail?.name) || '';

  if (!resolvedParams) return null;

  return (
    <div className="min-h-screen">
      <HeaderSection
        loading={loading}
        schoolName={schoolName || ''}
        currentYear={currentYear}
        stats={currentStats}
        notFound={notFound}
        yearParam={yearParam}
      />

      <YearTabBar
        currentYear={currentYear}
        onSelect={handleYearSelect}
      />

      {!loading && !notFound && (
        <>
          {currentYear === ALL_YEARS_VALUE ? (
            <div className="mx-auto max-w-7xl divide-y divide-border">
              {allYearsCourses && allYearsCourses.length > 0 && (
                <SubjectPerformanceSection
                  courses={allYearsCourses}
                  year="2017–2025"
                  sparoSubjects={sparoData?.[resolvedParams.slug]?.subjects}
                />
              )}
              <AllYearsView
                allYearsStats={allYearsStats}
                slug={resolvedParams.slug}
              />
            </div>
          ) : (
            <div className="mx-auto max-w-7xl divide-y divide-border">
              <SubjectPerformanceSection
                courses={schoolDetail?.courses || []}
                year={currentYear}
                sparoSubjects={sparoData?.[resolvedParams.slug]?.subjects}
              />
              <StudentsSection
                students={schoolDetail?.students || []}
                filteredStudents={filteredStudents}
                filterAllRounder={filterAllRounder}
                filterStateRank={filterStateRank}
                filterCourseSearch={filterCourseSearch}
                onToggleAllRounder={() => { setFilterAllRounder(v => !v); setFilterStateRank(false); }}
                onToggleStateRank={() => { setFilterStateRank(v => !v); setFilterAllRounder(false); }}
                onCourseSearchChange={setFilterCourseSearch}
                year={currentYear}
                showAll={showAllStudents}
                onToggleShowAll={() => setShowAllStudents(v => !v)}
              />
              <YearTrendSection
                allYearsStats={allYearsStats}
                slug={resolvedParams.slug}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HeaderSection({
  loading,
  schoolName,
  currentYear,
  stats,
  notFound,
  yearParam,
}: {
  loading: boolean;
  schoolName: string;
  currentYear: YearValue;
  stats: { band6Count: number; uniqueStudents: number; stateRanks: number } | null;
  notFound: boolean;
  yearParam: string;
}) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center gap-2 text-base text-muted/70">
          <Link
            href={`/honor-roll?year=${yearParam === ALL_YEARS_VALUE ? '2025' : yearParam}`}
            className="hover:text-foreground transition-colors"
          >
            Honor Roll
          </Link>
          <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-muted/40" />
          <span className="text-foreground/80 font-medium truncate">
            {loading ? '...' : schoolName || ''}
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
            <h1 className="text-3xl font-bold tracking-tight">School Not Found</h1>
            <p className="mt-2 text-sm text-muted">
              We couldn&apos;t find data for this school. Try selecting a different year.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight">{schoolName}</h1>
            <p className="mt-1 text-sm text-muted">
              {currentYear === ALL_YEARS_VALUE
                ? 'Cumulative distinguished achievers across all years'
                : `${currentYear} HSC Distinguished Achievers`}
            </p>

            {stats && (
              <div className="mt-6 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold font-mono tracking-tight">
                    {stats.band6Count.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-muted font-medium">
                    Total B6/E4
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono tracking-tight">
                    {stats.uniqueStudents.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-muted font-medium">
                    Unique Students
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono tracking-tight">
                    {stats.stateRanks > 0 ? stats.stateRanks.toLocaleString() : '—'}
                  </div>
                  <div className="mt-1 text-xs text-muted font-medium">
                    State Ranks
                  </div>
                </div>
              </div>
            )}
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
            onClick={() => onSelect(ALL_YEARS_VALUE)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              currentYear === ALL_YEARS_VALUE
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

// ─── Section 1: Subject Performance ─────────────────────────────────────────

function SubjectPerformanceSection({
  courses,
  year,
  sparoSubjects,
}: {
  courses: CourseEntry[];
  year: string;
  sparoSubjects?: { subject: string; school_average: number; state_average: number }[];
}) {
  const sparoMap = new Map((sparoSubjects || []).map(s => [s.subject, s]));
  const hasSparo = !!(sparoSubjects && sparoSubjects.length > 0);

  const [courseSearch, setCourseSearch] = useState('');

  const filteredCourses = useMemo(() => {
    if (!courseSearch) return courses;
    const s = courseSearch.toLowerCase();
    return courses.filter(c => c.name.toLowerCase().includes(s));
  }, [courses, courseSearch]);

  const sortedCourses = useMemo(
    () => [...filteredCourses].sort((a, b) => b.band6Count - a.band6Count),
    [filteredCourses]
  );

  if (courses.length === 0) return null;

  const colCourse = hasSparo ? 'col-span-3' : 'col-span-5';
  const colB6 = 'col-span-3';
  const colRanks = hasSparo ? 'col-span-2' : 'col-span-4';
  const colSparo = 'col-span-4';

  return (
    <section className="px-4 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Subject Performance</h2>
        <p className="mt-1 text-sm text-muted">
          How this school performed in each subject during {year}.
          {hasSparo && ' Avg HSC Mark data from SPaRO school annual reports.'}
        </p>
      </div>

      <div className="mb-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Filter subjects..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-sm
              placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
          <div className={`${colCourse}`}>Course</div>
          <div className={`${colB6} flex justify-end`}>B6/E4</div>
          <div className={`${colRanks} flex justify-end`}>State Ranks</div>
          {hasSparo && <div className={`${colSparo} flex justify-end`}>School Avg vs State Avg</div>}
        </div>

        {sortedCourses.length === 0 && (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted">No subjects match your search.</p>
          </div>
        )}
        {sortedCourses.length > 0 && (
          <CoursesList
            courses={sortedCourses}
            colCourse={colCourse}
            colB6={colB6}
            colRanks={colRanks}
            colSparo={colSparo}
            hasSparo={hasSparo}
            sparoMap={sparoMap}
            year={year}
          />
        )}

        <div className="border-t border-border px-5 py-2 text-xs text-muted">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
          {courseSearch && filteredCourses.length < courses.length && (
            <span className="text-muted/60"> (filtered from {courses.length})</span>
          )}
          {hasSparo && (
            <span className="ml-2">· SPaRO data for {sparoSubjects.length} subject{sparoSubjects.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </section>
  );
}

function CoursesList({
  courses,
  colCourse,
  colB6,
  colRanks,
  colSparo,
  hasSparo,
  sparoMap,
  year,
}: {
  courses: CourseEntry[];
  colCourse: string;
  colB6: string;
  colRanks: string;
  colSparo: string;
  hasSparo: boolean;
  sparoMap: Map<string, { subject: string; school_average: number; state_average: number }>;
  year: string;
}) {
  return (
    <div className="divide-y divide-border">
      {courses.map((course) => (
        <CourseRow
          key={course.code}
          course={course}
          colCourse={colCourse}
          colB6={colB6}
          colRanks={colRanks}
          colSparo={colSparo}
          hasSparo={hasSparo}
          sparo={sparoMap.get(course.name)}
          year={year}
        />
      ))}
    </div>
  );
}

function CourseRow({
  course,
  colCourse,
  colB6,
  colRanks,
  colSparo,
  hasSparo,
  sparo,
  year,
}: {
  course: CourseEntry;
  colCourse: string;
  colB6: string;
  colRanks: string;
  colSparo: string;
  hasSparo: boolean;
  sparo: { subject: string; school_average: number; state_average: number } | undefined;
  year: string;
}) {
  return (
    <Link
      href={`/honor-roll/course/${course.code}?year=${year}`}
      className="grid grid-cols-12 gap-3 px-5 py-3 hover:bg-surface-hover transition-colors group"
    >
      <div className={`${colCourse} flex items-center min-w-0`}>
        <span className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
          {course.name}
        </span>
      </div>
      <div className={`${colB6} flex items-center justify-end`}>
        <span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">
          {course.band6Count.toLocaleString()}
        </span>
      </div>
      <div className={`${colRanks} flex items-center justify-end gap-1 flex-wrap`}>
        {course.stateRanks.length > 0
          ? course.stateRanks.map((rank, rIdx) => (
              <span
                key={rIdx}
                className="inline-flex items-center rounded-md bg-accent-dim px-1.5 py-0.5 text-xs font-mono text-muted"
              >
                #{rank}
              </span>
            ))
          : (
            <span className="text-sm text-muted/30 font-mono">—</span>
          )}
      </div>
      {hasSparo && (
        <div className={`${colSparo} flex items-center justify-end gap-1`}>
          {sparo ? (
            <span className="text-xs font-mono text-muted">
              {sparo.school_average.toFixed(1)}
              <span className="text-muted/40 mx-1">vs</span>
              {sparo.state_average.toFixed(1)}
            </span>
          ) : (
            <span className="text-xs text-muted/20">—</span>
          )}
        </div>
      )}
    </Link>
  );
}

// ─── Section 2: Students ────────────────────────────────────────────────────

function StudentsSection({
  students,
  filteredStudents,
  filterAllRounder,
  filterStateRank,
  filterCourseSearch,
  onToggleAllRounder,
  onToggleStateRank,
  onCourseSearchChange,
  year,
  showAll,
  onToggleShowAll,
}: {
  students: StudentEntry[];
  filteredStudents: StudentEntry[];
  filterAllRounder: boolean;
  filterStateRank: boolean;
  filterCourseSearch: string;
  onToggleAllRounder: () => void;
  onToggleStateRank: () => void;
  onCourseSearchChange: (v: string) => void;
  year: string;
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const INITIAL_COUNT = 20;
  const displayStudents = showAll ? filteredStudents : filteredStudents.slice(0, INITIAL_COUNT);

  if (students.length === 0) return null;

  return (
    <section className="px-4 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Students</h2>
        <p className="mt-1 text-sm text-muted">
          {students.length} student{students.length !== 1 ? 's' : ''} earned at least one B6/E4 in {year}.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={onToggleAllRounder}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            filterAllRounder
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted hover:text-foreground'
          }`}
        >
          All-rounders
          {filterAllRounder && <X className="h-3 w-3" />}
        </button>
        <button
          onClick={onToggleStateRank}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            filterStateRank
              ? 'border-foreground bg-foreground text-background'
              : 'border-border text-muted hover:text-foreground'
          }`}
        >
          Has state rank
          {filterStateRank && <X className="h-3 w-3" />}
        </button>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Filter by course..."
            value={filterCourseSearch}
            onChange={(e) => onCourseSearchChange(e.target.value)}
            className="w-48 rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-sm
              placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
          <div className="col-span-4">Student</div>
          <div className="col-span-6">B6/E4 Courses</div>
          <div className="col-span-1 flex justify-end">B6</div>
          <div className="col-span-1 flex justify-end">Ranks</div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted">No students match the filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayStudents.map((student, idx) => (
              <div
                key={`${student.lastName}-${student.firstName}-${idx}`}
                className="grid grid-cols-12 gap-3 px-5 py-3"
              >
                <div className="col-span-4">
                  <span className="text-sm font-medium">
                    {student.lastName}, {student.firstName}
                  </span>
                  {student.isAllRounder && (
                    <span className="mt-1 block text-xs text-amber-500 font-medium">
                      All-rounder
                    </span>
                  )}
                </div>
                <div className="col-span-6 flex flex-wrap items-center gap-x-1 gap-y-0.5 min-w-0">
                  {student.courses.map((course, cIdx) => (
                    <span key={course.code + cIdx}>
                      <Link
                        href={`/honor-roll/course/${course.code}?year=${year}`}
                        className="text-xs text-foreground/70 hover:text-foreground hover:underline underline-offset-2 transition-colors"
                      >
                        {course.name}
                        {course.rank != null && course.rank > 0 && (
                          <span className="font-mono ml-0.5">(#{course.rank})</span>
                        )}
                      </Link>
                      {cIdx < student.courses.length - 1 && (
                        <span className="text-muted/30 mx-0.5">·</span>
                      )}
                    </span>
                  ))}
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  <span className="text-sm text-muted font-mono">{student.b6Count}</span>
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  <span className="text-sm text-muted font-mono">
                    {student.stateRankCount > 0 ? student.stateRankCount : '0'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border px-5 py-2 text-xs text-muted flex items-center justify-between">
          <span>
            Showing {displayStudents.length} of {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </span>
          {filteredStudents.length > INITIAL_COUNT && (
            <button
              onClick={onToggleShowAll}
              className="text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${filteredStudents.length}`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Year Trend ──────────────────────────────────────────────────

function YearTrendSection({
  allYearsStats,
  slug,
}: {
  allYearsStats: Map<string, SchoolStats> | null;
  slug: string;
}) {
  if (!allYearsStats || allYearsStats.size < 2) return null;

  const yearsWithData = AVAILABLE_YEARS.filter(y => allYearsStats.has(y));
  if (yearsWithData.length < 2) return null;

  const maxB6 = Math.max(...yearsWithData.map(y => allYearsStats.get(y)!.band6Count));

  return (
    <section className="px-4 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Year Trend</h2>
        <p className="mt-1 text-sm text-muted">
          B6/E4 counts across available years.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-end gap-1 h-24">
            {yearsWithData.map(year => (
              <YearBarItem
                key={year}
                year={year}
                stat={allYearsStats.get(year)!}
                maxB6={maxB6}
                slug={slug}
              />
            ))}
          </div>
        </div>
        <div className="border-t border-border px-5 py-2 text-xs text-muted">
          Click a year to view details
        </div>
      </div>
    </section>
  );
}

function YearBarItem({
  year,
  stat,
  maxB6,
  slug,
}: {
  year: string;
  stat: SchoolStats;
  maxB6: number;
  slug: string;
}) {
  const heightPct = maxB6 > 0 ? (stat.band6Count / maxB6) * 100 : 0;
  return (
    <Link
      href={`/honor-roll/school/${slug}?year=${year}`}
      className="flex-1 flex flex-col items-center gap-1 group min-w-0"
    >
      <span className="text-xs text-muted font-mono group-hover:text-foreground transition-colors">
        {stat.band6Count}
      </span>
      <div
        className="w-full rounded-t-sm bg-foreground/15 group-hover:bg-foreground/30 transition-colors min-h-[4px]"
        style={{ height: `${Math.max(heightPct, 4)}%` }}
      />
      <span className="text-xs text-muted group-hover:text-foreground transition-colors">
        {year}
      </span>
    </Link>
  );
}

// ─── All Years View (when "All" is selected) ────────────────────────────────

function AllYearsView({
  allYearsStats,
  slug,
}: {
  allYearsStats: Map<string, SchoolStats> | null;
  slug: string;
}) {
  if (!allYearsStats || allYearsStats.size === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-sm text-muted text-center">No data across selected years.</p>
      </section>
    );
  }

  const yearsWithData = AVAILABLE_YEARS.filter(y => allYearsStats.has(y));
  const maxB6 = Math.max(...yearsWithData.map(y => allYearsStats.get(y)!.band6Count));

  return (
    <div className="mx-auto max-w-7xl">
      <section className="px-4 py-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Year by Year</h2>
          <p className="mt-1 text-sm text-muted">
            Distinguished achievers across all available years.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-5 py-4">
            <div className="flex items-end gap-1 h-28">
              {yearsWithData.map(year => (
                <YearBarItem
                  key={year}
                  year={year}
                  stat={allYearsStats.get(year)!}
                  maxB6={maxB6}
                  slug={slug}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-border px-5 py-3">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Details</span>
          </div>
          <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
            <div className="col-span-4">Year</div>
            <div className="col-span-3 flex justify-end">B6/E4</div>
            <div className="col-span-3 flex justify-end">Students</div>
            <div className="col-span-2 flex justify-end">Ranks</div>
          </div>
          <div className="divide-y divide-border">
            {yearsWithData.map(year => (
              <YearTableRow
                key={year}
                year={year}
                stat={allYearsStats.get(year)!}
                slug={slug}
              />
            ))}
          </div>
          <div className="border-t border-border px-5 py-2 text-xs text-muted">
            {yearsWithData.length} of {AVAILABLE_YEARS.length} years with data
          </div>
        </div>
      </section>
    </div>
  );
}

function YearTableRow({
  year,
  stat,
  slug,
}: {
  year: string;
  stat: SchoolStats;
  slug: string;
}) {
  return (
    <Link
      href={`/honor-roll/school/${slug}?year=${year}`}
      className="grid grid-cols-12 gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
    >
      <div className="col-span-4 flex items-center">
        <span className="text-sm font-mono font-medium">{year}</span>
      </div>
      <div className="col-span-3 flex items-center justify-end">
        <span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">
          {stat.band6Count.toLocaleString()}
        </span>
      </div>
      <div className="col-span-3 flex items-center justify-end">
        <span className="text-sm text-muted font-mono">
          {stat.uniqueStudents.toLocaleString()}
        </span>
      </div>
      <div className="col-span-2 flex items-center justify-end">
        <span className="text-sm text-muted font-mono">
          {stat.stateRanks > 0 ? stat.stateRanks : '—'}
        </span>
      </div>
    </Link>
  );
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
