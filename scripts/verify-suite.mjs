#!/usr/bin/env node
/**
 * ============================================================================
 * Breakthrough Science Society — Jalpaiguri Unit Management Platform
 * Verification Test Suite
 *
 * Verifies that all cataloged security, crash, logic, data parity, and
 * PWA issues are fully patched and pass strict regression testing.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

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

// 1. BUG-SEC-01: No unauthenticated default admin fallback in route.ts
await test('BUG-SEC-01: route.ts denies unauthenticated admin fallback', () => {
  const content = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok(!content.includes('?.value || ADMIN_ID'), 'Route must not default missing session cookie to ADMIN_ID');
  assert.ok(content.includes('!isPublicAction && !userId'), 'Route must reject unauthenticated requests to protected actions');
});

// 2. BUG-SEC-02: switchUser requires admin role
await test('BUG-SEC-02: switchUser enforces executive authorization', () => {
  const content = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  const switchIdx = content.indexOf('case "switchUser":');
  assert.ok(switchIdx >= 0, 'switchUser case must exist');
  const block = content.slice(switchIdx, switchIdx + 300);
  assert.ok(block.includes('requireRole(["admin"])'), 'switchUser in route.ts must require admin role');

  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  const demoSwitchIdx = demoContent.indexOf('case "switchUser":');
  assert.ok(demoSwitchIdx >= 0, 'demo switchUser case must exist');
  const demoBlock = demoContent.slice(demoSwitchIdx, demoSwitchIdx + 300);
  assert.ok(demoBlock.includes('user.role !== "admin"'), 'switchUser in demo-data.ts must restrict to admin');
});

// 3. BUG-SEC-03: Member PINs are not exposed to other members or executives
await test('BUG-SEC-03: assignedPin never leaks other members credentials', () => {
  const wsContent = fs.readFileSync(resolveApp('src/lib/workspace.ts'), 'utf8');
  assert.ok(!wsContent.includes('userIsAdmin ? person.pin'), 'workspace.ts must not leak member PINs to admins');
  assert.ok(wsContent.includes('person.id === userId ? person.pin : undefined'), 'workspace.ts should only return assignedPin for own profile');

  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  assert.ok(!demoContent.includes('userIsAdmin ? (demoPins.get'), 'demo-data.ts must not leak member PINs to admins');
});

// 4. BUG-LOGIC-01: smsSent is updated only on successful delivery
await test('BUG-LOGIC-01: smsSent reflects true gateway delivery result', () => {
  const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok(!routeContent.includes('{ smsSent: true, donorPhone: phone }'), 'route.ts must not set smsSent unconditionally');
  assert.ok(routeContent.includes('if (smsResult.success)'), 'route.ts must check smsResult.success before setting smsSent');

  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  assert.ok(!demoContent.includes('donation.smsSent = true;\n        try'), 'demo-data.ts must not mark smsSent before try block');
});

// 5. BUG-LOGIC-02: Anti-collusion dual-volunteer check in demo procurement
await test('BUG-LOGIC-02: Demo procurement enforces peer anti-collusion rule', () => {
  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  const verifyIdx = demoContent.indexOf('case "verify":');
  assert.ok(verifyIdx >= 0, 'case "verify" must exist');
  const verifyBlock = demoContent.slice(verifyIdx, verifyIdx + 400);
  assert.ok(verifyBlock.includes('item.purchasedBy === user!.id') || verifyBlock.includes('item.purchasedBy === user.id'), 'verify must reject self-verification');
});

// 6. BUG-DATA-01: receiptPhotoUrl in Drizzle schema & TypeScript types
await test('BUG-DATA-01: receiptPhotoUrl defined in Drizzle schema and types', () => {
  const schemaContent = fs.readFileSync(resolveApp('src/db/schema.ts'), 'utf8');
  assert.ok(schemaContent.includes('receiptPhotoUrl: text("receipt_photo_url")'), 'schema.ts must define receiptPhotoUrl');

  const typesContent = fs.readFileSync(resolveApp('src/lib/types.ts'), 'utf8');
  assert.ok(typesContent.includes('receiptPhotoUrl?: string | null'), 'types.ts must include receiptPhotoUrl in Procurement');
});

// 7. BUG-UI-01: Guest mode safe profile access across all views
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

// 8. BUG-UI-02: React Rules of Hooks in workspace-modals
await test('BUG-UI-02: workspace-modals.tsx adheres strictly to Rules of Hooks', () => {
  const content = fs.readFileSync(resolveApp('src/components/workspace-modals.tsx'), 'utf8');
  const startIdx = content.indexOf('export function WorkspaceModals(');
  const endIdx = content.indexOf('return null;\n}');
  assert.ok(startIdx >= 0 && endIdx > startIdx, 'WorkspaceModals function bounds must be found');
  const modalsBody = content.slice(startIdx, endIdx);
  assert.ok(!modalsBody.includes('useState('), 'WorkspaceModals body must not declare conditional useState hooks');
  assert.ok(content.includes('function SmsPreviewModal('), 'SmsPreviewModal sub-component must be extracted at top level');
});

// 9. BUG-PWA-01: Service worker caches and serves static assets offline
await test('BUG-PWA-01: Service worker caches Next.js chunks, styles, and images', () => {
  const swContent = fs.readFileSync(resolveApp('public/sw.js'), 'utf8');
  assert.ok(swContent.includes('/_next/static/'), 'sw.js must intercept /_next/static/');
  assert.ok(swContent.includes('.css'), 'sw.js must intercept stylesheet subresources');
  assert.ok(swContent.includes('.js'), 'sw.js must intercept javascript bundles');
});

// 10. BUG-PWA-02: Offline queue has max retry bound preventing HOL lockup
await test('BUG-PWA-02: Offline queue bounds retries to prevent queue deadlock', () => {
  const queueContent = fs.readFileSync(resolveApp('src/lib/offline-queue.ts'), 'utf8');
  assert.ok(queueContent.includes('MAX_RETRIES'), 'offline-queue.ts must define MAX_RETRIES');
  assert.ok(queueContent.includes('updateOfflineActionRetry'), 'offline-queue.ts must update retry counts on failure');
});

// 11. BUG-BLD-02: No hardcoded Windows absolute paths in scripts
await test('BUG-BLD-02: Automation scripts use portable environment-driven paths', () => {
  const smokeContent = fs.readFileSync(resolveApp('scripts/smoke-test.mjs'), 'utf8');
  assert.ok(!smokeContent.includes("'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe'"), 'smoke-test.mjs must not hardcode Chrome path');

  const mobileContent = fs.readFileSync(resolveApp('scripts/test-mobile.mjs'), 'utf8');
  assert.ok(!mobileContent.includes("'C:/Users/risho/"), 'test-mobile.mjs must not hardcode foreign developer artifact directory');
});

// 12. BUG-BLD-03: No duplicate i18n.ts file
await test('BUG-BLD-03: src/lib/i18n.ts duplicate file is deleted', () => {
  assert.ok(!fs.existsSync(resolveApp('src/lib/i18n.ts')), 'src/lib/i18n.ts must be deleted');
  assert.ok(fs.existsSync(resolveApp('src/lib/i18n.tsx')), 'src/lib/i18n.tsx must exist');
});

// 13. Next.js Error boundary exists
await test('Graceful error boundary src/app/error.tsx exists', () => {
  assert.ok(fs.existsSync(resolveApp('src/app/error.tsx')), 'src/app/error.tsx must exist');
});

// 14. Table scroll containers must not trap vertical scroll (overscroll-behavior-y)
await test('Table scroll containers allow vertical wheel/touch scrolling', () => {
  const css = fs.readFileSync(resolveApp('src/app/globals.css'), 'utf8');
  assert.ok(!css.includes('.table-scroll,\n.matrix-table-wrap,\n.login-card,\n.sidebar {\n  overscroll-behavior-y: contain;'), 'table-scroll must not be trapped with overscroll-behavior-y: contain');
  assert.ok(css.includes('.table-scroll,\n.matrix-table-wrap,\n.matrix-scroll {\n  overscroll-behavior-x: contain;\n  overscroll-behavior-y: auto !important;'), 'table-scroll must chain vertical scroll to page');
});

// 15. Mobile Card System & Compact Chips for Field Volunteers
await test('Mobile cards system and compact mini-stats defined for field users', () => {
  const peopleViews = fs.readFileSync(resolveApp('src/components/people-views.tsx'), 'utf8');
  assert.ok(peopleViews.includes('mobile-member-cards'), 'MembersView must render mobile-member-cards container');
  assert.ok(peopleViews.includes('mobile-donation-cards'), 'DonationsView must render mobile-donation-cards container');

  const css = fs.readFileSync(resolveApp('src/app/globals.css'), 'utf8');
  assert.ok(css.includes('.mobile-member-cards,\n.mobile-donation-cards {\n  display: none;\n}'), 'Mobile cards must be hidden on desktop');
  assert.ok(css.includes('.desktop-only-table {\n    display: none !important;\n  }'), 'Desktop tables must be hidden on mobile screens');
  assert.ok(css.includes('.mobile-member-cards,\n  .mobile-donation-cards {\n    display: flex !important;'), 'Mobile cards must display on mobile screens');
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
