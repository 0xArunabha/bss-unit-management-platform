import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';

const artifactDir = process.env.ARTIFACT_DIR || '.artifacts';
const base = 'http://localhost:3000';

async function run() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });
  // iPhone 14 viewport simulation
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({
    ...iPhone,
    viewport: { width: 390, height: 844 },
  });

  await context.addCookies([
    {
      name: 'bss_demo_user',
      value: '10000000-0000-4000-8000-000000000001',
      domain: 'localhost',
      path: '/',
    },
  ]);

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

  // 3. Test Mobile Members View & Mobile Member Cards
  await page.goto(`${base}/?view=members`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // Desktop table must be hidden on mobile
  const desktopTable = page.locator('.desktop-only-table').first();
  const isDesktopTableVisible = await desktopTable.isVisible();
  assert.equal(isDesktopTableVisible, false, 'Desktop member table must be hidden on mobile <= 768px');

  // Mobile cards must be visible
  const mobileMemberCards = page.locator('.mobile-member-cards');
  await mobileMemberCards.waitFor({ state: 'visible', timeout: 3000 });
  const cardCount = await page.locator('.mobile-member-card').count();
  console.log('Mobile Member Cards rendered:', cardCount);
  assert.ok(cardCount > 0, 'Mobile member cards must be rendered on mobile view');

  // Verify Mini-stats grid is 3-column compact chip row
  const miniStats = page.locator('.mini-stats-grid').first();
  const miniStatsBox = await miniStats.boundingBox();
  console.log('Mini-stats Height on Mobile:', miniStatsBox?.height);
  assert.ok(miniStatsBox && miniStatsBox.height < 140, 'Mini-stats should be compact <= 140px on mobile');

  await page.screenshot({ path: `${artifactDir}/mobile-members.png`, fullPage: false });
  console.log('PASS: Mobile member cards & compact mini-stats rendered');

  // 4. Test Mobile Donations View & Mobile Donation Cards
  await page.goto(`${base}/?view=donations`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const desktopDonationTable = page.locator('.desktop-only-table').first();
  assert.equal(await desktopDonationTable.isVisible(), false, 'Desktop donation table must be hidden on mobile <= 768px');

  const mobileDonationCards = page.locator('.mobile-donation-cards');
  await mobileDonationCards.waitFor({ state: 'visible', timeout: 3000 });
  const donationCardCount = await page.locator('.mobile-donation-card').count();
  console.log('Mobile Donation Cards rendered:', donationCardCount);
  assert.ok(donationCardCount > 0, 'Mobile donation cards must be rendered on mobile view');

  await page.screenshot({ path: `${artifactDir}/mobile-donations.png`, fullPage: false });
  console.log('PASS: Mobile donation cards rendered');

  // 5. Test Bottom-Sheet Modal Opening
  const recordDonationBtn = page.getByRole('button', { name: /Record donation/i });
  if (await recordDonationBtn.isVisible()) {
    await recordDonationBtn.click();
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

  // 6. Navigate to Procurement via Bottom Nav
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
