import tableA3 from './src/data/table_a3_2025.json';
import tableA9 from './src/data/table_a9_2021_2025.json';

const courses = tableA3.courses;

function calculateScaledMark(course, hscMark) {
  const { hsc_mean, hsc_sd, scaled_mean, scaled_sd, hsc_max, scaled_max } = course;
  if (hscMark <= 0 || hsc_sd === 0) return 0;
  const cappedHsc = Math.min(hscMark, hsc_max ?? 50);
  const z = (cappedHsc - hsc_mean) / hsc_sd;
  let scaled = scaled_mean + z * scaled_sd;
  scaled = Math.max(0, Math.min(scaled, scaled_max ?? 50));
  return Math.round(scaled * 10) / 10;
}

console.log('HSC marks needed for scaled ~45:');
['English Advanced', 'Mathematics Advanced', 'Chemistry', 'Physics', 'Economics'].forEach(s => {
  const course = courses.find(c => c.course === s);
  const z = (45 - course.scaled_mean) / course.scaled_sd;
  const hsc = course.hsc_mean + z * course.hsc_sd;
  console.log('  ' + s + ': HSC ' + Math.round(hsc * 10) / 10);
});

const testMarks = [
  { name: 'English Advanced', hscMark: 85 },
  { name: 'Mathematics Advanced', hscMark: 88 },
  { name: 'Chemistry', hscMark: 86 },
  { name: 'Physics', hscMark: 84 },
  { name: 'Economics', hscMark: 82 },
];

const scaledMarks = testMarks.map(tm => {
  const course = courses.find(c => c.course === tm.name);
  return { name: tm.name, hsc: tm.hscMark, scaled: calculateScaledMark(course, tm.hscMark) };
});

console.log('\nTest student marks:');
scaledMarks.forEach(s => console.log('  ' + s.name + ': HSC ' + s.hsc + ' -> Scaled ' + s.scaled));

const total = scaledMarks.reduce((sum, s) => sum + s.scaled, 0);
console.log('\nTotal scaled (10 units): ' + total.toFixed(1));

const atarMapping = tableA9.data;
const year = '2025';
const points = [];
for (const [atarStr, yearData] of Object.entries(atarMapping)) {
  points.push({ atar: parseFloat(atarStr), agg: yearData[year] });
}
points.sort((a, b) => b.atar - a.atar);

for (let i = 0; i < points.length - 1; i++) {
  if (total <= points[i].agg && total >= points[i+1].agg) {
    const ratio = (total - points[i+1].agg) / (points[i].agg - points[i+1].agg);
    const preciseAtar = points[i+1].atar + ratio * (points[i].atar - points[i+1].atar);
    const roundedAtar = Math.round(preciseAtar * 20) / 20;
    console.log('ATAR: ' + roundedAtar + ' (range: ' + (roundedAtar - 0.05).toFixed(2) + ' - ' + (roundedAtar + 0.05).toFixed(2) + ')');
    break;
  }
}
