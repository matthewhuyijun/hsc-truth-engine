import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const baseUrl = 'http://www.boardofstudies.nsw.edu.au/bos_stats/';

const types = [
  { name: 'all-rounders', pattern: 'ALRND_{year}_12.html' },
  { name: 'distinguished', pattern: 'DSACH_{year}_12.html' },
  { name: 'first-in-course', pattern: 'FSTIC_{year}_12.html' },
  { name: 'top-achievers', pattern: 'TAINC_{year}_12.html' }
];

// Years available on old BOS site
const years = [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016];

async function parseHtmlTable(html) {
  const rows = [];
  const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gi;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const rowHtml = match[1];
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      // Strip HTML tags
      const cellText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      cells.push(cellText);
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

async function fetchAndParse(browser, url, type, year) {
  const page = await browser.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    if (response.status() === 404 || response.status() === 301) {
      await page.close();
      return null;
    }

    const content = await page.content();
    const rows = await parseHtmlTable(content);

    await page.close();
    return rows;
  } catch (err) {
    await page.close();
    throw err;
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const type of types) {
    console.log(`\n📥 Fetching ${type.name}...`);
    const dir = path.join(process.cwd(), 'data', 'csv', `archive-${type.name}`);
    fs.mkdirSync(dir, { recursive: true });

    for (const year of years) {
      const filename = type.pattern.replace('{year}', year);
      const url = baseUrl + filename;

      try {
        const rows = await fetchAndParse(browser, url, type.name, year);

        if (rows === null) {
          console.log(`  ${year}: not found`);
          continue;
        }

        console.log(`  ${year}: ${rows.length} rows`);
        fs.writeFileSync(path.join(dir, `${year}.json`), JSON.stringify(rows));

      } catch (err) {
        console.log(`  ${year}: ❌ ${err.message}`);
      }
    }
  }

  await browser.close();
  console.log('\n✨ Done!');
}

main().catch(console.error);