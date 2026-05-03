import fs from 'fs';
import path from 'path';

const SEX_DIR = path.join(process.cwd(), 'data', 'csv', 'student-entries-by-sex');
const BAND_DIR = path.join(process.cwd(), 'data', 'csv', 'band-performance-detail');
const OUT_DIR = path.join(process.cwd(), 'public', 'data');

function extractCode(name) {
  const match = name.match(/\((\d+)\)/);
  return match ? match[1] : null;
}

function cleanName(name) {
  return name.replace(/\s+\d+\s*(unit|Unit)\s*\(?\d+\)?/, '').trim();
}

function parseValue(val) {
  if (val === '&nbsp;' || val === '' || val === undefined || val === null) return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

function loadSexData(year) {
  const file = path.join(SEX_DIR, `${year}.json`);
  if (!fs.existsSync(file)) {
    console.error(`  Missing sex data for ${year}`);
    return null;
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const result = {};
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const name = String(row[0]).trim();
    const code = extractCode(name);
    if (!code) continue;
    const male = parseValue(row[2]);
    const female = parseValue(row[3]);
    const non_binary = parseValue(row[4]);
    const total = parseValue(row[5]);
    result[code] = {
      name: cleanName(name),
      total,
      male,
      female,
      non_binary,
    };
  }
  return result;
}

function loadBandData(year) {
  const file = path.join(BAND_DIR, `${year}.json`);
  if (!fs.existsSync(file)) {
    console.error(`  Missing band detail for ${year}`);
    return null;
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const result = {};
  for (const entry of raw) {
    if (!entry.course) continue;
    const code = extractCode(entry.course);
    if (!code) continue;
    const bands = {};
    for (const key of Object.keys(entry)) {
      if (key.startsWith('Band ')) {
        bands[key] = entry[key];
      }
    }
    if (Object.keys(bands).length > 0) {
      result[code] = bands;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const years = Array.from({ length: 26 }, (_, i) => 2000 + i);

  for (const year of years) {
    process.stdout.write(`${year}... `);
    const sexData = loadSexData(year);
    if (!sexData) {
      console.log('SKIPPED (no sex data)');
      continue;
    }
    const bandData = loadBandData(year);

    for (const [code, entry] of Object.entries(sexData)) {
      if (bandData && bandData[code]) {
        entry.bands = bandData[code];
      }
    }

    const outFile = path.join(OUT_DIR, `course-stats-${year}.json`);
    fs.writeFileSync(outFile, JSON.stringify(sexData));
    const bandCount = bandData ? Object.keys(bandData).length : 0;
    console.log(`OK (${Object.keys(sexData).length} courses, ${bandCount} with bands)`);
  }
  console.log('\nDone!');
}

main();
