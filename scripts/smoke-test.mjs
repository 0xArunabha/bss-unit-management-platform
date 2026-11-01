import 'dotenv/config';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { mkdir } from 'node:fs/promises';

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox'],
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const created = { members: [], events: [], items: [], donations: [], circulars: [] };
const stamp = Date.now();
const year = new Date().getFullYear();
const name = `Field Test Member ${stamp}`;
const donor = `Field Test Patron ${stamp}`;
const eventTitle = `Field Test Outreach ${stamp}`;
const itemName = `Field Test Demonstration Kit ${stamp}`;
const getData = async () => (await page.request.get(`${base}/api/workspace`)).json();
const post = async (action, values = {}) => page.request.post(`${base}/api/workspace`, { data: { action, ...values } });
const nav = async (name) => {
  const label = name.replace(/\d+$/, '');
  const btn = page.locator('.sidebar-nav button').filter({ has: page.locator('span', { hasText: new RegExp('^' + label + '$', 'i') }) });
  await btn.click();
};
const waitForDialogClose = async () => page.getByRole('dialog').waitFor({ state: 'hidden' });
const saved = async (action, values) => {
  const response = await post(action, values);
  const body = await response.json();
  assert.equal(response.status(), 200, JSON.stringify(body));
  return body;
};

try {
  await mkdir('.artifacts', { recursive: true });
  await context.clearCookies();
  await post('switchUser', { userId: '10000000-0000-4000-8000-000000000001' });
  await page.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('h1').innerText(), 'Unit overview');
  assert.equal(await page.title(), 'Light of Science · Jalpaiguri Unit');
  assert.ok((await page.locator('.brand').innerText()).includes('Light of Science'));
  assert.ok((await page.locator('.unit-selector').innerText()).includes('Jalpaiguri Unit'));
  assert.equal((await page.locator('main').innerText()).includes('Jadavpur'), false);

  const brandedManifest = await (await page.request.get(`${base}/manifest.webmanifest`)).json();
  assert.equal(brandedManifest.short_name, 'Light of Science');
  assert.equal(brandedManifest.name, 'Light of Science (Breakthrough Science Society, Jalpaiguri Unit)');

  const brandingData = await getData();
  assert.ok(brandingData.events.filter((e) => e.id.startsWith('20000000-')).every((e) => e.location.includes('Jalpaiguri')));
  console.log('PASS: Light of Science branding, Jalpaiguri unit, localized sample venues, installable app identity');
  assert.equal(await page.evaluate(() => document.body.scrollWidth > innerWidth), false);

  await page.waitForTimeout(1000);
  await nav('Members128');
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.locator('[name="fullName"]').fill(name);
  await dialog.getByRole('button', { name: /Add member|Enroll member/i }).click();
  await waitForDialogClose();

  let data = await getData();
  const member = data.profiles.find((p) => p.fullName === name);
  assert.ok(member);
  created.members.push(member.id);

  await db.execute(sql`update profiles set created_at = now() - interval '13 months' where id = ${member.id}::uuid`);
  data = await getData();
  assert.equal(data.profiles.find((p) => p.id === member.id).status, 'inactive');
  console.log('PASS: member creation and six-month inactivity rule');

  await nav('Membership dues');
  await page.getByRole('button', { name: 'Quick collect', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('[name="memberId"]').selectOption(member.id);
  await dialog.locator('[name="amount"]').fill('500');
  await dialog.locator('[name="monthlyAmount"]').fill('20');
  await dialog.locator('[name="month"]').selectOption('12');
  await dialog.locator('[name="year"]').fill(String(year));
  assert.ok((await dialog.locator('.allocation-preview').innerText()).includes('25 months'));
  await page.screenshot({ animations: 'disabled', path: '.artifacts/collector.png' });
  await dialog.getByRole('button', { name: /Record/i }).click();
  await waitForDialogClose();

  data = await getData();
  const payments = data.dues.filter((d) => d.memberId === member.id).sort((a, b) => a.year - b.year || a.month - b.month);
  assert.equal(payments.length, 25);
  assert.equal(payments.reduce((s, p) => s + p.amount, 0), 500);
  assert.equal(payments[0].month, 12);
  assert.equal(payments[24].year, year + 2);
  assert.equal(payments[24].month, 12);
  assert.ok(payments.every((p) => p.collectedBy === data.currentUserId));

  const below = await post('collectDues', { memberId: member.id, amount: 19, monthlyAmount: 20, month: 1, year, paymentMode: 'cash' });
  assert.equal(below.status(), 400);

  const parallel = await Promise.all([
    saved('collectDues', { memberId: member.id, amount: 20, monthlyAmount: 20, month: 1, year: year + 4, paymentMode: 'cash' }),
    saved('collectDues', { memberId: member.id, amount: 20, monthlyAmount: 20, month: 1, year: year + 4, paymentMode: 'upi' }),
  ]);
  assert.equal(parallel.length, 2);

  data = await getData();
  assert.equal(data.dues.filter((d) => d.memberId === member.id).length, 27);
  console.log('PASS: ₹500 maps to 25 months, collector attribution, minimum dues, concurrent allocation');

  await nav('Donations');
  await page.getByRole('button', { name: 'Record donation', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('[name="donorName"]').fill(donor);
  await dialog.locator('[name="amount"]').fill('1234.56');
  await dialog.getByRole('button', { name: /Record/i }).click();
  await page.getByRole('dialog', { name: /(Generosity|Official Donation)/i }).waitFor();

  data = await getData();
  const donation = data.donations.find((d) => d.donorName === donor);
  assert.ok(donation);
  created.donations.push(donation.id);
  assert.equal(donation.amount, 1234.56);
  assert.ok(donation.receiptNo.startsWith('LOS-JPG-'));

  const receiptResponse = await page.request.get(`${base}/receipts/${donation.id}`);
  assert.equal(receiptResponse.status(), 200);
  const receiptHtml = await receiptResponse.text();
  assert.ok(receiptHtml.includes(donation.receiptNo));
  assert.ok(receiptHtml.includes('Light of Science'));
  assert.ok(receiptHtml.includes('Jalpaiguri Unit'));
  assert.equal(receiptHtml.includes('Jadavpur'), false);

  await page.screenshot({ animations: 'disabled', path: '.artifacts/receipt-modal.png' });
  await page.getByRole('dialog').getByRole('button', { name: 'Done', exact: true }).click();
  await nav('Donations');
  await page.reload({ waitUntil: 'networkidle' });
  assert.ok((await page.locator('main').innerText()).includes(donor));
  console.log('PASS: paise-precise donation, persistent receipt, public verification route');

  await nav('Events & campaigns');
  await page.getByRole('button', { name: 'Create event', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('[name="title"]').fill(eventTitle);
  const startsAt = new Date(Date.now() + 36 * 3600000);
  startsAt.setMinutes(0, 0, 0);
  const local = new Date(startsAt.getTime() - startsAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  await dialog.locator('[name="startsAt"]').fill(local);
  await dialog.locator('[name="location"]').fill('Test community science hall');
  await dialog.locator('[name="description"]').fill('Temporary smoke-test event. This record is removed after verification.');
  await dialog.getByRole('button', { name: /Publish/i }).click();
  await waitForDialogClose();

  data = await getData();
  const event = data.events.find((e) => e.title === eventTitle);
  assert.ok(event);
  created.events.push(event.id);

  await nav('Procurement3');
  await page.getByRole('button', { name: 'Add requisition item', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('[name="eventId"]').selectOption(event.id);
  await dialog.locator('[name="itemName"]').fill(itemName);
  await dialog.locator('[name="quantity"]').fill('2 kits');
  await dialog.locator('[name="estimatedCost"]').fill('1000.25');
  await dialog.getByRole('button', { name: /(Post requisition|Add to checklist)/i }).click();
  await waitForDialogClose();

  data = await getData();
  let item = data.procurements.find((p) => p.itemName === itemName);
  assert.ok(item);
  created.items.push(item.id);

  await page.locator('.procurement-card').filter({ hasText: itemName }).getByRole('button', { name: /(Log out-of-pocket|Record purchase)/i }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('[name="actualCost"]').fill('1234.75');
  await dialog.getByRole('button', { name: /(Log exact|Record purchase)/i }).click();
  await waitForDialogClose();

  data = await getData();
  item = data.procurements.find((p) => p.id === item.id);
  assert.equal(item.actualCost, 1234.75);
  assert.equal(item.status, 'purchased');

  const reject = await post('verify', { id: item.id });
  assert.equal(reject.status(), 400);
  assert.match((await reject.json()).error, /different volunteer/);
  console.log('PASS: event creation, exact overspend logging, self-verification rejected');

  await nav('Unit settings');
  const other = data.profiles.find((p) => p.role === 'organizer');
  await page.getByRole('combobox', { name: 'Preview member role' }).selectOption(other.id);
  await page.waitForFunction((id) => document.querySelector('.sidebar-account')?.textContent.includes(id), other.fullName);

  await nav('Procurement3');
  await page.locator('.procurement-card').filter({ hasText: itemName }).getByRole('button', { name: /Inspect/i }).click();
  dialog = page.getByRole('dialog');
  await dialog.locator('input[type="checkbox"]').check();
  await dialog.getByRole('button', { name: /(Confirm peer|Verify & close)/i }).click();
  await waitForDialogClose();

  data = await getData();
  item = data.procurements.find((p) => p.id === item.id);
  assert.equal(item.status, 'verified');
  assert.equal(item.verifiedBy, other.id);
  assert.notEqual(item.verifiedBy, item.purchasedBy);

  let constrained = false;
  try {
    await db.execute(sql`update event_procurements set verified_by = purchased_by where id = ${item.id}::uuid`);
  } catch (e) {
    constrained = String(e.cause?.constraint || e.message).includes('different_verifier');
  }
  assert.ok(constrained, 'Database must independently reject a matching purchaser/verifier');
  await page.screenshot({ animations: 'disabled', path: '.artifacts/procurement.png', fullPage: true });
  console.log('PASS: independent peer verification closes item; database CHECK enforces separation');

  await nav('Circulars & notices');
  await page.getByRole('button', { name: /Publish circular|Publish a notice/i }).click();
  dialog = page.getByRole('dialog');
  const noticeTitle = `Field Test Circular ${stamp}`;
  await dialog.locator('[name="title"]').fill(noticeTitle);
  await dialog.locator('[name="content"]').fill('Temporary circular for publishing and reader verification.');
  await dialog.locator('[name="pinned"]').check();
  await dialog.getByRole('button', { name: /Publish/i }).click();
  await waitForDialogClose();

  data = await getData();
  const notice = data.circulars.find((c) => c.title === noticeTitle);
  assert.ok(notice);
  assert.equal(notice.pinned, true);
  created.circulars.push(notice.id);

  await page.getByRole('button', { name: noticeTitle, exact: true }).click();
  assert.ok((await page.locator('.reader-content').innerText()).includes('reader verification'));
  await page.getByRole('button', { name: /Back to/i }).click();

  await nav('Science resources');
  await page.locator('.demo-protocol-card').first().click();
  await page.getByRole('button', { name: /Open complete narration script/i }).first().click();
  const guideDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download protocol/i }).click();
  const downloadedFilename = (await guideDownload).suggestedFilename();
  assert.ok(downloadedFilename.includes('protocol.txt'));
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();

  await nav('Members');
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  assert.equal((await csvDownload).suggestedFilename(), 'light-of-science-members.csv');

  await page.getByRole('button', { name: 'Open notifications', exact: true }).click();
  await page.getByRole('button', { name: 'Mark all notifications as read', exact: true }).click();
  assert.equal(await page.locator('.notification-button>span').count(), 0);
  await page.getByRole('button', { name: 'Open notifications', exact: true }).click();
  console.log('PASS: circular publishing and reader, guide download, CSV export, notification controls');

  await saved('switchUser', { userId: member.id });
  await page.reload({ waitUntil: 'networkidle' });
  await nav('Membership dues');
  assert.equal(await page.getByRole('button', { name: 'Quick collect', exact: true }).count(), 0);
  assert.equal(await page.locator('.dues-matrix tbody tr').count(), 1);

  const restricted = await post('addMember', { fullName: 'Not allowed', monthlyPledge: 20 });
  assert.equal(restricted.status(), 400);
  console.log('PASS: member role sees personal ledger; executive action is blocked');

  await saved('switchUser', { userId: '10000000-0000-4000-8000-000000000001' });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.keyboard.press('Control+k');
  await page.getByRole('textbox', { name: 'Search workspace' }).fill('science');
  assert.ok((await page.locator('.search-result-group').count()) > 0);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);

  assert.equal((await page.request.get(`${base}/manifest.webmanifest`)).status(), 200);
  assert.equal((await page.request.get(`${base}/offline`)).status(), 200);
  assert.equal((await page.request.get(`${base}/images/app-icon-512.png`)).status(), 200);
  assert.equal((await page.request.get(`${base}/api/health`)).status(), 200);
  console.log('PASS: keyboard search, manifest, install icon, offline route, health check');

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile = await mobileContext.newPage();
  mobile.on('pageerror', (e) => errors.push(e.message));
  await mobile.goto(base, { waitUntil: 'networkidle' });
  await mobile.waitForTimeout(400);
  assert.equal(await mobile.evaluate(() => document.body.scrollWidth > innerWidth), false);
  assert.ok(await mobile.locator('.sidebar').evaluate((el) => el.getBoundingClientRect().right <= 1));
  await mobile.screenshot({ animations: 'disabled', path: '.artifacts/mobile.png', fullPage: true });

  await mobile.getByRole('button', { name: 'Open main navigation', exact: true }).click();
  await mobile.locator('.sidebar-nav').getByRole('button', { name: 'Membership dues', exact: true }).click();
  await mobile.waitForTimeout(300);
  assert.equal(await mobile.evaluate(() => document.body.scrollWidth > innerWidth), false);
  await mobile.screenshot({ animations: 'disabled', path: '.artifacts/mobile-dues.png', fullPage: true });
  await mobileContext.close();

  assert.deepEqual(errors, []);
  console.log('PASS: mobile drawer, responsive ledger, no horizontal overflow, no browser errors');
  console.log('ALL WORKSPACE SMOKE TESTS PASSED');
} finally {
  const targets = [...created.members, ...created.events, ...created.items, ...created.donations, ...created.circulars];
  for (const id of targets) await db.execute(sql`delete from activities where target_id = ${id}::uuid`);
  for (const id of created.circulars) await db.execute(sql`delete from circulars where id = ${id}::uuid`);
  for (const id of created.items) await db.execute(sql`delete from event_procurements where id = ${id}::uuid`);
  for (const id of created.donations) await db.execute(sql`delete from donations where id = ${id}::uuid`);
  for (const id of created.events) await db.execute(sql`delete from events where id = ${id}::uuid`);
  for (const id of created.members) {
    await db.execute(sql`delete from membership_dues where member_id = ${id}::uuid`);
    await db.execute(sql`delete from profiles where id = ${id}::uuid`);
  }
  await browser.close();
  await pool.end();
  console.log('Temporary test records removed.');
}
