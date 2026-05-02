import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const baseUrl = 'https://www.boardofstudies.nsw.edu.au/ebos/static/';

const types = [
  { name: 'archive-distinguished', pattern: 'DSACH_{year}_12_A.html' },
  { name: 'archive-all-rounders', pattern: 'ALRND_{year}_12.html' },
  { name: 'archive-first-in-course', pattern: 'FSTIC_{year}_12.html' },
  { name: 'archive-top-achievers', pattern: 'TAINC_{year}_12.html' }
];

// Check which years exist for each type
async function checkYear(browser, url) {
  const page = await browser.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const status = response.status();
    await page.close();
    return status;
  } catch (err) {
    await page.close();
    return 0;
  }
}

async function scrapePage(browser, url, year) {
  const page = await browser.newPage();

  try {
    console.log(`  Loading ${year}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for DataTables to load
    await page.waitForTimeout(3000);

    // Extract table data
    const rows = await page.locator('table tr').all();

    const data = [];
    for (const row of rows) {
      const cells = await row.locator('td, th').allTextContents();
      if (cells.length > 0) {
        data.push(cells);
      }
    }

    console.log(`    Found ${data.length} rows`);
    await page.close();
    return data;

  } catch (err) {
    console.log(`    Error: ${err.message}`);
    await page.close();
    return null;
  }
}

async function main() {
  console.log('🚀 Starting archive scraper...\n');

  const browser = await chromium.launch({ headless: true });

  // First, find available years for Distinguished Achievers (they have _A suffix for some years)
  console.log('Checking available years...');

  // For Distinguished Achievers, check both patterns
  const daYears = [];
  for (let year = 2016; year >= 2001; year--) {
    const urlA = baseUrl + `DSACH_${year}_12_A.html`;
    const urlB = baseUrl + `DSACH_${year}_12.html`;
    const statusA = await checkYear(browser, urlA);
    const statusB = await checkYear(browser, urlB);
    if (statusA === 200) {
      daYears.push({ year, pattern: `DSACH_${year}_12_A.html` });
      console.log(`  ${year}: DSACH_${year}_12_A.html ✓`);
    } else if (statusB === 200) {
      daYears.push({ year, pattern: `DSACH_${year}_12.html` });
      console.log(`  ${year}: DSACH_${year}_12.html ✓`);
    } else {
      console.log(`  ${year}: not available`);
    }
  }

  // Scrape Distinguished Achievers
  console.log('\n📥 Scraping Distinguished Achievers...');
  const distinguishedDir = path.join(process.cwd(), 'data', 'csv', 'archive-distinguished');
  fs.mkdirSync(distinguishedDir, { recursive: true });

  for (const item of daYears) {
    const url = baseUrl + item.pattern;
    const rows = await scrapePage(browser, url, item.year);
    if (rows && rows.length > 0) {
      fs.writeFileSync(path.join(distinguishedDir, `${item.year}.json`), JSON.stringify(rows));
    }
  }

  // Scrape other types (use regular pattern)
  for (const type of types.slice(1)) {
    console.log(`\n📥 Scraping ${type.name}...`);
    const dir = path.join(process.cwd(), 'data', 'csv', type.name);
    fs.mkdirSync(dir, { recursive: true });

    for (let year = 2016; year >= 2001; year--) {
      const filename = type.pattern.replace('{year}', year);
      const url = baseUrl + filename;

      const rows = await scrapePage(browser, url, year);
      if (rows && rows.length > 0) {
        fs.writeFileSync(path.join(dir, `${year}.json`), JSON.stringify(rows));
      }
    }
  }

  await browser.close();
  console.log('\n✨ Done!');
}

main().catch(console.error);