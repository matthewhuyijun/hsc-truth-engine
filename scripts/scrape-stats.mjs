import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const baseUrl = 'https://www.boardofstudies.nsw.edu.au/ebos/static/';

// Band Performance Data (HSC 12 = Year 12 HSC exams)
const bandPerfYears = Array.from({ length: 25 }, (_, i) => 2001 + i); // 2001-2025

// Student Entries by Sex (HSC = 12, we want just Year 12)
const sexEntriesYears = Array.from({ length: 35 }, (_, i) => 1991 + i); // 1991-2025

async function parseTable(html) {
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const rowHtml = match[1];
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const cellText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      cells.push(cellText);
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

async function scrapePage(browser, url, year) {
  const page = await browser.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    if (response.status() !== 200) {
      await page.close();
      return null;
    }
    const content = await page.content();
    const rows = await parseTable(content);
    await page.close();
    return rows.length > 0 ? rows : null;
  } catch (err) {
    await page.close();
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Band Performance & Student Entries scraper...\n');

  const browser = await chromium.launch({ headless: true });

  // 1. Band Performance Data
  console.log('📊 Fetching Band Performance Data (HSC)...');
  const bandDir = path.join(process.cwd(), 'data', 'csv', 'band-performance');
  fs.mkdirSync(bandDir, { recursive: true });

  for (const year of bandPerfYears) {
    const url = `${baseUrl}BDHSC_${year}_12.html`;
    console.log(`  ${year}...`);
    const rows = await scrapePage(browser, url, year);
    if (rows) {
      fs.writeFileSync(path.join(bandDir, `${year}.json`), JSON.stringify(rows));
      console.log(`    ✓ ${rows.length} rows`);
    } else {
      console.log(`    ✗ not found`);
    }
  }

  // 2. Student Entries by Sex
  console.log('\n👥 Fetching Student Entries by Sex (HSC Year 12)...');
  const sexDir = path.join(process.cwd(), 'data', 'csv', 'student-entries-by-sex');
  fs.mkdirSync(sexDir, { recursive: true });

  for (const year of sexEntriesYears) {
    const url = `${baseUrl}EN_SX_${year}_12.html`;
    console.log(`  ${year}...`);
    const rows = await scrapePage(browser, url, year);
    if (rows) {
      fs.writeFileSync(path.join(sexDir, `${year}.json`), JSON.stringify(rows));
      console.log(`    ✓ ${rows.length} rows`);
    } else {
      console.log(`    ✗ not found`);
    }
  }

  await browser.close();
  console.log('\n✨ Done!');
}

main().catch(console.error);