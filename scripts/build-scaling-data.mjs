import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const scalingDataPath = resolve(__dirname, "../../scaling-data/scaling-data.json");
const a3_2025Path = resolve(__dirname, "../src/data/table_a3_2025.json");
const outputAllPath = resolve(__dirname, "../src/data/table_a3_all_years.json");
const outputIndexPath = resolve(__dirname, "../src/data/course_year_index.json");

const scalingData = JSON.parse(readFileSync(scalingDataPath, "utf8"));
const a3_2025 = JSON.parse(readFileSync(a3_2025Path, "utf8"));

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

for (const [year, data] of Object.entries(scalingData)) {
  output[year] = {
    courses: data.table_a3.map(normalizeScalingEntry),
  };
  for (const entry of data.table_a3) {
    if (!courseIndex[entry.course]) courseIndex[entry.course] = {};
    courseIndex[entry.course][year] = true;
  }
}

output["2025"] = {
  courses: a3_2025.courses.map(normalizeScalingEntry),
};
for (const entry of a3_2025.courses) {
  if (!courseIndex[entry.course]) courseIndex[entry.course] = {};
  courseIndex[entry.course]["2025"] = true;
}

writeFileSync(outputAllPath, JSON.stringify(output, null, 2));
writeFileSync(outputIndexPath, JSON.stringify(courseIndex, null, 2));

const totalCourses = Object.keys(courseIndex).length;
const totalEntries = Object.values(output).reduce((sum, y) => sum + y.courses.length, 0);
console.log(`Wrote ${totalEntries} entries across ${Object.keys(output).length} years (${totalCourses} unique courses)`);
console.log(`  -> ${outputAllPath}`);
console.log(`  -> ${outputIndexPath}`);
