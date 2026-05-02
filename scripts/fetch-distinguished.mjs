import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BATCH_SIZE = 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const years = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];

async function fetchWithRetry(url, body, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': UA,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.log(`  Retry ${i + 1}/${retries}: ${err.message}`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Failed after retries');
}

async function fetchAllRecords(year) {
  // NESA has inconsistent index naming patterns
  const INDEX_OVERRIDES = {
    2018: 'prod_nesa_2018_hsc_distinguished_achievers_rectified',
    2021: 'prod_nesa_2021_hsc_distinguished_achievers_0',
  };
  const index = INDEX_OVERRIDES[year] || `prod_nesa_${year}_hsc_distinguished_achievers`;
  const url = `https://www.nsw.gov.au/api/v1/elasticsearch/${index}/_search`;
  const allRecords = [];
  let searchAfter = null;
  let total = 0;

  console.log(`\n📥 Fetching ${year} Distinguished Achievers...`);

  while (true) {
    const body = {
      size: BATCH_SIZE,
      query: { match_all: {} },
      sort: [{ "@delta": "asc" }],
      track_total_hits: true
    };
    if (searchAfter) body.search_after = searchAfter;

    const data = await fetchWithRetry(url, body);
    const hits = data.hits.hits;
    const totalEstimate = data.hits.total?.value || data.hits.total || 0;

    if (allRecords.length === 0) {
      total = totalEstimate;
      console.log(`  Total records: ${total}`);
    }

    if (hits.length === 0) break;

    for (const hit of hits) {
      const src = hit._source;
      allRecords.push({
        year,
        first_name: src.first_name || '',
        last_name: src.last_name || '',
        main_school_name: src.main_school_name || '',
        top_band_courses: src.top_band_courses || ''
      });
    }

    searchAfter = hits[hits.length - 1].sort;
    console.log(`  Downloaded ${allRecords.length.toLocaleString()}/${total.toLocaleString()} (+${hits.length})`);

    if (hits.length < BATCH_SIZE) break;
    if (allRecords.length >= total) break;
  }

  return allRecords;
}

function saveToCSV(records, year) {
  const dir = path.join(ROOT_DIR, 'data', 'csv', 'distinguished-achievers');
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${year}.csv`);
  const headers = 'year,first_name,last_name,main_school_name,top_band_courses\n';
  const rows = records.map(r =>
    `"${r.year}","${r.first_name}","${r.last_name}","${r.main_school_name}","${r.top_band_courses}"`
  ).join('\n');

  fs.writeFileSync(filePath, headers + rows);
  return filePath;
}

async function main() {
  console.log('🚀 Starting Distinguished Achievers fetch...\n');

  for (const year of years) {
    try {
      const records = await fetchAllRecords(year);
      const filePath = saveToCSV(records, year);
      console.log(`  ✅ Saved to: ${filePath}`);
      console.log(`  Records: ${records.length}`);
    } catch (err) {
      console.error(`  ❌ Error fetching ${year}: ${err.message}`);
    }
  }

  console.log('\n✨ All done!');
}

main().catch(console.error);