import { chromium } from 'playwright';

async function explorePage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🎯 Exploring NESA Distinguished Achievers 2025...\n');

  // Set up network monitoring BEFORE goto
  const apiRequests = [];
  page.on('response', response => {
    const url = response.url();
    const contentType = response.headers()['content-type'] || '';
    if (url.includes('api') || url.includes('json') || contentType.includes('json')) {
      apiRequests.push({
        url,
        status: response.status(),
        contentType
      });
    }
  });

  await page.goto('https://www.nsw.gov.au/education-and-training/nesa/awards-and-events/hsc-merit-lists/distinguished-achievers/2025');
  await page.waitForLoadState('networkidle');

  console.log('📄 Page title:', await page.title());

  // Check for search input
  const searchInput = page.locator('input[name="keyword"]');
  if (await searchInput.isVisible().catch(() => false)) {
    console.log('\n🔍 Found keyword search input');
    await searchInput.fill('James Ruse');
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
  }

  // Print API requests
  if (apiRequests.length > 0) {
    console.log('\n🚀 API Requests detected:');
    for (const req of apiRequests) {
      console.log(`  [${req.status}] ${req.contentType}`);
      console.log(`     ${req.url}`);
    }
  } else {
    console.log('\n❌ No API requests detected');
  }

  // Check for tables after interaction
  const tables = await page.locator('table').count();
  console.log('\n📊 Tables found after search:', tables);

  // Check for results
  const rows = await page.locator('tbody tr, [role="row"], .results li').all();
  console.log('📋 Result rows found:', rows.length);

  // Take screenshot
  await page.screenshot({ path: 'data/screenshots/nesa-2025-search.png', fullPage: true });
  console.log('\n📸 Screenshot saved');

  await browser.close();
}

explorePage().catch(console.error);
