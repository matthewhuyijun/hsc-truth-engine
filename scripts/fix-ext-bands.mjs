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
        // Extension: Band E1-E4
        const em = el.textContent.match(/Band[\s&nbsp;]*E\s*(\d+)/i);
        if (em && !result['Band E' + em[1]]) {
          const p = extractPct(el.parentElement?.textContent || '');
          if (p !== null) result['Band E' + em[1]] = p;
        }
        // Regular: Band 1-6 (only if no E-bands found)
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
  if (!fs.existsSync(file)) return console.log(year + ': no data');
  
  const existing = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const extCourses = existing.filter(e => /extension/i.test(e.course));
  if (extCourses.length === 0) return console.log(year + ': no ext courses');
  
  console.log(year + ': ' + extCourses.length + ' ext courses to fix');
  
  const browser = await chromium.launch({ headless: true });
  const contexts = await Promise.all(Array.from({length: PARALLEL}, () => browser.newContext()));
  const pages = await Promise.all(contexts.map(c => c.newPage()));
  
  let fixed = 0;
  const queue = [...extCourses];
  
  while (queue.length > 0) {
    const batch = queue.splice(0, PARALLEL);
    await Promise.all(batch.map(async (course, i) => {
      const pageUrl = baseUrl + 'BDHSC_' + year + '_12_' + existing.find(e => e.course === course.course)?.course?.match(/\((\d+)\)/)?.[1] + '.html';
      const courseUrl = baseUrl + 'BDHSC_' + year + '_12.html';
      await pages[i].goto(courseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const links = await pages[i].locator('a[href*="BDHSC_' + year + '_12_"]').evaluateAll(els =>
        els.map(el => ({ href: el.getAttribute('href'), name: el.textContent?.trim() || '' }))
      );
      const match = links.find(l => l.name === course.course);
      if (!match) return;
      
      const fullUrl = baseUrl + match.href;
      const data = await scrapeBands(pages[i], fullUrl);
      if (data && Object.keys(data).length > 0) {
        Object.assign(course, data);
        // Remove old Band 1-6 keys if we got E1-E4
        if (Object.keys(data).some(k => k.includes('E'))) {
          for (let b = 1; b <= 6; b++) delete course['Band ' + b];
        }
        fixed++;
      }
    }));
  }
  
  await browser.close();
  fs.writeFileSync(file, JSON.stringify(existing));
  console.log(year + ': fixed ' + fixed + '/' + extCourses.length);
}

for (const year of [2024,2023,2022,2021,2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001]) {
  try { await processYear(year); } catch(e) { console.log(year + ': ERROR ' + e.message); }
}
console.log('Done');
