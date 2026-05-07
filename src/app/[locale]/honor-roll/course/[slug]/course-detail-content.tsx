'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Search, Info } from 'lucide-react';
import { getRenameHistory, resolveCourseNumbers, getCodeForYear } from '@/lib/course-aliases';
import {
  useCourseData, useSparoCourseData,
  type SchoolDetail, type StateRankEntry, type SchoolB6Entry,
  type B6StudentEntry, type SparoSchoolData,
} from '@/lib/honor-roll';

const AVAILABLE_YEARS = ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2009', '2008', '2007', '2006', '2005', '2004', '2003', '2002', '2001'];
const ALL_YEARS = 'all';
type YearValue = 'all' | string;
type TabId = 'state-ranks' | 'band6-list' | 'top-schools';
const ALL_TABS: { id: TabId; label: string }[] = [
  { id: 'state-ranks', label: 'State Ranks' },
  { id: 'band6-list', label: 'Band 6/E4 List' },
  { id: 'top-schools', label: 'Top Schools' },
];

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

interface CourseStats {
  name: string;
  total: number;
  male: number;
  female: number;
  non_binary: number;
  bands?: Record<string, number>;
}

export default function CourseDetailPage({
  slug,
  initialCourseData,
  initialCourseStats,
}: {
  slug: string;
  initialCourseData: CourseData | null;
  initialCourseStats: CourseStats | null;
}) {
  return (
    <Suspense fallback={<CourseDetailSkeleton />}>
      <CourseDetailContent slug={slug} initialCourseData={initialCourseData} initialCourseStats={initialCourseStats} />
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
  slug,
  initialCourseData,
  initialCourseStats,
}: {
  slug: string;
  initialCourseData: CourseData | null;
  initialCourseStats: CourseStats | null;
}) {
  const routeParams = useParams();
  const slugFromRoute = typeof routeParams?.slug === 'string' ? routeParams.slug : null;
  const resolvedSlug = slugFromRoute || slug;

  const searchParams = useSearchParams();
  const router = useRouter();

  const yearParam = searchParams.get('year') || '2025';
  const currentYear: YearValue = yearParam === ALL_YEARS ? ALL_YEARS : yearParam;
  const isAllYears = currentYear === ALL_YEARS;
  const isDefaultYear = !searchParams.get('year') || searchParams.get('year') === '2025';

  const [allCourseData, setAllCourseData] = useState<CourseData[] | null>(isDefaultYear && initialCourseData ? [initialCourseData] : null);
  const [schoolDetailMap, setSchoolDetailMap] = useState<Record<string, SchoolDetail> | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(
    isDefaultYear ? initialCourseStats : null
  );
  const [sparoData, setSparoData] = useState<Record<string, { name: string; subjects: { subject: string; school_average: number; state_average: number }[] }> | null>(null);
  const [loading, setLoading] = useState(!(isDefaultYear && initialCourseData));
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [activeSection, setActiveSection] = useState<TabId>('state-ranks');

  useEffect(() => {
    fetch('/data/sparo-schools.json')
      .then(r => r.json())
      .then(data => setSparoData(data))
      .catch(() => setSparoData(null));
  }, []);

  useEffect(() => {
    if (!resolvedSlug || isAllYears) return;
    const correctSlug = getCodeForYear(resolvedSlug, currentYear);
    if (correctSlug !== resolvedSlug) {
      const params = new URLSearchParams();
      params.set('year', currentYear);
      router.replace(`/honor-roll/course/${correctSlug}?${params.toString()}`, { scroll: false });
    }
  }, [resolvedSlug, currentYear, isAllYears, router]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!resolvedSlug) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(false);

    if (isAllYears) {
      fetch('/data/courses.json')
        .then(r => r.json())
        .then((data: CourseData[]) => {
          if (cancelled) return;
          setAllCourseData(data);
          const found = data.find((c: CourseData) => c.code === resolvedSlug);
          if (!found) setNotFound(true);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) { setError(true); setLoading(false); }
        });
    } else if (isDefaultYear && initialCourseData && initialCourseStats) {
      setAllCourseData([initialCourseData]);
      setCourseStats(initialCourseStats);
      fetch(`/data/school-detail-${currentYear}.json`)
        .then(r => r.json())
        .then((detailData: Record<string, SchoolDetail>) => {
          if (!cancelled) setSchoolDetailMap(detailData);
        })
        .catch(() => {});
      setLoading(false);
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
          if (statsData && resolvedSlug) {
            setCourseStats(statsData[resolvedSlug] || null);
          }
          const found = allData.find((c: CourseData) => c.code === resolvedSlug);
          if (!found) setNotFound(true);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) { setError(true); setLoading(false); }
        });
    }

    return () => { cancelled = true; };
  }, [currentYear, resolvedSlug, isAllYears, initialCourseData, initialCourseStats, isDefaultYear]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const courseData = useMemo(() => {
    if (!resolvedSlug || !allCourseData) return null;
    return allCourseData.find((c: CourseData) => c.code === resolvedSlug) || null;
  }, [allCourseData, resolvedSlug]);

  const renameHistory = useMemo(() => {
    if (!resolvedSlug) return null;
    return getRenameHistory(resolvedSlug);
  }, [resolvedSlug]);

  const { sparoCourseMap, sparoRankMap } = useSparoCourseData(sparoData, courseData?.name);

  const { stateRanks, b6Students, topSchools } = useCourseData(schoolDetailMap, resolvedSlug);
  const totalStateRanks = useMemo(() => stateRanks.length, [stateRanks]);

  const availableTabs = useMemo(() =>
    ALL_TABS.filter(tab => {
      if (tab.id === 'state-ranks') return stateRanks.length > 0;
      if (tab.id === 'top-schools') return topSchools.length > 0;
      return true;
    }),
    [stateRanks, topSchools]
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (availableTabs.length === 0) return;
    if (!availableTabs.find(t => t.id === activeSection)) {
      setActiveSection(availableTabs[0].id);
    }
  }, [availableTabs, activeSection]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleYearSelect = (y: YearValue) => {
    if (!resolvedSlug) return;
    const params = new URLSearchParams();
    const slugForYear = y === ALL_YEARS
      ? resolvedSlug
      : getCodeForYear(resolvedSlug, y);
    params.set('year', y);
    router.push(`/honor-roll/course/${slugForYear}?${params.toString()}`, { scroll: false });
  };

  if (!resolvedSlug) return null;

  const currentYearB6Count = courseData?.years.find(
    y => y.year === parseInt(currentYear)
  )?.band6Count || null;

  const allYearsTotalB6 = courseData
    ? courseData.years.reduce((sum, y) => sum + y.band6Count, 0)
    : 0;

  const yearLabel = isAllYears ? '2001–2025' : currentYear;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-center gap-2 text-base text-muted/70">
            <Link href="/honor-roll" className="hover:text-foreground transition-colors">
              Honor Roll
            </Link>
            <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-muted/40" />
            <Link
              href={`/honor-roll?year=${isAllYears ? '2025' : currentYear}`}
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
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">
                  {courseData?.name}
                </h1>
                {availableTabs.length > 0 && (
                  <div className="inline-flex items-center rounded-lg bg-accent-dim p-1">
                    {availableTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSection(tab.id)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                          activeSection === tab.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted hover:text-foreground'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
            </>
          )}
        </div>
      </section>

      {!loading && !notFound && !error && courseData && (
        <>
          {/* Sticky bar: horizontally scrollable year pills */}
          <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => handleYearSelect(ALL_YEARS)}
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
                    onClick={() => handleYearSelect(y)}
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

          {isAllYears ? (
            <div className="mx-auto max-w-7xl divide-y divide-border">
              <YearBreakdownSection courseData={courseData} courseCode={resolvedSlug} />
              <TopSchoolsOverTimeSection courseCode={resolvedSlug} />
            </div>
          ) : (
            <div className="mx-auto max-w-7xl divide-y divide-border">
              {courseStats && (
                <CourseEnrollmentSection
                  courseStats={courseStats}
                  year={currentYear}
                  band6Count={currentYearB6Count}
                />
              )}
              {activeSection === 'top-schools' && (
                <TopSchoolsSection schools={topSchools} year={currentYear} sparoMap={sparoCourseMap} sparoRankMap={sparoRankMap} />
              )}
              {activeSection === 'state-ranks' && (
                <StateRanksSection
                  stateRanks={stateRanks}
                  year={currentYear}
                  totalB6={b6Students.length}
                  onSwitchToB6List={() => setActiveSection('band6-list')}
                />
              )}
              {activeSection === 'band6-list' && (
                <Band6ListSection students={b6Students} year={currentYear} />
              )}
            </div>
          )}

          <Footer />
        </>
      )}
    </div>
  );
}

// ─── Section 1: Top Schools ─────────────────────────────────────────────────

function TopSchoolsSection({
  schools,
  year,
  sparoMap,
  sparoRankMap,
}: {
  schools: SchoolB6Entry[];
  year: string;
  sparoMap: Map<string, { school_average: number; state_average: number }> | null;
  sparoRankMap: Map<string, number> | null;
}) {
  const INITIAL_COUNT = 30;
  const [showAll, setShowAll] = useState(false);
  const displaySchools = showAll ? schools : schools.slice(0, INITIAL_COUNT);

  const hasSparo = sparoMap !== null && sparoMap.size > 0;

  if (schools.length === 0) return null;

  const colSchool = hasSparo ? 'col-span-4' : 'col-span-9';
  const colB6 = 'col-span-2';
  const colSparo = 'col-span-5';

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Top Schools</h2>
        <p className="mt-1 text-sm text-muted">
          {schools.length} school{schools.length !== 1 ? 's' : ''} with at least one B6/E4 in this course during {year}.
          {hasSparo && ' Avg HSC Mark data from SPaRO school annual reports.'}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
          <div className="col-span-1">#</div>
          <div className={colSchool}>School</div>
          <div className={`${colB6} flex justify-end`}>B6/E4</div>
          {hasSparo && (
            <div className={`${colSparo} flex justify-end items-center gap-1`}>
              School Avg vs State Avg
              <span className="cursor-help" title="Rank by school average from published SPaRO data">
                <Info className="h-3 w-3 text-muted/70" />
              </span>
            </div>
          )}
        </div>

        <div className="divide-y divide-border">
          {displaySchools.map((school, idx) => {
            const sparo = sparoMap?.get(school.slug);
            const rank = sparoRankMap?.get(school.slug);
            return (
              <Link
                key={school.slug}
                href={`/honor-roll/school/${school.slug}?year=${year}`}
                className="grid grid-cols-12 gap-3 px-5 py-3 hover:bg-surface-hover transition-colors"
              >
                <div className="col-span-1 flex items-center">
                  <span className="text-xs text-muted font-mono">{idx + 1}</span>
                </div>
                <div className={`${colSchool} flex items-center min-w-0`}>
                  <span className="text-sm font-medium truncate">{school.name}</span>
                </div>
                <div className={`${colB6} flex items-center justify-end`}>
                  <span className="inline-flex items-center rounded-md bg-accent-dim px-2 py-0.5 text-xs font-mono font-medium">
                    {school.band6Count.toLocaleString()}
                  </span>
                </div>
                {hasSparo && (
                  <div className={`${colSparo} flex items-center justify-end gap-1`}>
                    {sparo ? (
                      <>
                        <span className="text-xs font-mono text-muted/70 ml-0.5">#{rank}</span>
                        <span className="text-xs font-mono text-muted">
                          {sparo.school_average.toFixed(1)}
                          <span className="text-muted/40 mx-1">vs</span>
                          {sparo.state_average.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted/20">—</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
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
  totalB6,
  onSwitchToB6List,
}: {
  stateRanks: StateRankEntry[];
  year: string;
  totalB6: number;
  onSwitchToB6List: () => void;
}) {
  const otherCount = totalB6 - stateRanks.length;

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">State Ranks</h2>
        <p className="mt-1 text-sm text-muted">
          The number of state rank students (Top Achievers) awarded by NESA depends on the number of candidates in the course.
        </p>
      </div>

      {stateRanks.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-5 py-16 text-center">
          <p className="text-sm text-muted">No state ranks awarded for this course in {year}.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Student Name</div>
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
                      {entry.lastName}, {entry.firstName}
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
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-mono font-medium ${
                      entry.rank === 1
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-border text-muted'
                    }`}>
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

          {otherCount > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted">
                Plus{' '}
                <span className="font-medium text-foreground">{otherCount} other student{otherCount !== 1 ? 's' : ''}</span>
                {' '}achieved the highest band for this course.{' '}
                <button
                  onClick={onSwitchToB6List}
                  className="text-foreground hover:underline underline-offset-4 font-medium"
                >
                  See the Band 6/E4 List for full details.
                </button>
              </p>
            </div>
          )}
        </>
      )}
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
  const [filterAllRounder, setFilterAllRounder] = useState(false);
  const [filterStateRank, setFilterStateRank] = useState(false);

  const filtered = useMemo(() => {
    let result = students;
    const s = search.toLowerCase();
    if (s) {
      result = result.filter(stu =>
        `${stu.firstName} ${stu.lastName}`.toLowerCase().includes(s) ||
        stu.schoolName.toLowerCase().includes(s) ||
        stu.courses.some(c => c.name.toLowerCase().includes(s))
      );
    }
    if (filterAllRounder) {
      result = result.filter(s => s.isAllRounder);
    }
    if (filterStateRank) {
      result = result.filter(s => s.stateRankCount > 0);
    }
    return result;
  }, [students, search, filterAllRounder, filterStateRank]);

  if (students.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Band 6 / E4 List</h2>
        <p className="mt-1 text-sm text-muted">
          All {students.length} student{students.length !== 1 ? 's' : ''} who achieved a B6/E4 in this course during {year}.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface py-1.5 pl-8 pr-3 text-sm
                placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">Filters:</span>
          <button
            onClick={() => setFilterAllRounder(v => !v)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              filterAllRounder
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted hover:text-foreground'
            }`}
          >
            All-rounders
          </button>
          <button
            onClick={() => setFilterStateRank(v => !v)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              filterStateRank
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted hover:text-foreground'
            }`}
          >
            Has state rank
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            All-rounder
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 shrink-0" />
            First in course
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0" />
            State rank
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <span className="inline-flex items-center rounded-full border border-green-600 bg-green-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Course (#1)</span>
            <span className="inline-flex items-center rounded-full border border-blue-600 bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Course (#N)</span>
            <span className="inline-flex items-center rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">Course</span>
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-medium text-muted">
          <div className="col-span-3">Student Name</div>
          <div className="col-span-2 hidden md:block">School</div>
          <div className="col-span-5 md:col-span-4">B6/E4 Courses</div>
          <div className="col-span-2 md:col-span-1 flex justify-end">B6/E4 Count</div>
          <div className="col-span-2 flex justify-end">State Ranks</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-muted">No students match your search.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((entry) => {
              const hasFirst = entry.courses.some(c => c.rank === 1);
              const hasStateRank = entry.courses.some(c => c.rank > 1);
              return (
              <div
                key={`${entry.lastName}-${entry.firstName}-${entry.schoolSlug}`}
                className="grid grid-cols-12 gap-3 px-5 py-3"
              >
                <div className="col-span-3 flex items-center gap-1.5 min-w-0">
                  {entry.isAllRounder && (
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shrink-0" title="All-rounder" />
                  )}
                  <span className="text-sm font-medium truncate">
                    {entry.lastName}, {entry.firstName}
                  </span>
                  {hasFirst && (
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 shrink-0" title="First in course" />
                  )}
                  {hasStateRank && (
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0" title="State rank" />
                  )}
                  <div className="md:hidden ml-1">
                    <Link
                      href={`/honor-roll/school/${entry.schoolSlug}?year=${year}`}
                      className="text-xs text-muted hover:text-foreground transition-colors"
                    >
                      {entry.schoolName}
                    </Link>
                  </div>
                </div>
                <div className="col-span-2 hidden md:flex items-center min-w-0">
                  <Link
                    href={`/honor-roll/school/${entry.schoolSlug}?year=${year}`}
                    className="text-sm text-foreground hover:underline underline-offset-4 transition-colors truncate"
                  >
                    {entry.schoolName}
                  </Link>
                </div>
                <div className="col-span-5 md:col-span-4 flex flex-wrap items-center gap-1 min-w-0">
                  {entry.courses.map((course, cIdx) => {
                    const rank = course.rank > 0 ? course.rank : 0;
                    const isFirst = rank === 1;
                    const badgeClass = isFirst
                      ? 'border-green-600 bg-green-600 text-white hover:bg-green-700'
                      : rank > 0
                        ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                        : 'border-border text-foreground/70 hover:bg-surface-hover';
                    return (
                      <Link
                        key={course.code + cIdx}
                        href={`/honor-roll/course/${course.code}?year=${year}`}
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${badgeClass}`}
                      >
                        {course.name}
                        {rank > 0 && <span className="ml-1 font-mono">(#{rank})</span>}
                      </Link>
                    );
                  })}
                </div>
                <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                  <span className="text-sm text-muted font-mono">{entry.b6Count}</span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className="text-sm text-muted font-mono">
                    {entry.stateRankCount > 0 ? entry.stateRankCount : '0'}
                  </span>
                </div>
              </div>
            );})}
          </div>
        )}

        <div className="border-t border-border px-5 py-2 text-xs text-muted">
          Showing {filtered.length} of {students.length} student{students.length !== 1 ? 's' : ''}
          {filtered.length < students.length && (
            <span className="text-muted/60"> (filtered from {students.length})</span>
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
    <section className="px-4 sm:px-6 lg:px-8 py-8">
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

  const allAliases = resolveCourseNumbers(courseCode);

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
          for (const aliasCode of allAliases) {
            const ca = school.courses.find(c => c.code === aliasCode);
            if (ca && ca.band6Count > 0) {
              if (!aggregate.has(slug)) {
                aggregate.set(slug, { name: school.name, totalB6: 0 });
              }
              aggregate.get(slug)!.totalB6 += ca.band6Count;
              break;
            }
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
    <section className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Top Schools Over Time</h2>
        <p className="mt-1 text-sm text-muted">
          Cumulative B6/E4 counts across {AVAILABLE_YEARS.length} years (2001–2025).
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
  band6Count,
}: {
  courseStats: CourseStats;
  year: string;
  band6Count: number | null;
}) {
  const hasBands = courseStats.bands && Object.keys(courseStats.bands).length > 0;
  const bandOrder = ['6', '5', '4', '3', '2', '1'] as const;
  const genderTotal = courseStats.female + courseStats.male + courseStats.non_binary;

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Course Statistics</h2>
        <p className="mt-1 text-sm text-muted">
          {genderTotal.toLocaleString()} students enrolled in {year}.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-5">
          <div className="flex h-4 rounded overflow-hidden bg-accent-dim mb-3">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${Math.max(genderTotal > 0 ? (courseStats.female / genderTotal) * 100 : 0, 0.5)}%`, opacity: 0.8 }}
            />
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${Math.max(genderTotal > 0 ? (courseStats.male / genderTotal) * 100 : 0, 0.5)}%`, opacity: 0.5 }}
            />
            {courseStats.non_binary > 0 && (
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${Math.max((courseStats.non_binary / genderTotal) * 100, 0.5)}%`, opacity: 0.22 }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { label: 'Female', value: courseStats.female, opacity: 0.8 },
              { label: 'Male', value: courseStats.male, opacity: 0.5 },
              ...(courseStats.non_binary > 0 ? [{ label: 'Non-binary', value: courseStats.non_binary, opacity: 0.22 as number }] : []),
            ].map(item => {
              const pct = genderTotal > 0 ? Math.round((item.value / genderTotal) * 100) : 0;
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
                const count = band === '6' && band6Count != null
                  ? band6Count
                  : genderTotal > 0 ? Math.round(genderTotal * pct / 100) : 0;
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
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
