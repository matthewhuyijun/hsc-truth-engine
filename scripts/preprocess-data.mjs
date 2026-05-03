import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data', 'csv');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'data');

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = [];
  const rows = [];

  // Parse header
  const headerCells = [];
  let inQuotes = false;
  let current = '';
  for (const char of lines[0]) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headerCells.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  headerCells.push(current.trim().replace(/^"|"$/g, ''));
  headers.push(...headerCells);

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const cells = [];
    inQuotes = false;
    current = '';
    for (const char of lines[i]) {
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
    rows.push(cells);
  }

  return { headers, rows };
}

// ============================================================
// 1. DISTINGUISHED ACHIEVERS (2001-2025)
// ============================================================
function loadDistinguishedAchievers() {
  const records = [];

  // 2017-2025 from NSW Gov CSV
  const nswGovDir = path.join(DATA_DIR, 'distinguished-achievers');
  if (fs.existsSync(nswGovDir)) {
    for (const file of fs.readdirSync(nswGovDir)) {
      if (!file.endsWith('.csv')) continue;
      const year = parseInt(file.replace('.csv', ''));
      const content = fs.readFileSync(path.join(nswGovDir, file), 'utf-8');
      const { headers, rows } = parseCSV(content);

      const firstIdx = headers.indexOf('first_name');
      const lastIdx = headers.indexOf('last_name');
      const schoolIdx = headers.indexOf('main_school_name');
      const coursesIdx = headers.indexOf('top_band_courses');

      for (const row of rows) {
        if (!row[firstIdx]) continue;
        records.push({
          year,
          firstName: row[firstIdx],
          lastName: row[lastIdx],
          schoolName: row[schoolIdx],
          courses: row[coursesIdx] || ''
        });
      }
    }
  }

  // 2001-2016 from Archive JSON
  // Archive format: each row is [student_name, school_name, courses]
  // Some rows are "range" rows that span multiple students: ['Name1 to Name2', 'Name3 to Name4', '']
  // These are table page headers, not individual records — skip them.
  const archiveDir = path.join(DATA_DIR, 'archive-distinguished');
  if (fs.existsSync(archiveDir)) {
    for (const file of fs.readdirSync(archiveDir)) {
      if (!file.endsWith('.json')) continue;
      const year = parseInt(file.replace('.json', ''));
      const content = fs.readFileSync(path.join(archiveDir, file), 'utf-8');
      const rows = JSON.parse(content);

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0] || !row[1]) continue;
        // Skip page navigation rows
        if (!row[0].includes(',')) continue;
        // Skip range rows — column 1 would be a name range, not a school name
        if (row[1].includes(' to ')) continue;
        const nameParts = row[0].split(',');
        if (nameParts.length < 2) continue;
        // Also skip if row[0] is a name range
        if (row[0].includes(' to ')) {
          // Some rows have single student in col 0 with range in col 1
          // Already handled by the skip above
          continue;
        }
        records.push({
          year,
          firstName: nameParts[1]?.trim() || '',
          lastName: nameParts[0]?.trim() || '',
          schoolName: row[1]?.trim() || '',
          courses: row[2] || ''
        });
      }
    }
  }

  return records;
}

// ============================================================
// 2. TOP ACHIEVERS (2002-2025)
// ============================================================
function loadTopAchievers() {
  const records = [];

  // 2017-2025 from CSV
  const taDir = path.join(DATA_DIR, 'top-achievers');
  if (fs.existsSync(taDir)) {
    for (const file of fs.readdirSync(taDir)) {
      if (!file.endsWith('.csv')) continue;
      const year = parseInt(file.replace('.csv', ''));
      const content = fs.readFileSync(path.join(taDir, file), 'utf-8');
      const { headers, rows } = parseCSV(content);

      const courseNumIdx = findHeaderIndex(headers, ['course_number', 'Course no']);
      const courseNameIdx = findHeaderIndex(headers, ['course_name', 'Course name']);
      const firstIdx = findHeaderIndex(headers, ['first_name', 'First name']);
      const lastIdx = findHeaderIndex(headers, ['last_name', 'Last name']);
      const placeIdx = findHeaderIndex(headers, ['place', 'Place']);
      const schoolIdx = findHeaderIndex(headers, ['school_name', 'School name']);

      for (const row of rows) {
        records.push({
          year,
          courseNumber: row[courseNumIdx]?.trim() || '',
          courseName: row[courseNameIdx] || '',
          firstName: row[firstIdx] || '',
          lastName: row[lastIdx] || '',
          place: parseInt(row[placeIdx]) || 0,
          schoolName: row[schoolIdx] || ''
        });
      }
    }
  }

  // 2002-2016 from Archive JSON
  const archiveDir = path.join(DATA_DIR, 'archive-top-achievers');
  if (fs.existsSync(archiveDir)) {
    for (const file of fs.readdirSync(archiveDir)) {
      if (!file.endsWith('.json')) continue;
      const year = parseInt(file.replace('.json', ''));
      const content = fs.readFileSync(path.join(archiveDir, file), 'utf-8');
      if (content.trim().length === 0) continue;
      const rows = JSON.parse(content);

      // Format varies by year. Check header to determine column order.
      // Modern (2012+): ['Course code', 'Course', 'First name', 'Last name', 'Place', 'School']
      // Older (2002-2011): ['\n  Course code', '\n  Course', '\nFirst name\n', '\nLast name\n', '\nPlace\n', '\nSchool']
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0] || !row[2]) continue;
        const cell0 = String(row[0]).trim();
        // Skip header rows
        if (cell0.includes('Course') || cell0.includes('code') || cell0 === '') continue;
        if (!/^\d{5}$/.test(cell0)) continue; // Must be a 5-digit course code
        
        records.push({
          year,
          courseNumber: cell0,
          courseName: String(row[1] || '').trim(),
          firstName: String(row[2] || '').trim(),   // column 2 = First name
          lastName: String(row[3] || '').trim(),    // column 3 = Last name
          place: parseInt(row[4]) || 0,             // column 4 = Place
          schoolName: String(row[4] ? row[5] : row[4] || '').trim() // column 5 or 4 = School
        });
      }
    }
  }

  return records;
}

// ============================================================
// 3. FIRST IN COURSE (2001-2025)
// ============================================================
function loadFirstInCourse() {
  const records = [];

  // 2017-2025 from CSV
  const ficDir = path.join(DATA_DIR, 'first-in-course');
  if (fs.existsSync(ficDir)) {
    for (const file of fs.readdirSync(ficDir)) {
      if (!file.endsWith('.csv')) continue;
      const year = parseInt(file.replace('.csv', ''));
      const content = fs.readFileSync(path.join(ficDir, file), 'utf-8');
      const { headers, rows } = parseCSV(content);

      const courseNumIdx = headers.indexOf('course_number');
      const courseNameIdx = headers.indexOf('course_name');
      const firstIdx = headers.indexOf('first_name');
      const lastIdx = headers.indexOf('last_name');
      const schoolIdx = headers.indexOf('school_name');

      for (const row of rows) {
        records.push({
          year,
          courseNumber: row[courseNumIdx]?.trim() || '',
          courseName: row[courseNameIdx] || '',
          firstName: row[firstIdx] || '',
          lastName: row[lastIdx] || '',
          schoolName: row[schoolIdx] || ''
        });
      }
    }
  }

  // 2001-2016 from Archive JSON
  const archiveDir = path.join(DATA_DIR, 'archive-first-in-course');
  if (fs.existsSync(archiveDir)) {
    for (const file of fs.readdirSync(archiveDir)) {
      if (!file.endsWith('.json')) continue;
      const year = parseInt(file.replace('.json', ''));
      const content = fs.readFileSync(path.join(archiveDir, file), 'utf-8');
      if (content.trim().length === 0) continue;
      const rows = JSON.parse(content);

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0] || !row[1]) continue;
        // Skip header rows and page breaks
        const cell0 = String(row[0]).trim();
        if (cell0.includes('Course') || cell0.includes('Number') || cell0 === '') continue;
        
        let courseNumber, courseName, firstName, lastName, schoolName;
        
        if (rows[i].length <= 4 || (cell0.length > 20 && cell0.includes(' '))) {
          // 4-column format (2011): [course name, first name, last name, school]
          courseNumber = '';  // No course code available
          courseName = String(row[0] || '').trim();
          firstName = String(row[1] || '').trim();
          lastName = String(row[2] || '').trim();
          schoolName = String(row[3] || '').trim();
        } else {
          // 5-column format (most years): [course#, course, first, last, school]
          courseNumber = String(row[0] || '').trim();
          courseName = String(row[1] || '').trim();
          firstName = String(row[2] || '').trim();
          lastName = String(row[3] || '').trim();
          schoolName = String(row[4] || '').trim();
        }

        records.push({ year, courseNumber, courseName, firstName, lastName, schoolName });
      }
    }
  }

  return records;
}

// ============================================================
// 4. ALL-ROUND ACHIEVERS (2001-2025)
// ============================================================
function loadAllRounders() {
  const records = [];

  // 2017-2025 from CSV
  const arDir = path.join(DATA_DIR, 'all-round-achievers');
  if (fs.existsSync(arDir)) {
    for (const file of fs.readdirSync(arDir)) {
      if (!file.endsWith('.csv')) continue;
      const year = parseInt(file.replace('.csv', ''));
      const content = fs.readFileSync(path.join(arDir, file), 'utf-8');
      const { headers, rows } = parseCSV(content);

      const firstIdx = headers.indexOf('first_name');
      const lastIdx = headers.indexOf('last_name');
      const schoolIdx = headers.indexOf('main_school_name');

      for (const row of rows) {
        if (!row[firstIdx]) continue;
        records.push({
          year,
          firstName: row[firstIdx],
          lastName: row[lastIdx],
          schoolName: row[schoolIdx] || ''
        });
      }
    }
  }

  // 2001-2016 from Archive JSON
  const archiveDir = path.join(DATA_DIR, 'archive-all-rounders');
  if (fs.existsSync(archiveDir)) {
    for (const file of fs.readdirSync(archiveDir)) {
      if (!file.endsWith('.json')) continue;
      const year = parseInt(file.replace('.json', ''));
      const content = fs.readFileSync(path.join(archiveDir, file), 'utf-8');
      if (content.trim().length === 0) continue;
      const rows = JSON.parse(content);

      // Format varies. 2016 format: ["First name/s", "Family name", "Gender", "School name"]
      // 2001 format: same but with page breaks
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 4) continue;
        if (row[0].includes('First') || row[0].includes('name')) continue;
        if (!row[0]?.trim() || !row[1]?.trim()) continue;
        // Skip page navigation
        if (row[0].includes('to')) continue;
        records.push({
          year,
          firstName: row[0]?.trim() || '',
          lastName: row[1]?.trim() || '',
          schoolName: row[3]?.trim() || ''
        });
      }
    }
  }

  return records;
}

// ============================================================
// 5. COURSE NAME MAP (from first-in-course + top-achievers)
// ============================================================
function buildCourseNameMap(firstInCourse, topAchievers) {
  const map = {}; // code -> { name: string, years: Set }

  for (const r of firstInCourse) {
    if (!r.courseNumber) continue;
    if (!map[r.courseNumber]) {
      map[r.courseNumber] = { names: new Set(), years: new Set() };
    }
    map[r.courseNumber].names.add(r.courseName);
    map[r.courseNumber].years.add(r.year);
  }

  for (const r of topAchievers) {
    if (!r.courseNumber) continue;
    if (!map[r.courseNumber]) {
      map[r.courseNumber] = { names: new Set(), years: new Set() };
    }
    map[r.courseNumber].names.add(r.courseName);
    map[r.courseNumber].years.add(r.year);
  }

  // Simplify
  const result = {};
  for (const [code, info] of Object.entries(map)) {
    result[code] = {
      name: Array.from(info.names)[0] || '',
      allNames: Array.from(info.names),
      years: Array.from(info.years).sort((a, b) => a - b)
    };
  }

  return result;
}

// ============================================================
// 6. AGGREGATION
// ============================================================

function aggregateSchools(distinguished) {
  const schoolMap = new Map();

  for (const r of distinguished) {
    if (!schoolMap.has(r.schoolName)) {
      schoolMap.set(r.schoolName, { name: r.schoolName, years: {} });
    }
    const school = schoolMap.get(r.schoolName);
    if (!school.years[r.year]) {
      school.years[r.year] = {
        band6Count: 0,
        uniqueStudents: 0,
        studentSet: new Set()
      };
    }
    const y = school.years[r.year];
    const key = `${r.firstName}-${r.lastName}`;
    if (!y.studentSet.has(key)) {
      y.studentSet.add(key);
      y.uniqueStudents++;
    }
    // Count each course as a separate B6 achievement
    const codes = (r.courses || '').match(/\b(\d{5})\b/g);
    y.band6Count += codes ? codes.length : 1;
  }

  // Remove studentSet (not serializable)
  const result = [];
  for (const [, school] of schoolMap) {
    const years = {};
    for (const [year, data] of Object.entries(school.years)) {
      years[year] = {
        band6Count: data.band6Count,
        uniqueStudents: data.uniqueStudents
      };
    }
    result.push({ name: school.name, years });
  }

  return result;
}

function aggregateStateRanks(firstInCourse, topAchievers) {
  // Count ALL state ranks per school per year
  // First in Course = rank 1. Top Achievers = all ranked placements.
  // Deduplicate: don't double-count rank 1 entries that appear in both datasets
  const schoolMap = new Map(); // schoolName -> { year -> count }

  for (const r of firstInCourse) {
    if (!r.schoolName) continue;
    if (!schoolMap.has(r.schoolName)) {
      schoolMap.set(r.schoolName, {});
    }
    const school = schoolMap.get(r.schoolName);
    school[r.year] = (school[r.year] || 0) + 1;
  }

  // Also count top achievers (but skip place=1 since they're in firstInCourse)
  // For archive data where place=0 (unknown), count everything
  for (const r of topAchievers) {
    if (!r.schoolName) continue;
    if (r.place === 1) continue; // Already counted in firstInCourse
    if (!schoolMap.has(r.schoolName)) {
      schoolMap.set(r.schoolName, {});
    }
    const school = schoolMap.get(r.schoolName);
    school[r.year] = (school[r.year] || 0) + 1;
  }

  return schoolMap;
}

function aggregateAllRounders(allRounders) {
  // Count all-rounders per school per year
  const schoolMap = new Map();

  for (const r of allRounders) {
    if (!r.schoolName) continue;
    if (!schoolMap.has(r.schoolName)) {
      schoolMap.set(r.schoolName, {});
    }
    const school = schoolMap.get(r.schoolName);
    school[r.year] = (school[r.year] || 0) + 1;
  }

  return schoolMap;
}

function aggregateCourses(distinguished) {
  // Count band6 achievements per course per year
  const courseMap = new Map(); // code -> { name, years: { year: count } }

  // Extract course codes from the courses string
  for (const r of distinguished) {
    if (!r.courses) continue;
    // Course format varies: "15155 - English EAL/D" or " 15240 - Math 15330 - Physics"
    const codes = r.courses.match(/\b(\d{5})\b/g);
    if (!codes) continue;
    for (const code of codes) {
      if (!courseMap.has(code)) {
        courseMap.set(code, { years: {} });
      }
      const c = courseMap.get(code);
      c.years[r.year] = (c.years[r.year] || 0) + 1;
    }
  }

  return courseMap;
}

// ============================================================
// 7. SLUG UTILITY & SPaRO LOADING
// ============================================================

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function findHeaderIndex(headers, candidates) {
  for (const candidate of candidates) {
    const idx = headers.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  return -1;
}

// ============================================================
// 10. COURSE GROUPS (legacy code relationships)
// ============================================================

function generateCourseGroups(coursesMap, courseNames) {
  // Known course code replacements from NESA syllabus changes
  const legacyPairs = [
    { canonical: '15255', legacy: ['15240'] },                 // Mathematics → Mathematics Advanced (2020)
    { canonical: '15236', legacy: ['15235', '15230'] },        // General Math → Math General 2 → Math Standard 2
    { canonical: '15155', legacy: ['15150'] },                 // English ESL → English EAL/D (2019)
    { canonical: '15365', legacy: ['15360'] },                 // Software Design → Software Engineering (2025)
    { canonical: '15557', legacy: ['15560', '15555'] },        // Chinese Background/Heritage → Chinese in Context (2017)
    { canonical: '15565', legacy: ['15560', '15555'] },        // Chinese Background/Heritage → Chinese and Literature (2017)
    { canonical: '15837', legacy: ['15840', '15835'] },        // Japanese Background/Heritage → Japanese in Context (2017)
    { canonical: '15845', legacy: ['15840', '15835'] },        // Japanese Background/Heritage → Japanese and Literature (2017)
    { canonical: '15887', legacy: ['15890', '15885'] },        // Korean Background/Heritage → Korean in Context (2017)
    { canonical: '15895', legacy: ['15890', '15885'] },        // Korean Background/Heritage → Korean and Literature (2017)
    { canonical: '15767', legacy: ['15770', '15765'] },        // Indonesian Background/Heritage → Indonesian in Context (2017)
    { canonical: '15775', legacy: ['15770', '15765'] },        // Indonesian Background/Heritage → Indonesian and Literature (2017)
    { canonical: '16015', legacy: ['16010'] },                 // Persian Background → Persian Continuers (2019)
    { canonical: '16045', legacy: ['16040'] },                 // Russian Background → Russian Continuers (2015)
    { canonical: '26299', legacy: ['16305'] },                 // Construction Exam (VET renumber)
    { canonical: '26199', legacy: ['16745'] },                 // Business Services Exam (VET renumber)
    { canonical: '26499', legacy: ['16945'] },                 // Entertainment Exam (VET renumber)
    { canonical: '26899', legacy: ['17195'] },                 // Primary Industries Exam (VET renumber)
    { canonical: '26999', legacy: ['16995'] },                 // Retail Services Exam (VET renumber)
    { canonical: '26098', legacy: ['26079'] },                 // Automotive Exam (VET renumber)
    { canonical: '26579', legacy: ['26599'] },                 // Hospitality Exam (VET renumber)
    { canonical: '27499', legacy: ['27099'] },                 // Tourism Exam (VET renumber)
    { canonical: '27398', legacy: ['27379', '27399'] },        // IT Digital Exam (VET renumber)
  ];
  const discontinued = ['15340', '15210'];  // Senior Science, IPT

  const groups = [];
  const covered = new Set();

  // Build legacy code groups
  for (const { canonical, legacy } of legacyPairs) {
    const cn = courseNames[canonical] || {};
    const canonicalName = cn.name || canonical;
    const codes = [];

    for (const code of [...legacy, canonical]) {
      const info = coursesMap.get(code);
      if (info) {
        const years = Object.keys(info.years).map(Number).sort((a, b) => a - b);
        const name = courseNames[code]?.name || code;
        codes.push({ code, name, years: [years[0], years[years.length - 1]] });
        covered.add(code);
      }
    }

    // Sort by chronological order (first year ascending)
    codes.sort((a, b) => a.years[0] - b.years[0]);

    groups.push({ id: `group-${canonical}`, canonical_name: canonicalName, canonical_code: canonical, codes });
  }

  // Discontinued
  for (const code of discontinued) {
    const info = coursesMap.get(code);
    if (info) {
      const years = Object.keys(info.years).map(Number).sort((a, b) => a - b);
      const name = courseNames[code]?.name || code;
      groups.push({
        id: `discontinued-${code}`, canonical_name: name, canonical_code: code, discontinued: true,
        codes: [{ code, name, years: [years[0], years[years.length - 1]] }]
      });
      covered.add(code);
    }
  }

  // Remaining singletons
  for (const [code, info] of coursesMap) {
    if (covered.has(code)) continue;
    const years = Object.keys(info.years).map(Number).sort((a, b) => a - b);
    const name = courseNames[code]?.name || code;
    groups.push({
      id: `course-${code}`, canonical_name: name, canonical_code: code,
      codes: [{ code, name, years: [years[0], years[years.length - 1]] }]
    });
  }

  return groups;
}

function loadSparoData() {
  const sparoDir = path.join(ROOT_DIR, 'data', 'sparo');
  const result = {}; // year -> { slug -> { name, subjects } }

  if (!fs.existsSync(sparoDir)) return result;

  for (const file of fs.readdirSync(sparoDir)) {
    const match = file.match(/sparo_hsc_(\d{4})\.json$/);
    if (!match) continue;
    const year = parseInt(match[1]);
    const content = fs.readFileSync(path.join(sparoDir, file), 'utf-8');
    const data = JSON.parse(content);

    result[year] = {};
    for (const [, entry] of Object.entries(data)) {
      const slug = slugify(entry.name);
      result[year][slug] = { name: entry.name, subjects: entry.subjects || [] };
    }
  }

  return result;
}

// ============================================================
// 8. SCHOOL DETAIL FILES (school-detail-{year}.json)
// ============================================================

function parseCourseFromField(coursesStr) {
  const m = coursesStr.match(/^(\d{5})\s*[-–]\s*(.+)/);
  if (m) return { code: m[1], name: m[2].trim() };
  // Fallback: just extract the 5-digit code
  const codeMatch = coursesStr.match(/(\d{5})/);
  return codeMatch ? { code: codeMatch[1], name: '' } : null;
}

function generateSchoolDetail(year, distinguished, topAchievers, allRounders, sparoYearMap) {
  const daYear = distinguished.filter(r => r.year === year);

  if (daYear.length === 0) return {};

  const taYear = topAchievers.filter(r => r.year === year);
  const arYear = allRounders.filter(r => r.year === year);

  // Build all-rounder set for O(1) lookup
  const arSet = new Set();
  for (const r of arYear) {
    arSet.add(`${r.firstName}|${r.lastName}|${r.schoolName}`);
  }

  // Build top-achiever lookup: courseNumber|firstName|lastName -> [place, school]
  // Also build a version with school for preferred matching
  const taMapByName = new Map(); // "course|firstName|lastName" -> [{place, school}, ...]
  const taBySchool = new Map(); // schoolName -> stateRankCount
  for (const r of taYear) {
    const nameKey = `${r.courseNumber}|${r.firstName}|${r.lastName}`;
    if (!taMapByName.has(nameKey)) taMapByName.set(nameKey, []);
    taMapByName.get(nameKey).push({ place: r.place, school: r.schoolName, used: false });
    taBySchool.set(r.schoolName, (taBySchool.get(r.schoolName) || 0) + 1);
  }

  const schools = new Map(); // schoolName -> school detail

  for (const r of daYear) {
    const course = parseCourseFromField(r.courses);
    if (!course) continue;

    const name = r.schoolName;
    if (!schools.has(name)) {
      schools.set(name, {
        name,
        students: new Map(), // "firstName|lastName" -> student
        courses: new Map(),  // courseCode -> course aggregate
        stats: { band6Count: 0, uniqueStudents: 0, stateRanks: 0, allRounders: 0 }
      });
    }
    const school = schools.get(name);

    const studentKey = `${r.firstName}|${r.lastName}`;
    const isAllRounder = arSet.has(`${r.firstName}|${r.lastName}|${r.schoolName}`);

    let student;
    if (school.students.has(studentKey)) {
      student = school.students.get(studentKey);
    } else {
      student = {
        firstName: r.firstName,
        lastName: r.lastName,
        courses: [],
        b6Count: 0,
        stateRankCount: 0,
        isAllRounder
      };
      if (isAllRounder) school.stats.allRounders++;
      school.students.set(studentKey, student);
      school.stats.uniqueStudents++;
    }

    // Look up state rank: prefer matching on school name, then fall back to name-only
    const nameKey = `${course.code}|${r.firstName}|${r.lastName}`;
    const candidates = taMapByName.get(nameKey) || [];
    let rank = 0;
    for (let i = 0; i < candidates.length; i++) {
      if (candidates[i].used) continue;
      if (candidates[i].school === r.schoolName) {
        rank = candidates[i].place;
        candidates[i].used = true;
        break;
      }
    }
    if (rank === 0) {
      for (let i = 0; i < candidates.length; i++) {
        if (!candidates[i].used) {
          rank = candidates[i].place;
          candidates[i].used = true;
          break;
        }
      }
    }

    student.courses.push({ code: course.code, name: course.name, rank });
    student.b6Count++;
    if (rank > 0) student.stateRankCount++;

    school.stats.band6Count++;

    // Course aggregate
    if (!school.courses.has(course.code)) {
      school.courses.set(course.code, {
        code: course.code,
        name: course.name,
        band6Count: 0,
        stateRanks: []
      });
    }
    const ca = school.courses.get(course.code);
    ca.band6Count++;
    if (rank > 0) ca.stateRanks.push(rank);
  }

  // Finalize: add stateRank count, sort, convert to plain objects
  const result = {};
  for (const [, school] of schools) {
    school.stats.stateRanks = taBySchool.get(school.name) || 0;

    // Sort stateRanks ascending
    for (const [, course] of school.courses) {
      course.stateRanks.sort((a, b) => a - b);
    }

    const slug = slugify(school.name);

    // SPaRO data for this school
    let sparoEntry = null;
    if (sparoYearMap) {
      const s = sparoYearMap[slug];
      if (s) sparoEntry = { subjects: s.subjects };
    }

    // Convert students Map to array, sorted by b6Count desc then lastName asc
    const studentsArr = [];
    for (const [, s] of school.students) {
      studentsArr.push({
        firstName: s.firstName,
        lastName: s.lastName,
        courses: s.courses.sort((a, b) => a.code.localeCompare(b.code)),
        b6Count: s.b6Count,
        stateRankCount: s.stateRankCount,
        isAllRounder: s.isAllRounder
      });
    }
    studentsArr.sort((a, b) => {
      if (b.b6Count !== a.b6Count) return b.b6Count - a.b6Count;
      return a.lastName.localeCompare(b.lastName);
    });

    // Convert courses Map to array, sorted by band6Count desc
    const coursesArr = [];
    for (const [, c] of school.courses) {
      coursesArr.push({
        code: c.code,
        name: c.name,
        band6Count: c.band6Count,
        stateRanks: c.stateRanks
      });
    }
    coursesArr.sort((a, b) => b.band6Count - a.band6Count);

    result[slug] = {
      name: school.name,
      stats: school.stats,
      students: studentsArr,
      courses: coursesArr,
      sparo: sparoEntry
    };
  }

  return result;
}

// ============================================================
// 9. STUDENTS LIST (students-{year}.json)
// ============================================================

function generateStudentsList(schoolDetail) {
  const students = [];
  for (const [slug, school] of Object.entries(schoolDetail)) {
    for (const s of school.students) {
      students.push({
        firstName: s.firstName,
        lastName: s.lastName,
        schoolName: school.name,
        schoolSlug: slug,
        b6Count: s.b6Count,
        stateRankCount: s.stateRankCount,
        isAllRounder: s.isAllRounder
      });
    }
  }
  // Primary sort: state rank count desc; tiebreaker: b6Count desc; final tiebreaker: lastName asc
  students.sort((a, b) => {
    if (b.stateRankCount !== a.stateRankCount) return b.stateRankCount - a.stateRankCount;
    if (b.b6Count !== a.b6Count) return b.b6Count - a.b6Count;
    return a.lastName.localeCompare(b.lastName);
  });
  return students;
}

// ============================================================
// 10. SPaRO SCHOOLS (sparo-schools.json)
// ============================================================

function generateSparoSchools(sparoData) {
  // sparoData: { year -> { slug -> { name, subjects } } }
  // Take the latest year's data for each school
  const years = Object.keys(sparoData).map(Number).sort((a, b) => b - a);
  const result = {};

  for (const year of years) {
    for (const [slug, entry] of Object.entries(sparoData[year])) {
      if (!result[slug]) {
        result[slug] = { name: entry.name, subjects: entry.subjects };
      }
    }
  }

  return result;
}

// ============================================================
// MAIN
// ============================================================

console.log('=== HSC Truth Engine — Data Preprocessing ===\n');

console.log('📊 Loading Distinguished Achievers...');
const distinguished = loadDistinguishedAchievers();
console.log(`   ${distinguished.length} records`);

console.log('🏆 Loading Top Achievers...');
const topAchievers = loadTopAchievers();
console.log(`   ${topAchievers.length} records`);

console.log('🥇 Loading First in Course...');
const firstInCourse = loadFirstInCourse();
console.log(`   ${firstInCourse.length} records`);

console.log('🌟 Loading All-Round Achievers...');
const allRounders = loadAllRounders();
console.log(`   ${allRounders.length} records`);

console.log('🏥 Loading SPaRO data...');
const sparoData = loadSparoData();
console.log(`   ${Object.keys(sparoData).length} year files loaded`);

console.log('\n📋 Building course name map...');
const courseNames = buildCourseNameMap(firstInCourse, topAchievers);
console.log(`   ${Object.keys(courseNames).length} courses`);

console.log('🏫 Aggregating schools...');
const schools = aggregateSchools(distinguished);
console.log(`   ${schools.length} schools`);

console.log('📈 Aggregating state ranks...');
const stateRanks = aggregateStateRanks(firstInCourse, topAchievers);

console.log('🌟 Aggregating all-rounders...');
const allRounderCounts = aggregateAllRounders(allRounders);

console.log('📚 Aggregating courses...');
const courses = aggregateCourses(distinguished);

// Apply course names
for (const [code, info] of courses) {
  const cn = courseNames[code];
  if (cn) {
    info.name = cn.name;
  } else {
    // Extract name from the first distinguished record's courses field
    const record = distinguished.find(r => {
      const m = r.courses.match(/^(\d{5})\s*[-–]\s*(.+)/);
      return m && m[1] === code;
    });
    if (record) {
      const m = record.courses.match(/^(\d{5})\s*[-–]\s*(.+)/);
      info.name = m ? m[2] : code;
    } else {
      info.name = code;
    }
  }
}

// Get available years
const yearsSet = new Set();
for (const r of distinguished) yearsSet.add(r.year);
for (const r of topAchievers) yearsSet.add(r.year);
const allYears = Array.from(yearsSet).sort((a, b) => b - a);

// Only output school/course summary for years with complete data
// Pre-2001 is pre-HSC (old syllabus). All archive data is complete.
const validYears = allYears.filter(y => y >= 2001);
console.log(`\n📅 All years in data: ${allYears.join(', ')}`);
console.log(`📅 Valid years (complete data): ${validYears.join(', ')}`);

// ============================================================
// OUTPUT
// ============================================================
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// schools-{year}.json — enhanced with uniqueStudents and stateRanks
for (const year of validYears) {
  const yearSchools = schools
    .filter(s => s.years[year])
    .map(s => ({
      name: s.name,
      band6Count: s.years[year].band6Count,
      uniqueStudents: s.years[year].uniqueStudents,
      stateRanks: (stateRanks.get(s.name) || {})[year] || 0,
      allRounders: (allRounderCounts.get(s.name) || {})[year] || 0
    }))
    .sort((a, b) => b.band6Count - a.band6Count);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, `schools-${year}.json`),
    JSON.stringify(yearSchools)
  );
  console.log(`   schools-${year}.json: ${yearSchools.length} schools`);
}

// Generate course groups (needed for merged courses.json below)
const courseGroups = generateCourseGroups(courses, courseNames);

// courses-{year}.json
for (const year of validYears) {
  const yearCourses = [];
  for (const [code, info] of courses) {
    if (info.years[year]) {
      yearCourses.push({
        code,
        name: info.name,
        band6Count: info.years[year]
      });
    }
  }
  yearCourses.sort((a, b) => b.band6Count - a.band6Count);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, `courses-${year}.json`),
    JSON.stringify(yearCourses)
  );
  console.log(`   courses-${year}.json: ${yearCourses.length} courses`);
}

// courses.json — all courses with yearly data (merged: legacy codes rolled into canonical)
console.log('\n📚 Merging legacy course data...');
const mergedCourses = new Map(courses); // copy

// Merge legacy code years into canonical codes using course groups
for (const group of courseGroups) {
  const canonical = group.canonical_code;
  const canonicalInfo = mergedCourses.get(canonical);
  if (!canonicalInfo) continue;

  for (const legacy of group.codes) {
    if (legacy.code === canonical) continue;
    const legacyInfo = courses.get(legacy.code);
    if (!legacyInfo) continue;

    for (const [year, count] of Object.entries(legacyInfo.years)) {
      canonicalInfo.years[year] = (canonicalInfo.years[year] || 0) + count;
    }
    
    // Also update course name map for legacy codes
    if (courseNames[legacy.code]) {
      if (!courseNames[canonical]?.allNames) {
        if (!courseNames[canonical]) courseNames[canonical] = { name: canonicalInfo.name, allNames: [] };
        courseNames[canonical].allNames = [canonicalInfo.name];
      }
      courseNames[canonical].allNames.push(legacy.name);
    }
  }
}

const allCourses = [];
for (const [code, info] of mergedCourses) {
  const yearlyData = Object.entries(info.years)
    .map(([y, c]) => ({ year: parseInt(y), band6Count: c }))
    .filter(d => validYears.includes(d.year));
  if (yearlyData.length === 0) continue;

  const cn = courseNames[code];
  allCourses.push({
    code,
    name: cn?.name || info.name,
    allNames: cn?.allNames || [info.name],
    years: yearlyData
  });
}
allCourses.sort((a, b) => a.name.localeCompare(b.name));
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'courses.json'),
  JSON.stringify(allCourses)
);
console.log(`   courses.json: ${allCourses.length} courses (legacy years merged)`);

// course-names.json — code -> latest name mapping
const courseNameObj = {};
for (const [code, info] of Object.entries(courseNames)) {
  courseNameObj[code] = info.name;
}
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'course-names.json'),
  JSON.stringify(courseNameObj)
);
console.log(`   course-names.json: ${Object.keys(courseNameObj).length} courses`);

// schools.json — all school names sorted
const allSchoolNames = schools.map(s => s.name).sort();
fs.writeFileSync(path.join(OUTPUT_DIR, 'schools.json'), JSON.stringify(allSchoolNames));
console.log(`   schools.json: ${allSchoolNames.length} schools`);

// years.json
fs.writeFileSync(path.join(OUTPUT_DIR, 'years.json'), JSON.stringify(validYears));
console.log(`   years.json: ${validYears.length} years`);

// school-stats.json — comprehensive school data for detail pages
const schoolStats = schools
  .filter(s => Object.keys(s.years).length >= 1)
  .map(s => ({
    name: s.name,
    years: s.years
  }));
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'school-stats.json'),
  JSON.stringify(schoolStats)
);
console.log(`   school-stats.json: ${schoolStats.length} schools`);

// school-detail-{year}.json — per-school detail pages
console.log('\n🏫 Generating school detail files...');
for (const year of validYears) {
  const sparoYearMap = sparoData[year] || null;
  const detail = generateSchoolDetail(year, distinguished, topAchievers, allRounders, sparoYearMap);
  const outPath = path.join(OUTPUT_DIR, `school-detail-${year}.json`);
  fs.writeFileSync(outPath, JSON.stringify(detail));
  console.log(`   school-detail-${year}.json: ${Object.keys(detail).length} schools`);
}

// students-{year}.json — all students ranked by stateRank + b6Count
console.log('\n🎓 Generating students list files...');
for (const year of validYears) {
  const sparoYearMap = sparoData[year] || null;
  const detail = generateSchoolDetail(year, distinguished, topAchievers, allRounders, sparoYearMap);
  const students = generateStudentsList(detail);
  const outPath = path.join(OUTPUT_DIR, `students-${year}.json`);
  fs.writeFileSync(outPath, JSON.stringify(students));
  console.log(`   students-${year}.json: ${students.length} students`);
}

// sparo-schools.json — flattened SPaRO data keyed by slug
console.log('\n🏥 Generating SPaRO schools file...');
const sparoSchools = generateSparoSchools(sparoData);
fs.writeFileSync(path.join(OUTPUT_DIR, 'sparo-schools.json'), JSON.stringify(sparoSchools));
console.log(`   sparo-schools.json: ${Object.keys(sparoSchools).length} schools`);

// course-groups.json — legacy course code relationships
console.log('\n🔗 Writing course groups...');
fs.writeFileSync(path.join(OUTPUT_DIR, 'course-groups.json'), JSON.stringify(courseGroups));
console.log(`   course-groups.json: ${courseGroups.length} groups (${courseGroups.filter(g => g.codes.length > 1).length} with legacy codes)`);

console.log('\n✅ Done!');
