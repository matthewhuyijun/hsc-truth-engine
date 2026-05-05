import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const scalingDataPath = resolve(__dirname, "../research/scaling-data/scaling-v2-output.json");
const outputAllPath = resolve(__dirname, "../src/data/table_a3_all_years.json");
const outputPercentilesPath = resolve(__dirname, "../src/data/scaling-percentiles.json");
const outputIndexPath = resolve(__dirname, "../src/data/course_year_index.json");

const scalingData = JSON.parse(readFileSync(scalingDataPath, "utf8"));

function normalizeScalingEntry(entry) {
  return {
    course: entry.course,
    number: entry.number,
    hsc_mean: entry.hsc_mean ?? entry.hsc?.mean,
    hsc_sd: entry.hsc_sd ?? entry.hsc?.sd,
    hsc_max: entry.hsc_max ?? entry.hsc?.max,
    scaled_mean: entry.scaled_mean ?? entry.scaled?.mean,
    scaled_sd: entry.scaled_sd ?? entry.scaled?.sd,
    scaled_max: entry.scaled_max ?? entry.scaled?.max,
  };
}

const output = {};
const courseIndex = {};
const percentileOutput = {};

for (const [year, data] of Object.entries(scalingData)) {
  // table_a3_all_years.json: ALL courses (flat format)
  output[year] = {
    courses: data.table_a3.map(normalizeScalingEntry),
  };
  for (const entry of data.table_a3) {
    if (!courseIndex[entry.course]) courseIndex[entry.course] = {};
    courseIndex[entry.course][year] = true;
  }

  // scaling-percentiles.json: courses WITH percentile data only
  const pctCourses = data.table_a3
    .filter((c) => c.hsc?.p99 != null && c.scaled?.p99 != null)
    .map((c) => ({
      course: c.course,
      number: c.number,
      hsc: {
        mean: c.hsc.mean,
        sd: c.hsc.sd,
        max: c.hsc.max,
        p99: c.hsc.p99,
        p90: c.hsc.p90,
        p75: c.hsc.p75,
        p50: c.hsc.p50,
        p25: c.hsc.p25,
      },
      scaled: {
        mean: c.scaled.mean,
        sd: c.scaled.sd,
        max: c.scaled.max,
        p99: c.scaled.p99,
        p90: c.scaled.p90,
        p75: c.scaled.p75,
        p50: c.scaled.p50,
        p25: c.scaled.p25,
      },
    }));
  if (pctCourses.length > 0) {
    percentileOutput[year] = { table_a3: pctCourses };
  }
}

writeFileSync(outputAllPath, JSON.stringify(output, null, 2));
writeFileSync(outputPercentilesPath, JSON.stringify(percentileOutput, null, 2));
writeFileSync(outputIndexPath, JSON.stringify(courseIndex, null, 2));

const totalCourses = Object.keys(courseIndex).length;
const totalEntries = Object.values(output).reduce((sum, y) => sum + y.courses.length, 0);
const totalPct = Object.values(percentileOutput).reduce((sum, y) => sum + y.table_a3.length, 0);
console.log(`Wrote ${totalEntries} entries (${totalPct} with percentiles) across ${Object.keys(output).length} years (${totalCourses} unique courses)`);
console.log(`  -> ${outputAllPath}`);
console.log(`  -> ${outputPercentilesPath}`);
console.log(`  -> ${outputIndexPath}`);
