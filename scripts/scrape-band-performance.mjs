import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const baseUrl = 'https://www.boardofstudies.nsw.edu.au/ebos/static/';
const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

async function getCourseLinks(page, year) {
  try {
    const url = `${baseUrl}BDHSC_${year}_12.html`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const links = await page.locator(`a[href*="BDHSC_${year}_12_"]`).evaluateAll(els =>
      els.map(el => ({
        href: el.getAttribute('href'),
        name: el.textContent?.trim() || '',
      }))
    );

    return links.filter((l, i, arr) => arr.findIndex(x => x.href === l.href) === i);
  } catch (err) {
    console.error(`  Error getting links for ${year}:`, err.message);
    return [];
  }
}

async function scrapeBands(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const data = await page.evaluate(() => {
      const result = {};

      const extractPct = (text) => {
        const pct = text.match(/\(([\d.]+)%\)/);
        return pct ? parseFloat(pct[1]) : null;
      };

      // Strategy 0: Extension band descriptors (Band E1-E4)
      const bTagsExt = document.querySelectorAll('b');
      bTagsExt.forEach(b => {
        const match = b.textContent.match(/Band[\s&nbsp;]*E\s*(\d+)/i);
        if (match && !result[`Band E${match[1]}`]) {
          const text = b.parentElement?.textContent || '';
          const pct = extractPct(text);
          if (pct !== null) result[`Band E${match[1]}`] = pct;
        }
      });
      if (Object.keys(result).length >= 4) return result;

      // Strategy 0b: <strong> tags with Extension band text
      const strongsExt = document.querySelectorAll('strong');
      strongsExt.forEach(strong => {
        const match = strong.textContent.match(/Band[\s&nbsp;]*E\s*(\d+)/i);
        if (match && !result[`Band E${match[1]}`]) {
          const text = strong.parentElement?.textContent || '';
          const pct = extractPct(text);
          if (pct !== null) result[`Band E${match[1]}`] = pct;
        }
      });
      if (Object.keys(result).length >= 4) return result;

      // Strategy 1: <h3> with following <p> (2012+)
      const h3s = document.querySelectorAll('h3');
      h3s.forEach(h3 => {
        const match = h3.textContent.match(/Band\s*(\d+)/i);
        if (match && !result[`Band ${match[1]}`]) {
          const p = h3.nextElementSibling;
          if (p && p.tagName === 'P') {
            const pct = extractPct(p.textContent);
            if (pct !== null) result[`Band ${match[1]}`] = pct;
          }
        }
      });
      if (Object.keys(result).length > 0) return result;

      // Strategy 2: <strong> tags with Band text
      const strongs = document.querySelectorAll('strong');
      strongs.forEach(strong => {
        const match = strong.textContent.match(/Band\s*(\d+)/i);
        if (match && !result[`Band ${match[1]}`]) {
          const text = strong.parentElement?.textContent || '';
          const pct = extractPct(text);
          if (pct !== null) result[`Band ${match[1]}`] = pct;
        }
      });
      if (Object.keys(result).length > 0) return result;

      // Strategy 3: <b> tags with Band text (2001-2007 format)
      const bTags = document.querySelectorAll('b');
      bTags.forEach(b => {
        const match = b.textContent.match(/Band[\s&nbsp;]*(\d+)/i);
        if (match && !result[`Band ${match[1]}`]) {
          const text = b.parentElement?.textContent || '';
          const pct = extractPct(text);
          if (pct !== null) result[`Band ${match[1]}`] = pct;
        }
      });
      if (Object.keys(result).length > 0) return result;

      // Strategy 4: regex on all td elements
      const tds = document.querySelectorAll('td');
      for (const td of tds) {
        const text = td.textContent || '';
        const bandMatch = text.match(/Band[\s&nbsp;]*(\d+)/i);
        if (bandMatch && !result[`Band ${bandMatch[1]}`]) {
          const pct = extractPct(text);
          if (pct !== null) result[`Band ${bandMatch[1]}`] = pct;
        }
      }

      return result;
    });

    return Object.keys(data).length > 0 ? data : null;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('Starting Band Performance Data scraper (continuing from 2015)...\n');

  const dir = path.join(process.cwd(), 'data', 'csv', 'band-performance-detail');
  fs.mkdirSync(dir, { recursive: true });

  for (const year of years) {
    console.log(`\n${year}...`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const courseLinks = await getCourseLinks(page, year);
      console.log(`  Found ${courseLinks.length} courses`);

      const results = [];

      for (let i = 0; i < courseLinks.length; i++) {
        const { href, name } = courseLinks[i];
        const fullUrl = href.startsWith('http') ? href : href.startsWith('/') ? `https://www.boardofstudies.nsw.edu.au${href}` : baseUrl + href;

        const data = await scrapeBands(page, fullUrl);
        if (data) {
          results.push({ year, course: name, ...data });
        }

        if ((i + 1) % 20 === 0) {
          console.log(`  Progress: ${i + 1}/${courseLinks.length}...`);
        }
      }

      console.log(`  Done: ${results.length} courses scraped`);
      fs.writeFileSync(path.join(dir, `${year}.json`), JSON.stringify(results, null, 2));
    } catch (err) {
      console.error(`  Failed for ${year}:`, err.message);
    } finally {
      await page.close();
      await context.close();
      await browser.close();
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
