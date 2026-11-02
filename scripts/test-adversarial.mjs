#!/usr/bin/env node
/**
 * Live Adversarial Penetration Test Suite
 * Validates remediation of the 8 reported pentest issues on the live Next.js app.
 */

import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';

let passed = 0;
let total = 0;

async function test(name, fn) {
  total++;
  process.stdout.write(`  • ${name} ... `);
  try {
    await fn();
    console.log(`${GREEN}${BOLD}PASSED${RESET}`);
    passed++;
  } catch (err) {
    console.log(`${RED}${BOLD}FAILED${RESET}`);
    console.error(`    ${RED}${err.message}${RESET}`);
  }
}

console.log(`\n${CYAN}${BOLD}════════════════════════════════════════════════════════════════════════════${RESET}`);
console.log(`${CYAN}${BOLD}     LIVE ADVERSARIAL RE-VERIFICATION AGAINST PENTEST VULNERABILITIES       ${RESET}`);
console.log(`${CYAN}${BOLD}════════════════════════════════════════════════════════════════════════════${RESET}\n`);

// 1. Forged cookie rejection
await test('PENTEST-1: Forged cookie with raw UUID is rejected (anonymous sanitized response)', async () => {
  const forgedCookie = '10000000-0000-4000-8000-000000000001';
  const res = await fetch(`${BASE_URL}/api/workspace`, {
    headers: {
      Cookie: `bss_demo_user=${forgedCookie}; bss_session=${forgedCookie}`,
    },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.currentUserId, '', 'Forged cookie must not authenticate as admin');
  assert.equal(data.dues.length, 0, 'Dues must be hidden for forged cookie');
  assert.equal(data.donations.length, 0, 'Donations must be hidden for forged cookie');
  assert.equal(data.procurements.length, 0, 'Procurements must be hidden for forged cookie');
  // Phone numbers must be null
  for (const p of data.profiles) {
    assert.equal(p.phone, null, `Phone for ${p.fullName} must be null for forged cookie`);
    assert.equal(p.assignedPin, undefined, 'assignedPin must never be present');
  }
});

// 2. Anonymous reads data isolation
await test('PENTEST-2: Anonymous GET /api/workspace hides all sensitive finances and phones', async () => {
  const res = await fetch(`${BASE_URL}/api/workspace`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.currentUserId, '');
  assert.equal(data.dues.length, 0);
  assert.equal(data.donations.length, 0);
  assert.equal(data.procurements.length, 0);
  assert.equal(data.activities.length, 0);
  for (const p of data.profiles) {
    assert.equal(p.phone, null);
    assert.equal(p.monthlyPledge, 0);
    assert.equal(p.assignedPin, undefined);
  }
});

// 3. Rate limiting brute force mitigation
await test('PENTEST-3: Rapid failed PIN attempts trigger rate limit (429 Too Many Requests)', async () => {
  const targetId = '10000000-0000-4000-8000-000000000002'; // Utsav Sen
  let got429 = false;

  for (let i = 0; i < 7; i++) {
    const res = await fetch(`${BASE_URL}/api/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        memberId: targetId,
        pin: '9999', // Incorrect PIN
      }),
    });
    if (res.status === 429) {
      got429 = true;
      const retryAfter = res.headers.get('retry-after');
      assert.ok(retryAfter, '429 response must have Retry-After header');
      break;
    }
  }
  assert.ok(got429, 'After 5 failed attempts, login must be blocked with HTTP 429');
});

// 4. Month 13 dues rejection
await test('PENTEST-4: Month 13 dues payment is rejected', async () => {
  // First login legitimately as admin
  const loginRes = await fetch(`${BASE_URL}/api/workspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      memberId: '10000000-0000-4000-8000-000000000001',
      pin: '2401',
    }),
  });
  const cookie = loginRes.headers.get('set-cookie');
  assert.ok(cookie, 'Legitimate login must return session cookie');

  // Attempt to collect dues for month 13
  const badMonthRes = await fetch(`${BASE_URL}/api/workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      action: 'collectDues',
      memberId: '10000000-0000-4000-8000-000000000004',
      amount: 20,
      monthlyAmount: 20,
      month: 13,
      year: 2025,
      paymentMode: 'cash',
    }),
  });
  assert.equal(badMonthRes.status, 400, 'Month 13 must return HTTP 400 error');
});

// 5. Retry double-booking prevention
await test('PENTEST-5: Retried payment request does not double-book dues', async () => {
  const loginRes = await fetch(`${BASE_URL}/api/workspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      memberId: '10000000-0000-4000-8000-000000000001',
      pin: '2401',
    }),
  });
  const cookie = loginRes.headers.get('set-cookie');

  const testMonth = (Date.now() % 12) + 1;
  const testYear = 2028 + Math.floor(Math.random() * 5);

  // First collection
  const firstRes = await fetch(`${BASE_URL}/api/workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      action: 'collectDues',
      memberId: '10000000-0000-4000-8000-000000000005',
      amount: 20,
      monthlyAmount: 20,
      month: testMonth,
      year: testYear,
      paymentMode: 'cash',
    }),
  });
  if (firstRes.status !== 200) {
    console.error("First collection failed:", await firstRes.json());
  }
  assert.equal(firstRes.status, 200);
  const firstData = await firstRes.json();
  const countAfterFirst = firstData.data.dues.filter(d => d.memberId === '10000000-0000-4000-8000-000000000005' && d.year === testYear && d.month === testMonth).length;
  assert.equal(countAfterFirst, 1, 'Should have exactly 1 payment record for test month');

  // Immediate retry (simulating double click or network retry)
  const retryRes = await fetch(`${BASE_URL}/api/workspace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      action: 'collectDues',
      memberId: '10000000-0000-4000-8000-000000000005',
      amount: 20,
      monthlyAmount: 20,
      month: testMonth,
      year: testYear,
      paymentMode: 'cash',
    }),
  });
  if (retryRes.status !== 200) {
    const errBody = await retryRes.json();
    console.error("Retry response error:", errBody);
  }
  assert.equal(retryRes.status, 200);
  const retryData = await retryRes.json();
  assert.ok(retryData.message.includes('already recorded') || retryData.message.includes('idempotent'), 'Retry must return idempotent message without booking another month');
  const countAfterRetry = retryData.data.dues.filter(d => d.memberId === '10000000-0000-4000-8000-000000000005' && d.year === testYear).length;
  assert.equal(countAfterRetry, 1, 'Retry must NOT book a second month of dues');
});

// 6. SMS simulation does NOT set smsSent: true
await test('PENTEST-6: SMS simulation does not set sms_sent to true', async () => {
  const loginRes = await fetch(`${BASE_URL}/api/workspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      memberId: '10000000-0000-4000-8000-000000000001',
      pin: '2401',
    }),
  });
  const cookie = loginRes.headers.get('set-cookie');

  // Add donation
  const donRes = await fetch(`${BASE_URL}/api/workspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      action: 'addDonation',
      donorName: 'Test Supporter',
      donorPhone: '9832012345',
      amount: 500,
      paymentMode: 'cash',
    }),
  });
  const donData = await donRes.json();
  const donationId = donData.receiptId;

  // Dispatch simulated SMS
  const smsRes = await fetch(`${BASE_URL}/api/workspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      action: 'sendSms',
      id: donationId,
      phone: '9832012345',
    }),
  });
  const smsData = await smsRes.json();
  const recordedDonation = smsData.data.donations.find(d => d.id === donationId);
  assert.equal(recordedDonation.smsSent, false, 'Simulated SMS must leave smsSent as false');
});

// 7. Receipts show official copy and correct officer
await test('PENTEST-7: Receipt displays official acknowledgment and Arunabha Ghosh', async () => {
  const res = await fetch(`${BASE_URL}/receipts/40000000-0000-4000-8000-000000000001`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(!html.includes('DEMONSTRATION RECORD · SAMPLE WORKSPACE'), 'Receipt must not say DEMONSTRATION RECORD');
  assert.ok(html.includes('OFFICIAL CONTRIBUTION RECEIPT'), 'Receipt must say OFFICIAL CONTRIBUTION RECEIPT');
  assert.ok(!html.includes('Anirban Sen'), 'Fallback signer must not be Anirban Sen');
  assert.ok(html.includes('Arunabha Ghosh'), 'Signer must be Arunabha Ghosh');
});

console.log(`\n${CYAN}════════════════════════════════════════════════════════════════════════════${RESET}`);
if (passed === total) {
  console.log(`${GREEN}${BOLD}  RESULT: ALL ${passed}/${total} PENTEST VERIFICATION TESTS PASSED!${RESET}`);
  console.log(`${CYAN}════════════════════════════════════════════════════════════════════════════${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}  RESULT: ${passed}/${total} PASSED, ${total - passed} FAILED${RESET}`);
  console.log(`${CYAN}════════════════════════════════════════════════════════════════════════════${RESET}\n`);
  process.exit(1);
}
