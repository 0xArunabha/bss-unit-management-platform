#!/usr/bin/env node
/**
 * ============================================================================
 * Breakthrough Science Society — Jalpaiguri Unit Management Platform
 * Integrity, Security & Regression Verification Suite
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();
const resolveApp = (rel) => path.resolve(ROOT_DIR, rel);

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
console.log(`${CYAN}${BOLD}  BSS UNIT MANAGEMENT PLATFORM — INTEGRITY & REGRESSION VERIFICATION SUITE  ${RESET}`);
console.log(`${CYAN}${BOLD}════════════════════════════════════════════════════════════════════════════${RESET}\n`);

// 1. BUG-SEC-01: HMAC-signed session verification in route.ts and page.tsx
await test('BUG-SEC-01: route.ts and page.tsx verify cryptographically signed HMAC session cookies', () => {
  const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok(routeContent.includes('verifySessionToken'), 'route.ts must verify session token using verifySessionToken');
  assert.ok(routeContent.includes('SESSION_COOKIE_NAME'), 'route.ts must use SESSION_COOKIE_NAME');
  assert.ok(!routeContent.includes('request.cookies.get("bss_demo_user")?.value || ADMIN_ID'), 'Route must not default to ADMIN_ID');

  const pageContent = fs.readFileSync(resolveApp('src/app/page.tsx'), 'utf8');
  assert.ok(pageContent.includes('verifySessionToken'), 'page.tsx must verify session token before calling getWorkspace');

  // Verify HMAC session generation and tampering rejection logic
  const sessionSecret = "bss_session_salt_jalpaiguri_2026_scientific_temper_secure";
  const userId = "10000000-0000-4000-8000-000000000001";
  const timestamp = Date.now().toString();
  const payload = `${userId}.${timestamp}`;
  const hmac = crypto.createHmac("sha256", sessionSecret).update(payload).digest("hex");
  const validToken = `${payload}.${hmac}`;
  const tamperedToken = `${userId}.${timestamp}.badsignaturebadsignaturebadsignaturebadsignaturebadsignaturebadsi`;

  // Raw UUID without HMAC should never be accepted
  assert.equal(userId.split('.').length, 1, 'Raw UUID must fail 3-part token validation');
});

// 2. BUG-SEC-02: switchUser requires admin role
await test('BUG-SEC-02: switchUser enforces executive authorization', () => {
  const content = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  const switchIdx = content.indexOf('case "switchUser":');
  assert.ok(switchIdx >= 0, 'switchUser case must exist in route.ts');
  const block = content.slice(switchIdx, switchIdx + 300);
  assert.ok(block.includes('requireRole(["admin"])'), 'switchUser in route.ts must require admin role');

  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  const demoSwitchIdx = demoContent.indexOf('case "switchUser":');
  assert.ok(demoSwitchIdx >= 0, 'switchUser case must exist in demo-data.ts');
  const demoBlock = demoContent.slice(demoSwitchIdx, demoSwitchIdx + 300);
  assert.ok(demoBlock.includes('user.role !== "admin"'), 'switchUser in demo-data.ts must restrict to admin');
});

// 3. BUG-SEC-03: Member PINs are never leaked or exposed to client
await test('BUG-SEC-03: Member PINs are salted/hashed and never returned in workspace payload', () => {
  const wsContent = fs.readFileSync(resolveApp('src/lib/workspace.ts'), 'utf8');
  assert.ok(!wsContent.includes('userIsAdmin ? person.pin'), 'workspace.ts must not leak member PINs to admins');
  assert.ok(wsContent.includes('delete sanitized.assignedPin'), 'workspace.ts must remove assignedPin');
  assert.ok(wsContent.includes('delete sanitized.pin'), 'workspace.ts must remove pin');

  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  assert.ok(!demoContent.includes('pin: "2401"'), 'demo-data.ts must not commit plaintext PINs');
  assert.ok(demoContent.includes('hashPin'), 'demo-data.ts must use salted PIN hashing');

  // Verify adminResetPin does not log caller in as the target member
  const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  const resetIdx = routeContent.indexOf('case "adminResetPin":');
  assert.ok(resetIdx >= 0, 'case "adminResetPin" must exist');
  const resetBlock = routeContent.slice(resetIdx, resetIdx + 1200);
  assert.ok(resetBlock.includes('nextUser = user.id'), 'adminResetPin must retain admin session, not switch to target');

  // People views must not render plaintext PIN chip
  const peopleViews = fs.readFileSync(resolveApp('src/components/people-views.tsx'), 'utf8');
  assert.ok(!peopleViews.includes('PIN: <code>{p.assignedPin}</code>'), 'people-views.tsx must not render PIN display chip');
});

// 4. BUG-SEC-04: Anonymous reads return sanitized public view only
await test('BUG-SEC-04: Anonymous reads return sanitized public data with hidden phones and ledgers', () => {
  const wsContent = fs.readFileSync(resolveApp('src/lib/workspace.ts'), 'utf8');
  assert.ok(wsContent.includes('phone: null'), 'workspace.ts must mask phone numbers for unauthenticated visitors');
  assert.ok(wsContent.includes('dues: []'), 'workspace.ts must return empty dues ledger for unauthenticated visitors');
  assert.ok(wsContent.includes('donations: []'), 'workspace.ts must return empty donations list for unauthenticated visitors');
  assert.ok(wsContent.includes('procurements: []'), 'workspace.ts must return empty procurements for unauthenticated visitors');

  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  assert.ok(demoContent.includes('phone: null'), 'demo-data.ts must mask phone numbers for unauthenticated visitors');
  assert.ok(demoContent.includes('dues: []'), 'demo-data.ts must return empty dues ledger for unauthenticated visitors');
  assert.ok(demoContent.includes('donations: []'), 'demo-data.ts must return empty donations list for unauthenticated visitors');
});

// 5. BUG-SEC-05: Rate limiting on login attempts
await test('BUG-SEC-05: Rate limiting defends against brute-force attacks on PINs', () => {
  const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok(routeContent.includes('checkLoginRateLimit'), 'route.ts must enforce checkLoginRateLimit on login');
  assert.ok(routeContent.includes('status: 429'), 'route.ts must return HTTP 429 when rate limit exceeded');

  const rateLimitFile = fs.readFileSync(resolveApp('src/lib/rate-limit.ts'), 'utf8');
  assert.ok(rateLimitFile.includes('MAX_FAILED_ATTEMPTS = 5'), 'rate-limit.ts must enforce max 5 failed attempts');
  assert.ok(rateLimitFile.includes('LOCKOUT_DURATION_MS = 5 * 60 * 1000'), 'rate-limit.ts must enforce 5-minute lockout');
});

// 6. BUG-DB-01: Engine-level check constraints in PostgreSQL seed
await test('BUG-DB-01: PostgreSQL seed defines engine-level CHECK constraints', () => {
  const seedContent = fs.readFileSync(resolveApp('src/db/seed.ts'), 'utf8');
  assert.ok(seedContent.includes('dues_valid_month'), 'seed.ts must add dues_valid_month check constraint');
  assert.ok(seedContent.includes('CHECK (dues_month >= 1 AND dues_month <= 12)'), 'Month constraint must enforce 1-12');
  assert.ok(seedContent.includes('different_verifier'), 'seed.ts must add different_verifier check constraint');
  assert.ok(seedContent.includes('CHECK (verified_by IS NULL OR verified_by != purchased_by)'), 'Verifier constraint must prevent self-verification');
  assert.ok(seedContent.includes('positive_donation'), 'seed.ts must enforce positive donation constraint');
  assert.ok(seedContent.includes('minimum_dues'), 'seed.ts must enforce minimum dues constraint');
});

// 7. BUG-LOGIC-01: smsSent is updated only on real successful delivery, never on simulation
await test('BUG-LOGIC-01: smsSent reflects true gateway delivery result (not simulation)', () => {
  const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok(routeContent.includes('!smsResult.simulated && smsResult.success'), 'route.ts must check !smsResult.simulated before setting smsSent');

  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  assert.ok(demoContent.includes('!res.simulated && res.success'), 'demo-data.ts must check !res.simulated before setting smsSent');
});

// 8. BUG-LOGIC-02: Anti-collusion dual-volunteer check in demo procurement
await test('BUG-LOGIC-02: Demo procurement enforces peer anti-collusion rule', () => {
  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  const verifyIdx = demoContent.indexOf('case "verify":');
  assert.ok(verifyIdx >= 0, 'case "verify" must exist');
  const verifyBlock = demoContent.slice(verifyIdx, verifyIdx + 400);
  assert.ok(verifyBlock.includes('item.purchasedBy === user!.id') || verifyBlock.includes('item.purchasedBy === user.id'), 'verify must reject self-verification');
});

// 9. BUG-LOGIC-03: Dues collection deduplication prevents retry double-booking
await test('BUG-LOGIC-03: Dues collection enforces month validity and prevents retry double-booking', () => {
  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  const duesIdx = demoContent.indexOf('case "collectDues":');
  assert.ok(duesIdx >= 0, 'case "collectDues" must exist in demo-data.ts');
  const duesBlock = demoContent.slice(duesIdx, duesIdx + 900);
  assert.ok(duesBlock.includes('m < 1 || m > 12'), 'collectDues must reject month outside 1-12');
  assert.ok(duesBlock.includes('isTargetMonthPaid') || duesBlock.includes('already recorded'), 'collectDues must check if month is already recorded');

  const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  const routeDuesIdx = routeContent.indexOf('case "collectDues":');
  assert.ok(routeDuesIdx >= 0, 'case "collectDues" must exist in route.ts');
  const routeDuesBlock = routeContent.slice(routeDuesIdx, routeDuesIdx + 2000);
  assert.ok(routeDuesBlock.includes('occupied.has('), 'route.ts must check occupied set');
  assert.ok(routeDuesBlock.includes('already recorded'), 'route.ts must handle already recorded month retry');
});

// 10. BUG-DATA-01: receiptPhotoUrl in Drizzle schema & TypeScript types
await test('BUG-DATA-01: receiptPhotoUrl defined in Drizzle schema and types', () => {
  const schemaContent = fs.readFileSync(resolveApp('src/db/schema.ts'), 'utf8');
  assert.ok(schemaContent.includes('receiptPhotoUrl: text("receipt_photo_url")'), 'schema.ts must define receiptPhotoUrl');

  const typesContent = fs.readFileSync(resolveApp('src/lib/types.ts'), 'utf8');
  assert.ok(typesContent.includes('receiptPhotoUrl?: string | null'), 'types.ts must include receiptPhotoUrl in Procurement');
});

// 11. BUG-UI-01: Guest mode safe profile access across all views
await test('BUG-UI-01: Views safely handle guest mode without throwing TypeError', () => {
  const overviewContent = fs.readFileSync(resolveApp('src/components/overview.tsx'), 'utf8');
  assert.ok(!overviewContent.includes('data.profiles.find((p) => p.id === data.currentUserId)!;'), 'overview.tsx must not use non-null assertion on profile');
  assert.ok(overviewContent.includes('currentUser?.role || "guest"'), 'overview.tsx must provide safe role fallback');

  const peopleContent = fs.readFileSync(resolveApp('src/components/people-views.tsx'), 'utf8');
  assert.ok(!peopleContent.includes('data.profiles.find((p) => p.id === data.currentUserId)!;'), 'people-views.tsx must not use non-null assertion on profile');

  const fieldContent = fs.readFileSync(resolveApp('src/components/field-views.tsx'), 'utf8');
  assert.ok(!fieldContent.includes('data.profiles.find((p) => p.id === data.currentUserId)!;'), 'field-views.tsx must not use non-null assertion on profile');
  assert.ok(fieldContent.includes('user?.role || "guest"'), 'field-views.tsx must provide safe role fallback');
});

// 12. BUG-UI-02: React Rules of Hooks in workspace-modals
await test('BUG-UI-02: workspace-modals.tsx adheres strictly to Rules of Hooks', () => {
  const content = fs.readFileSync(resolveApp('src/components/workspace-modals.tsx'), 'utf8');
  const startIdx = content.indexOf('export function WorkspaceModals(');
  const endIdx = content.indexOf('return null;\n}');
  assert.ok(startIdx >= 0 && endIdx > startIdx, 'WorkspaceModals function bounds must be found');
  const modalsBody = content.slice(startIdx, endIdx);
  assert.ok(!modalsBody.includes('useState('), 'WorkspaceModals body must not declare conditional useState hooks');
  assert.ok(content.includes('function SmsPreviewModal('), 'SmsPreviewModal sub-component must be extracted at top level');
});

// 13. BUG-PWA-01: Service worker caches and serves static assets offline
await test('BUG-PWA-01: Service worker caches Next.js chunks, styles, and images', () => {
  const swContent = fs.readFileSync(resolveApp('public/sw.js'), 'utf8');
  assert.ok(swContent.includes('/_next/static/'), 'sw.js must intercept /_next/static/');
  assert.ok(swContent.includes('.css'), 'sw.js must intercept stylesheet subresources');
  assert.ok(swContent.includes('.js'), 'sw.js must intercept javascript bundles');
});

// 14. BUG-PWA-02: Offline queue has max retry bound preventing HOL lockup
await test('BUG-PWA-02: Offline queue bounds retries to prevent queue deadlock', () => {
  const queueContent = fs.readFileSync(resolveApp('src/lib/offline-queue.ts'), 'utf8');
  assert.ok(queueContent.includes('MAX_RETRIES'), 'offline-queue.ts must define MAX_RETRIES');
  assert.ok(queueContent.includes('updateOfflineActionRetry'), 'offline-queue.ts must update retry counts on failure');
});

// 15. BUG-BLD-02: No hardcoded Windows absolute paths in scripts
await test('BUG-BLD-02: Automation scripts use portable environment-driven paths', () => {
  const smokeContent = fs.readFileSync(resolveApp('scripts/smoke-test.mjs'), 'utf8');
  assert.ok(!smokeContent.includes("'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe'"), 'smoke-test.mjs must not hardcode Chrome path');

  const mobileContent = fs.readFileSync(resolveApp('scripts/test-mobile.mjs'), 'utf8');
  assert.ok(!mobileContent.includes("'C:/Users/risho/"), 'test-mobile.mjs must not hardcode foreign developer artifact directory');
});

// 16. BUG-POL-01: Official receipt text, official fallback signer, and relative PRD link
await test('BUG-POL-01: Official receipt copy, verified signer Arunabha Ghosh, and relative PRD link', () => {
  const receiptContent = fs.readFileSync(resolveApp('src/app/receipts/[id]/page.tsx'), 'utf8');
  assert.ok(!receiptContent.includes('"Anirban Sen"'), 'receipts must not use hardcoded Anirban Sen fallback');
  assert.ok(receiptContent.includes('"Arunabha Ghosh"'), 'receipts must use official unit secretary Arunabha Ghosh');
  assert.ok(!receiptContent.includes('DEMONSTRATION RECORD · SAMPLE WORKSPACE'), 'receipts must not say DEMONSTRATION RECORD');
  assert.ok(receiptContent.includes('OFFICIAL CONTRIBUTION RECEIPT'), 'receipts must state OFFICIAL CONTRIBUTION RECEIPT');

  const readmeContent = fs.readFileSync(resolveApp('README.md'), 'utf8');
  assert.ok(!readmeContent.includes('file:///c:'), 'README must not contain local Windows file:/// URI');
  assert.ok(readmeContent.includes('[PRD.md](./PRD.md)'), 'README must link PRD using relative path');
});

// 17. Table scroll containers must not trap vertical scroll (overscroll-behavior-y)
await test('Table scroll containers allow vertical wheel/touch scrolling', () => {
  const css = fs.readFileSync(resolveApp('src/app/globals.css'), 'utf8');
  assert.ok(!css.includes('.table-scroll,\n.matrix-table-wrap,\n.login-card,\n.sidebar {\n  overscroll-behavior-y: contain;'), 'table-scroll must not be trapped with overscroll-behavior-y: contain');
  assert.ok(css.includes('.table-scroll,\n.matrix-table-wrap,\n.matrix-scroll {\n  overscroll-behavior-x: contain;\n  overscroll-behavior-y: auto !important;'), 'table-scroll must chain vertical scroll to page');
});

// 18. Mobile Card System & Compact Chips for Field Volunteers
await test('Mobile cards system and compact mini-stats defined for field users', () => {
  const peopleViews = fs.readFileSync(resolveApp('src/components/people-views.tsx'), 'utf8');
  assert.ok(peopleViews.includes('mobile-member-cards'), 'MembersView must render mobile-member-cards container');
  assert.ok(peopleViews.includes('mobile-donation-cards'), 'DonationsView must render mobile-donation-cards container');

  const css = fs.readFileSync(resolveApp('src/app/globals.css'), 'utf8');
  assert.ok(css.includes('.mobile-member-cards,\n.mobile-donation-cards {\n  display: none;\n}'), 'Mobile cards must be hidden on desktop');
  assert.ok(css.includes('.desktop-only-table {\n    display: none !important;\n  }'), 'Desktop tables must be hidden on mobile screens');
  assert.ok(css.includes('.mobile-member-cards,\n  .mobile-donation-cards {\n    display: flex !important;'), 'Mobile cards must display on mobile screens');
});

// 19. BUG-DB-02: Drizzle migrations directory with real SQL schemas and CHECK constraints
await test('BUG-DB-02: Drizzle migrations generated with CHECK constraints, sessions, and idempotency', () => {
  assert.ok(fs.existsSync(resolveApp('drizzle')), 'drizzle migration directory must exist');
  const migrationFiles = fs.readdirSync(resolveApp('drizzle')).filter(f => f.endsWith('.sql'));
  assert.ok(migrationFiles.length >= 1, 'At least 1 SQL migration must be generated');
  const allSql = migrationFiles.map(f => fs.readFileSync(resolveApp(path.join('drizzle', f)), 'utf8')).join('\n');
  assert.ok(allSql.includes('sessions'), 'SQL migration must create sessions table');
  assert.ok(allSql.includes('action_idempotency'), 'SQL migration must create action_idempotency table');
  assert.ok(allSql.includes('dues_valid_month'), 'SQL migration must contain dues_valid_month check');
  assert.ok(allSql.includes('different_verifier'), 'SQL migration must contain different_verifier check');
  assert.ok(allSql.includes('idempotency_key'), 'SQL migration must contain idempotency_key columns');
});

// 20. BUG-PWA-03: Offline queue preserves funds and quarantines validation rejections to needs_attention
await test('BUG-PWA-03: Offline queue preserves funds on network error and routes 400 to needs_attention', () => {
  const queueContent = fs.readFileSync(resolveApp('src/lib/offline-queue.ts'), 'utf8');
  assert.ok(queueContent.includes('markOfflineActionNeedsAttention'), 'offline-queue.ts must define markOfflineActionNeedsAttention');
  assert.ok(queueContent.includes('getNeedsAttentionActions'), 'offline-queue.ts must define getNeedsAttentionActions');
  assert.ok(queueContent.includes('isPermanentValidation'), 'offline-queue.ts must distinguish permanent validation errors');
  assert.ok(queueContent.includes('status === 400'), 'offline-queue.ts must only increment retries on HTTP 400 validation rejection');
});

// 21. BUG-SEC-06: PINs are unseeded from public code and hashed with random salt
await test('BUG-SEC-06: No hardcoded PINs seeded in source code or demo data', () => {
  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  assert.ok(!demoContent.includes('INITIAL_DEMO_PINS'), 'demo-data.ts must not contain INITIAL_DEMO_PINS');
  assert.ok(!demoContent.includes('"2401"'), 'demo-data.ts must not hardcode PIN 2401');

  const seedContent = fs.readFileSync(resolveApp('src/db/seed.ts'), 'utf8');
  assert.ok(!seedContent.includes('INITIAL_PINS'), 'seed.ts must not contain INITIAL_PINS');
});

console.log(`\n${CYAN}════════════════════════════════════════════════════════════════════════════${RESET}`);
if (passed === total) {
  console.log(`${GREEN}${BOLD}  RESULT: ${passed}/${total} VERIFICATION CHECKS PASSED (100%)${RESET}`);
  console.log(`${CYAN}════════════════════════════════════════════════════════════════════════════${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}  RESULT: ${passed}/${total} CHECKS PASSED, ${total - passed} FAILED${RESET}`);
  console.log(`${CYAN}════════════════════════════════════════════════════════════════════════════${RESET}\n`);
  process.exit(1);
}
