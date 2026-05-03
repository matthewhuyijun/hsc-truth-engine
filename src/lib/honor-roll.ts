import { useMemo } from 'react';

// ─── Shared types ──────────────────────────────────────────────────────────

export interface StudentCourse {
  code: string;
  name: string;
  rank: number;
}

export interface SchoolStudent {
  firstName: string;
  lastName: string;
  courses: StudentCourse[];
  b6Count: number;
  stateRankCount: number;
  isAllRounder: boolean;
}

export interface SchoolCourseAgg {
  code: string;
  name: string;
  band6Count: number;
  stateRanks: number[];
}

export interface SchoolDetail {
  name: string;
  stats: { band6Count: number; uniqueStudents: number; stateRanks: number; allRounders: number };
  students: SchoolStudent[];
  courses: SchoolCourseAgg[];
}

export interface CourseMeta {
  code: string;
  name: string;
}

export interface StateRankEntry {
  firstName: string;
  lastName: string;
  schoolName: string;
  rank: number;
}

export interface SchoolB6Entry {
  name: string;
  slug: string;
  band6Count: number;
}

export interface B6StudentEntry {
  firstName: string;
  lastName: string;
  schoolName: string;
  schoolSlug: string;
  isAllRounder: boolean;
  courses: StudentCourse[];
  b6Count: number;
  stateRankCount: number;
}

export interface SparoSchoolData {
  name: string;
  subjects: { subject: string; school_average: number; state_average: number }[];
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

export function useCourseData(
  schoolDetailMap: Record<string, SchoolDetail> | null,
  courseCode: string | undefined,
) {
  const stateRanks = useMemo((): StateRankEntry[] => {
    if (!schoolDetailMap || !courseCode) return [];
    const results: StateRankEntry[] = [];
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
  }, [schoolDetailMap, courseCode]);

  const b6Students = useMemo((): B6StudentEntry[] => {
    if (!schoolDetailMap || !courseCode) return [];
    const results: B6StudentEntry[] = [];
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
              isAllRounder: student.isAllRounder,
              courses: student.courses,
              b6Count: student.b6Count,
              stateRankCount: student.stateRankCount,
            });
            break;
          }
        }
      }
    }
    results.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
    return results;
  }, [schoolDetailMap, courseCode]);

  const topSchools = useMemo((): SchoolB6Entry[] => {
    if (!schoolDetailMap || !courseCode) return [];
    const results: SchoolB6Entry[] = [];
    for (const [slug, school] of Object.entries(schoolDetailMap)) {
      const ca = school.courses.find(c => c.code === courseCode);
      if (ca && ca.band6Count > 0) {
        results.push({ name: school.name, slug, band6Count: ca.band6Count });
      }
    }
    results.sort((a, b) => b.band6Count - a.band6Count);
    return results;
  }, [schoolDetailMap, courseCode]);

  return { stateRanks, b6Students, topSchools };
}

export function useSparoCourseData(
  sparoData: Record<string, SparoSchoolData> | null,
  courseName: string | undefined,
) {
  const sparoCourseMap = useMemo(() => {
    if (!sparoData || !courseName) return null;
    const map = new Map<string, { school_average: number; state_average: number }>();
    for (const [slug, school] of Object.entries(sparoData)) {
      const subj = school.subjects.find(s => s.subject === courseName);
      if (subj) map.set(slug, { school_average: subj.school_average, state_average: subj.state_average });
    }
    return map.size > 0 ? map : null;
  }, [sparoData, courseName]);

  const sparoRankMap = useMemo(() => {
    if (!sparoCourseMap) return null;
    const ranked = [...sparoCourseMap.entries()].sort(([, a], [, b]) => b.school_average - a.school_average);
    const map = new Map<string, number>();
    ranked.forEach(([slug], i) => map.set(slug, i + 1));
    return map;
  }, [sparoCourseMap]);

  return { sparoCourseMap, sparoRankMap };
}
