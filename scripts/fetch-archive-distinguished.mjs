import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const BASE_URL = 'https://www.boardofstudies.nsw.edu.au/ebos/static/';
const OUTPUT_DIR = path.join(ROOT_DIR, 'data', 'csv', 'archive-distinguished');

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  if (!response.ok) return null;
  return await response.text();
}

function extractLetterPages(html) {
  // Handle both quoted and unquoted hrefs: href="..." or href=...
  // Extensions: .html, .htm, .php
  const links = html.match(/href\s*=\s*["']?([^"'\s>]*DSACH_\d{4}_12_[A-Z][A-Z0-9]*\.(?:html|htm|php))["'\s>]/gi) || [];
  return [...new Set(links.map(l => {
    const m = l.match(/DSACH_\d{4}_12_[A-Z][A-Z0-9]*\.(?:html|htm|php)/i);
    return m ? m[0] : '';
  }).filter(Boolean))];
}

function parseDataRows(html) {
  const rows = [];
  // Match <tr> with 3 <td> or <th> cells
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const cells = trMatch[1];
    // Extract all td cells
    const tds = [];
    const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let tdMatch;
    while ((tdMatch = tdRegex.exec(cells)) !== null) {
      tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
    }
    
    if (tds.length < 2) continue;
    
    const col1 = tds[0];
    const col2 = tds[1];
    const col3 = tds[2] || '';
    
    // Skip headers
    if (col1 === 'Student name' || col1.includes('name')) continue;
    // Must have comma (Last, First format)  
    if (!col1.includes(',')) continue;
    // Skip A-Z navigation letter cells (single letter)
    if (col1.length <= 2) continue;
    
    rows.push([col1, col2, col3]);
  }
  return rows;
}

async function scrapeYear(year) {
  let startUrl;
  if (year === 2016) {
    startUrl = BASE_URL + 'DSACH_' + year + '_12_A.html';
  } else {
    startUrl = BASE_URL + 'DSACH_' + year + '_12.html';
  }

  console.log('\n📥 ' + year + ':');
  const mainHtml = await fetchPage(startUrl);
  if (!mainHtml && year === 2016) {
    const altHtml = await fetchPage(BASE_URL + 'DSACH_' + year + '_12.html');
    if (!altHtml) { console.log('  ❌ Not found'); return []; }
  } else if (!mainHtml) {
    console.log('  ❌ Not found');
    return [];
  }

  // Try extracting letter pages from HTML source first (works for 2011+)
  let letterPages = extractLetterPages(mainHtml);
  
  // All years have sub-page links in HTML source
  // The regex now covers .html, .htm, and .php

  if (letterPages.length === 0) {
    // Try parsing the main page directly
    const directRows = parseDataRows(mainHtml);
    console.log('  Direct parse: ' + directRows.length + ' rows (no sub-pages)');
    return directRows;
  }

  console.log('  ' + letterPages.length + ' sub-pages');
  
  // Parse main page
  const allRows = parseDataRows(mainHtml);

  // Fetch all sub-pages in parallel
  const CONCURRENCY = 10;
  for (let i = 0; i < letterPages.length; i += CONCURRENCY) {
    const batch = letterPages.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (page) => {
        const html = await fetchPage(BASE_URL + page);
        return html ? parseDataRows(html) : [];
      })
    );
    for (const rows of results) allRows.push(...rows);
    if (letterPages.length > CONCURRENCY && (i % (CONCURRENCY * 4) === 0 || i + CONCURRENCY >= letterPages.length)) {
      console.log('  Progress: ' + Math.min(i + CONCURRENCY, letterPages.length) + '/' + letterPages.length);
    }
  }

  // Deduplicate
  const seen = new Set();
  const unique = [];
  for (const r of allRows) {
    const key = r[0] + '|' + r[1];
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }

  console.log('  Total: ' + unique.length + ' unique rows');
  return unique;
}

// Playwright-based URL discovery for older years (2001-2010)
async function getLetterPagesViaPlaywright(year) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Block non-essential resources
  await page.route(/\.(png|jpg|gif|svg|ico|css|woff|ttf)/, (route) => route.abort());

  const url = BASE_URL + 'DSACH_' + year + '_12.html';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const links = await page.evaluate(() => {
    const anchors = document.querySelectorAll('a');
    const result = [];
    for (let i = 0; i < anchors.length; i++) {
      const href = anchors[i].getAttribute('href');
      if (href && href.indexOf('DSACH') >= 0) result.push(href);
    }
    return result;
  }).catch(() => []);

  await context.close();
  await browser.close();

  // Extract just the filename from each link
  return [...new Set(links.map(l => {
    const m = l.match(/DSACH_\d{4}_12_[A-Z][A-Z0-9]*\.(?:html|php)/i);
    return m ? m[0] : null;
  }).filter(Boolean))];
}

async function main() {
  console.log('📥 Fetching archive distinguished achievers (parallel)...\n');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const years = [2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002, 2001];
  
  const results = await Promise.all(
    years.map(async (year) => {
      try {
        const rows = await scrapeYear(year);
        if (rows.length > 0) {
          fs.writeFileSync(path.join(OUTPUT_DIR, `${year}.json`), JSON.stringify(rows));
        }
        return { year, rows: rows.length };
      } catch (err) {
        console.log(`  ❌ ${year}: ${err.message}`);
        return { year, rows: 0 };
      }
    })
  );

  console.log('\n📊 Summary:');
  results.forEach(r => console.log(`  ${r.year}: ${r.rows.toLocaleString()} rows`));
  console.log('\n✅ Done!');
}

main().catch(console.error);
