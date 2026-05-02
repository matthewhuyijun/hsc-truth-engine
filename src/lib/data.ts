import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'csv');

export interface DistinguishedAchiever {
  year: number;
  firstName: string;
  lastName: string;
  schoolName: string;
  courses: string[];
}

export interface SchoolStat {
  schoolName: string;
  year: number;
  band6Count: number;
  uniqueStudents: number;
}

// Simple CSV parser (handles our specific format)
function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim().replace(/^"|"$/g, ''));
    return cells;
  });

  return { headers, rows };
}

// Load all distinguished achievers
export function loadDistinguishedAchievers(): DistinguishedAchiever[] {
  const data: DistinguishedAchiever[] = [];

  // Load 2017-2025 from NSW Gov CSV
  const nswGovDir = path.join(DATA_DIR, 'distinguished-achievers');
  if (fs.existsSync(nswGovDir)) {
    const files = fs.readdirSync(nswGovDir).filter(f => f.endsWith('.csv')).sort();
    for (const file of files) {
      const year = parseInt(file.replace('.csv', ''));
      const content = fs.readFileSync(path.join(nswGovDir, file), 'utf-8');
      const { headers, rows } = parseCSV(content);

      const firstNameIdx = headers.indexOf('first_name');
      const lastNameIdx = headers.indexOf('last_name');
      const schoolIdx = headers.indexOf('main_school_name');
      const coursesIdx = headers.indexOf('top_band_courses');

      for (const row of rows) {
        if (!row[firstNameIdx]) continue;
        data.push({
          year,
          firstName: row[firstNameIdx],
          lastName: row[lastNameIdx],
          schoolName: row[schoolIdx],
          courses: row[coursesIdx] ? [row[coursesIdx]] : []
        });
      }
    }
  }

  return data;
}

// Get school stats aggregated by year
export function getSchoolStatsByYear(data: DistinguishedAchiever[]): Map<string, SchoolStat[]> {
  const statsMap = new Map<string, SchoolStat[]>();

  // Group by school name
  const schoolGroups = new Map<string, DistinguishedAchiever[]>();
  for (const record of data) {
    if (!schoolGroups.has(record.schoolName)) {
      schoolGroups.set(record.schoolName, []);
    }
    schoolGroups.get(record.schoolName)!.push(record);
  }

  // Calculate stats per school per year
  for (const [schoolName, records] of schoolGroups) {
    const yearGroups = new Map<number, DistinguishedAchiever[]>();
    for (const record of records) {
      if (!yearGroups.has(record.year)) {
        yearGroups.set(record.year, []);
      }
      yearGroups.get(record.year)!.push(record);
    }

    for (const [year, yearRecords] of yearGroups) {
      const uniqueStudents = new Set<string>();
      let band6Count = 0;

      for (const record of yearRecords) {
        uniqueStudents.add(`${record.firstName}-${record.lastName}`);
        band6Count += record.courses.length;
      }

      const stat: SchoolStat = {
        schoolName,
        year,
        band6Count,
        uniqueStudents: uniqueStudents.size
      };

      if (!statsMap.has(schoolName)) {
        statsMap.set(schoolName, []);
      }
      statsMap.get(schoolName)!.push(stat);
    }
  }

  return statsMap;
}

// Get all unique schools
export function getAllSchools(data: DistinguishedAchiever[]): string[] {
  const schools = new Set<string>();
  for (const record of data) {
    schools.add(record.schoolName);
  }
  return Array.from(schools).sort();
}

// Get available years
export function getAvailableYears(data: DistinguishedAchiever[]): number[] {
  const years = new Set<number>();
  for (const record of data) {
    years.add(record.year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

// Get top schools for a given year
export function getTopSchools(data: DistinguishedAchiever[], year: number, limit = 100): SchoolStat[] {
  const statsMap = getSchoolStatsByYear(data);
  const yearStats: SchoolStat[] = [];

  for (const [, stats] of statsMap) {
    const stat = stats.find(s => s.year === year);
    if (stat) {
      yearStats.push(stat);
    }
  }

  return yearStats.sort((a, b) => b.band6Count - a.band6Count).slice(0, limit);
}