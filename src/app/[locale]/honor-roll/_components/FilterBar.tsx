'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, School, BookOpen } from 'lucide-react';

interface CourseMeta {
  code: string;
  name: string;
}

interface FilterBarProps {
  years: string[];
  year: string;
  onYearChange: (year: string) => void;
  allSchools: string[];
  selectedSchool: string | null;
  onSchoolChange: (school: string | null) => void;
  allCourses: CourseMeta[];
  selectedCourse: CourseMeta | null;
  onCourseChange: (course: CourseMeta | null) => void;
  showAllYears?: boolean;
}

export function FilterBar({
  years, year, onYearChange,
  allSchools, selectedSchool, onSchoolChange,
  allCourses, selectedCourse, onCourseChange,
  showAllYears = false,
}: FilterBarProps) {
  return (
    <section className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium
              focus:outline-none focus:ring-2 focus:ring-foreground/10"
          >
            {showAllYears && <option value="all">All</option>}
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <SchoolFilter
            allSchools={allSchools}
            selectedSchool={selectedSchool}
            onSchoolChange={onSchoolChange}
          />

          <CourseFilter
            allCourses={allCourses}
            selectedCourse={selectedCourse}
            onCourseChange={onCourseChange}
          />

          <span className="text-xs text-muted ml-auto">
            {!selectedSchool && !selectedCourse && 'All schools'}
            {selectedSchool && !selectedCourse && '1 school'}
            {!selectedSchool && selectedCourse && '1 course'}
            {selectedSchool && selectedCourse && '1 school + 1 course'}
          </span>
        </div>
      </div>
    </section>
  );
}

function SchoolFilter({
  allSchools, selectedSchool, onSchoolChange,
}: {
  allSchools: string[];
  selectedSchool: string | null;
  onSchoolChange: (school: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return allSchools.filter(s => s.toLowerCase().includes(q)).slice(0, 100);
  }, [allSchools, search]);

  return (
    <div className="relative" ref={containerRef}>
      {selectedSchool ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-sm">
          <School className="h-3.5 w-3.5 text-muted" />
          <span className="truncate max-w-[200px]">{selectedSchool}</span>
          <button onClick={() => onSchoolChange(null)} className="text-muted hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ) : (
        <>
          <button
            onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-sm text-muted
              hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <School className="h-3.5 w-3.5" />
            Add School
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {open && (
            <div className="absolute left-0 top-full mt-1 w-72 rounded-lg border border-border bg-background shadow-lg z-50">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-3.5 w-3.5 text-muted shrink-0" />
                <input ref={inputRef} type="text" placeholder="Search schools..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none" />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted text-center">
                    {search ? 'No schools found' : 'Type to search schools'}
                  </p>
                ) : filtered.map(school => (
                  <button key={school}
                    onClick={() => { onSchoolChange(school); setSearch(''); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors">
                    {school}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CourseFilter({
  allCourses, selectedCourse, onCourseChange,
}: {
  allCourses: CourseMeta[];
  selectedCourse: CourseMeta | null;
  onCourseChange: (course: CourseMeta | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return allCourses.filter(c => c.name.toLowerCase().includes(q)).slice(0, 100);
  }, [allCourses, search]);

  return (
    <div className="relative" ref={containerRef}>
      {selectedCourse ? (
        <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-sm">
          <BookOpen className="h-3.5 w-3.5 text-muted" />
          <span className="truncate max-w-[200px]">{selectedCourse.name}</span>
          <button onClick={() => onCourseChange(null)} className="text-muted hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ) : (
        <>
          <button
            onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-sm text-muted
              hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Add Course
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {open && (
            <div className="absolute left-0 top-full mt-1 w-72 rounded-lg border border-border bg-background shadow-lg z-50">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-3.5 w-3.5 text-muted shrink-0" />
                <input ref={inputRef} type="text" placeholder="Search courses..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none" />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted text-center">
                    {search ? 'No courses found' : 'Type to search courses'}
                  </p>
                ) : filtered.map(course => (
                  <button key={course.code}
                    onClick={() => { onCourseChange(course); setSearch(''); setOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors">
                    {course.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
