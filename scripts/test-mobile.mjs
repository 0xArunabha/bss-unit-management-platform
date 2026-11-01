import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';

const artifactDir = 'C:/Users/risho/.gemini/antigravity/brain/c006547a-552c-4d48-b30e-7c07cf0bf33a';
const base = 'http://localhost:3000';

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  // iPhone 14 viewport simulation
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({
    ...iPhone,
    viewport: { width: 390, height: 844 },
  });

  const page = await context.newPage();
  console.log('Navigating to', base);
  await page.goto(base, { waitUntil: 'networkidle' });

  // 1. Verify Mobile Bottom Navigation is rendered and visible
  const bottomNav = page.locator('.mobile-bottom-nav');
  await bottomNav.waitFor({ state: 'visible', timeout: 5000 });
  const bottomNavBox = await bottomNav.boundingBox();
  assert.ok(bottomNavBox && bottomNavBox.height > 50, 'Bottom nav must be visible and > 50px tall');
  console.log('PASS: Mobile Bottom Navigation is visible');

  // Take Mobile Overview screenshot
  await page.screenshot({ path: `${artifactDir}/mobile-overview.png`, fullPage: false });

  // 2. Navigate to Dues view via Bottom Nav
  await page.locator('.mobile-bottom-nav button').filter({ hasText: 'Dues' }).click();
  await page.waitForTimeout(500);

  // Check dues matrix sticky column compaction
  const firstCol = page.locator('.dues-matrix th:first-child').first();
  await firstCol.waitFor({ state: 'visible' });
  const colBox = await firstCol.boundingBox();
  console.log('Dues Matrix First Column Width on Mobile:', colBox.width);
  assert.ok(colBox.width <= 135, 'First column must be compacted to <= 135px on mobile');

  await page.screenshot({ path: `${artifactDir}/mobile-dues-matrix.png`, fullPage: false });
  console.log('PASS: Dues matrix is compacted for mobile');

  // 3. Test Bottom-Sheet Modal Opening
  const quickCollectBtn = page.getByRole('button', { name: /Quick collect/i });
  if (await quickCollectBtn.isVisible()) {
    await quickCollectBtn.click();
    const modal = page.locator('.modal');
    await modal.waitFor({ state: 'visible' });

    // Verify modal drag handle is present
    const dragHandle = page.locator('.modal-drag-handle');
    assert.ok(await dragHandle.isVisible(), 'Modal drag handle must be visible on mobile bottom-sheet');

    // Take screenshot of bottom sheet modal
    await page.screenshot({ path: `${artifactDir}/mobile-bottom-sheet-modal.png`, fullPage: false });
    console.log('PASS: Bottom-Sheet modal with drag handle opened successfully');

    // Close modal
    await page.getByRole('button', { name: /Cancel|Close/i }).first().click();
    await modal.waitFor({ state: 'hidden' });
  }

  // 4. Navigate to Procurement via Bottom Nav
  await page.locator('.mobile-bottom-nav button').filter({ hasText: 'Procure' }).click();
  await page.waitForTimeout(500);
  assert.ok(page.url().includes('view=procurement'), 'URL should switch to procurement');
  await page.screenshot({ path: `${artifactDir}/mobile-procurement.png`, fullPage: false });
  console.log('PASS: Procurement view navigable via Bottom Nav');

  // 5. Test "More" button to trigger sidebar
  await page.locator('.mobile-bottom-nav button').filter({ hasText: 'More' }).click();
  await page.waitForTimeout(400);
  const sidebar = page.locator('.sidebar-open');
  assert.ok(await sidebar.isVisible(), 'Sidebar drawer should open when tapping More');
  await page.screenshot({ path: `${artifactDir}/mobile-drawer-menu.png`, fullPage: false });
  console.log('PASS: Mobile drawer opened via More button');

  await browser.close();
  console.log('ALL MOBILE VERIFICATION CHECKS PASSED!');
}

run().catch((err) => {
  console.error('Mobile test failed:', err);
  process.exit(1);
});
