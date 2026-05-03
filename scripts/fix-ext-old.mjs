import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'data', 'csv', 'band-performance-detail');
const baseUrl = 'https://www.boardofstudies.nsw.edu.au/ebos/static/';
const PARALLEL = 8;

async function scrapeBands(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  return await page.evaluate(() => {
    const result = {};
    const extractPct = (text) => {
      const m = text.match(/\(([\d.]+)%\)/);
      return m ? parseFloat(m[1]) : null;
    };
    for (const tag of ['b', 'strong']) {
      for (const el of document.querySelectorAll(tag)) {
        const em = el.textContent.match(/Band[\s&nbsp;]*E\s*(\d+)/i);
        if (em && !result['Band E' + em[1]]) {
          const p = extractPct(el.parentElement?.textContent || '');
          if (p !== null) result['Band E' + em[1]] = p;
        }
        if (Object.keys(result).length < 4) {
          const rm = el.textContent.match(/Band[\s&nbsp;]*(\d+)/i);
          if (rm && !result['Band ' + rm[1]]) {
            const p = extractPct(el.parentElement?.textContent || '');
            if (p !== null) result['Band ' + rm[1]] = p;
          }
        }
      }
    }
    return result;
  });
}

async function processYear(year) {
  const file = path.join(outDir, year + '.json');
  const listUrl = baseUrl + 'BDHSC_' + year + '_12.html';
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Get course list from index page
  await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const allLinks = await page.locator('a[href*="BDHSC_' + year + '_12_"]').evaluateAll(els =>
    els.map(el => ({ href: el.getAttribute('href'), name: el.textContent?.trim() || '' }))
  );
  
  // Find extension courses: name contains "Extension"
  const extLinks = allLinks.filter(l => /extension/i.test(l.name));
  if (extLinks.length === 0) {
    await browser.close();
    return console.log(year + ': 0 ext courses found');
  }
  
  console.log(year + ': ' + extLinks.length + ' ext courses to scrape');
  
  // Load existing data
  let existing = [];
  if (fs.existsSync(file)) {
    existing = JSON.parse(fs.readFileSync(file, 'utf-8'));
  }
  
  const contexts = await Promise.all(Array.from({length: PARALLEL}, () => browser.newContext()));
  const pages = await Promise.all(contexts.map(c => c.newPage()));
  
  let added = 0, queue = [...extLinks];
  
  while (queue.length > 0) {
    const batch = queue.splice(0, PARALLEL);
    await Promise.all(batch.map(async (link, i) => {
      const fullUrl = baseUrl + link.href;
      const data = await scrapeBands(pages[i], fullUrl);
      if (data && Object.keys(data).length > 0) {
        const existingIdx = existing.findIndex(e => e.course === link.name);
        const entry = { year, course: link.name, ...data };
        if (existingIdx >= 0) {
          // Update existing, remove old Band 1-6 if E1-E4 present
          if (Object.keys(data).some(k => k.includes('E'))) {
            for (let b = 1; b <= 6; b++) delete existing[existingIdx]['Band ' + b];
          }
          Object.assign(existing[existingIdx], data);
        } else {
          existing.push(entry);
        }
        added++;
      }
    }));
  }
  
  await browser.close();
  existing.sort((a, b) => a.course.localeCompare(b.course));
  fs.writeFileSync(file, JSON.stringify(existing));
  console.log(year + ': added ' + added);
}

for (const year of [2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001]) {
  try { await processYear(year); } catch(e) { console.log(year + ': ERROR ' + e.message); }
}
console.log('Done');
