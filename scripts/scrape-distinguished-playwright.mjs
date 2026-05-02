import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data', 'csv', 'archive-distinguished');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'https://www.boardofstudies.nsw.edu.au/ebos/static/';

async function scrapeYear(browser, year) {
  const url = BASE + 'DSACH_' + year + '_12.html';
  console.log('\n📥 ' + year + ':');

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route('**/*', function(route) {
    var t = route.request().resourceType();
    if (t === 'image' || t === 'font' || t === 'media' || t === 'stylesheet') route.abort();
    else route.continue();
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('table', { timeout: 10000 }).catch(function() {});
  await page.waitForTimeout(2000);

  // Try DataTables API to get all data
  var dtData = await page.evaluate(function() {
    try {
      var $ = window.$;
      if ($) {
        var table = $('table').DataTable();
        if (table && table.data) {
          return table.data().toArray();
        }
      }
    } catch (e) {}
    return null;
  }).catch(function() { return null; });

  if (dtData && dtData.length > 1000) {
    var rows = dtData.map(function(row) {
      return row.map(function(cell) {
        return String(cell || '').replace(/<[^>]+>/g, '').trim();
      });
    }).filter(function(r) {
      return r.length >= 2 && r[0] && r[0].indexOf(',') >= 0;
    });
    console.log('  DataTables API: ' + rows.length + ' rows');
    await context.close();
    return rows;
  }

  // Method 2: paginate through DataTables
  console.log('  Paginating...');
  var allRows = [];
  var seen = new Set();
  var pageNum = 0;

  while (pageNum < 500) {
    var pageRows = await page.locator('table tbody tr').evaluateAll(function(trs) {
      return trs.map(function(tr) {
        var tds = tr.querySelectorAll('td');
        var result = [];
        for (var i = 0; i < tds.length; i++) {
          result.push((tds[i].textContent || '').trim());
        }
        return result;
      });
    }).catch(function() { return []; });

    var newCount = 0;
    for (var i = 0; i < pageRows.length; i++) {
      var r = pageRows[i];
      if (r.length < 2 || !r[0] || r[0].indexOf(',') < 0) continue;
      var key = r[0] + '|' + r[1];
      if (!seen.has(key)) {
        seen.add(key);
        allRows.push(r);
        newCount++;
      }
    }

    console.log('  Page ' + (pageNum + 1) + ': +' + newCount + ' (total ' + allRows.length + ')');
    if (newCount === 0 && pageNum > 0) break;

    // Click next
    var nextBtn = page.locator('.next:not(.disabled)');
    var btnCount = await nextBtn.count();
    if (btnCount === 0) break;

    var isDisabled = await nextBtn.first().evaluate(function(el) {
      return el.classList.contains('disabled');
    }).catch(function() { return true; });
    if (isDisabled) break;

    await nextBtn.first().click().catch(function() {});
    await page.waitForTimeout(300);
    pageNum++;
  }

  console.log('  Total: ' + allRows.length + ' rows');
  await context.close();
  return allRows;
}

async function main() {
  console.log('📥 Archive distinguished achievers 2001-2009\n');
  var browser = await chromium.launch({ headless: true });

  for (var year = 2009; year >= 2001; year--) {
    try {
      var rows = await scrapeYear(browser, year);
      if (rows.length > 5000) {
        fs.writeFileSync(path.join(OUT_DIR, year + '.json'), JSON.stringify(rows));
        console.log('  ✅ Saved\n');
      } else {
        console.log('  ⚠️ Only ' + rows.length + ' rows\n');
      }
    } catch (err) {
      console.log('  ❌ ' + err.message + '\n');
    }
  }

  await browser.close();
  console.log('✅ Done!');
}

main().catch(console.error);
