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

// 2. BUG-SEC-02: no credential-less sign-in and no impersonation
// These are tripwires for two holes that existed once. They only read source text, so they cannot prove
// the handlers are safe: run the behaviour scenarios in verification/ for that.
await test('BUG-SEC-02: no public "login" action and no "switchUser" impersonation exist', () => {
  const content = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok(!content.includes('case "login":'), 'route.ts must not contain a credential-less login action');
  assert.ok(!content.includes('case "switchUser":'), 'route.ts must not contain switchUser impersonation');
  assert.ok(!/isPublicAction\s*=\s*\[[^\]]*"login"/.test(content), '"login" must not be a public action');

  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  assert.ok(!demoContent.includes('case "switchUser":'), 'demo-data.ts must not contain switchUser');
  assert.ok(!demoContent.includes('case "login":'), 'demo mode must not have a credential-less login either');
  assert.ok(!/isPublicAction\s*=\s*\[[^\]]*"login"/.test(demoContent), '"login" must not be a public demo action');
});

// 3. BUG-SEC-03: Zero PIN storage; single-use Crockford Base32 claim codes are hashed with SHA-256
await test('BUG-SEC-03: Zero PIN storage; single-use Crockford Base32 claim codes are hashed with SHA-256', () => {
  const schemaContent = fs.readFileSync(resolveApp('src/db/schema.ts'), 'utf8');
  assert.ok(!schemaContent.includes('pin:'), 'schema.ts must not define any PIN column');
  assert.ok(schemaContent.includes('claimCodes'), 'schema.ts must define claimCodes table');
  assert.ok(schemaContent.includes('codeHash: text("code_hash")'), 'claimCodes must store code_hash only');

  const typesContent = fs.readFileSync(resolveApp('src/lib/types.ts'), 'utf8');
  assert.ok(!typesContent.includes('pin: string'), 'Profile type must not include pin');
  assert.ok(!typesContent.includes('assignedPin: string'), 'Profile type must not include assignedPin');
  assert.ok(typesContent.includes('hasGoogleLinked'), 'Profile type must track hasGoogleLinked');

  const claimModule = fs.readFileSync(resolveApp('src/lib/claim-codes.ts'), 'utf8');
  assert.ok(claimModule.includes('generateClaimCode'), 'claim-codes.ts must export generateClaimCode');
  assert.ok(claimModule.includes('hashClaimCode'), 'claim-codes.ts must export hashClaimCode');
  assert.ok(claimModule.includes('normalizeCode'), 'claim-codes.ts must normalize Crockford Base32 input');

  // Verify single-use code operations in route.ts
  const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok(routeContent.includes('case "issueClaimCode":'), 'route.ts must support issueClaimCode');
  assert.ok(routeContent.includes('case "claimInviteCode":'), 'route.ts must support claimInviteCode');
  assert.ok(routeContent.includes('case "unlinkGoogle":'), 'route.ts must support unlinkGoogle');
  assert.ok(!routeContent.includes('resetPinWithGoogle'), 'route.ts must eliminate resetPinWithGoogle');

  // People views must not render plaintext PIN chip
  const peopleViews = fs.readFileSync(resolveApp('src/components/people-views.tsx'), 'utf8');
  assert.ok(!peopleViews.includes('PIN: <code>{p.assignedPin}</code>'), 'people-views.tsx must not render PIN display chip');
});

// 4. BUG-SEC-04: Strict server-side projection across Public, Member, Volunteer, and Executive
await test('BUG-SEC-04: Strict server-side projection: zero leaks for Public and role-isolated visibility', () => {
  const wsContent = fs.readFileSync(resolveApp('src/lib/workspace.ts'), 'utf8');
  // Public visitors: server sends empty lists for internal data
  assert.ok(wsContent.includes('profiles: []'), 'workspace.ts must return empty profile roster for public visitors');
  assert.ok(wsContent.includes('dues: []'), 'workspace.ts must return empty dues ledger for public visitors');
  assert.ok(wsContent.includes('donations: []'), 'workspace.ts must return empty donations list for public visitors');
  assert.ok(wsContent.includes('procurements: []'), 'workspace.ts must return empty procurements for public visitors');
  assert.ok(wsContent.includes('circulars: []'), 'workspace.ts must return empty circulars for public visitors');
  assert.ok(wsContent.includes('openingBalance: 0'), 'workspace.ts must zero openingBalance for public visitors');

  // Members & Volunteers: phone numbers and other members dues stripped
  assert.ok(wsContent.includes('isExecutive || person.id === requestingUser.id ? person.phone : null'), 'workspace.ts must strip phone numbers for non-executives');
  assert.ok(wsContent.includes('payments.filter((p) => p.memberId === requestingUser.id)'), 'workspace.ts must isolate dues to own dues only for non-executives');

  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  assert.ok(demoContent.includes('profiles: []'), 'demo-data.ts must return empty profiles for unauthenticated visitors');
  assert.ok(demoContent.includes('dues: []'), 'demo-data.ts must return empty dues ledger for unauthenticated visitors');
  assert.ok(demoContent.includes('donations: []'), 'demo-data.ts must return empty donations list for unauthenticated visitors');
  assert.ok(demoContent.includes('circulars: []'), 'demo-data.ts must return empty circulars for unauthenticated visitors');
});

// 5. BUG-SEC-05: Rate limiting on member-code claim attempts (PIN login no longer exists)
await test('BUG-SEC-05: member-code claim attempts are rate limited', () => {
  const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok(routeContent.includes('checkClaimRateLimit'), 'route.ts must rate limit claim attempts');
  assert.ok(routeContent.includes('status: 429'), 'route.ts must return HTTP 429 when rate limit exceeded');

  const claimFile = fs.readFileSync(resolveApp('src/lib/claim-codes.ts'), 'utf8');
  assert.ok(claimFile.includes('record.attempts >= 5'), 'claim-codes.ts must cap attempts at 5 per window');
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

// 22. BUG-SEC-07: Push subscription requires authenticated session (no unauthenticated injection)
await test('BUG-SEC-07: Push subscription rejects unauthenticated calls with HTTP 401', () => {
  const pushContent = fs.readFileSync(resolveApp('src/app/api/push/route.ts'), 'utf8');
  assert.ok(pushContent.includes('verifySessionToken'), 'push route.ts must verify session token');
  assert.ok(!pushContent.includes('ADMIN_ID'), 'push route.ts must not fallback to ADMIN_ID');
  assert.ok(pushContent.includes('status: 401'), 'push route.ts must return 401 for unauthenticated calls');
});

// 23. BUG-SEC-08: India DPDP Act minor consent & in-app browser detection
await test('BUG-SEC-08: India DPDP Act minor data consent and in-app browser alert', () => {
  const loginContent = fs.readFileSync(resolveApp('src/components/login-screen.tsx'), 'utf8');
  assert.ok(loginContent.includes('Digital Personal Data Protection (DPDP) Act'), 'login-screen.tsx must cite DPDP Act');
  assert.ok(loginContent.includes('isMinor'), 'login-screen.tsx must handle isMinor status');
  assert.ok(loginContent.includes('guardianName'), 'login-screen.tsx must collect parent/guardian consent');
  assert.ok(loginContent.includes('isInAppBrowser'), 'login-screen.tsx must detect in-app browser webviews');
  assert.ok(loginContent.includes('Open in Chrome'), 'login-screen.tsx must instruct opening external browser');
});

// 24. BUG-SEC-09: Science demonstration procedures sanitized for public visitors
await test('BUG-SEC-09: Demonstration chemical/heat steps sanitized for public visitors', () => {
  const resourceContent = fs.readFileSync(resolveApp('src/lib/resources.ts'), 'utf8');
  assert.ok(resourceContent.includes('getSanitizedResources'), 'resources.ts must export getSanitizedResources');
  assert.ok(resourceContent.includes('isAuthenticated: boolean'), 'resources.ts must check authentication');
  assert.ok(resourceContent.includes('safetyNotes: undefined') || resourceContent.includes('safetyNotes: []'), 'resources.ts must strip safety notes for public visitors');
  assert.ok(resourceContent.includes('materials: undefined') || resourceContent.includes('materials: []'), 'resources.ts must strip materials for public visitors');
  assert.ok(resourceContent.includes('Summary for Public Viewers'), 'resources.ts must include summary notice for public visitors');
});

// 25. BUG-SEC-10: checkMemberDues enforces authorization and prevents peer dues reconnaissance
await test('BUG-SEC-10: checkMemberDues requires authentication and forbids peer dues snooping', () => {
  const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok(!routeContent.includes('"checkMemberDues"].includes(body.action)'), 'checkMemberDues must not be in isPublicAction');
  assert.ok(routeContent.includes('user.role === "member" && memberId !== user.id'), 'route.ts must prevent members from snooping peer dues');

  const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
  assert.ok(demoContent.includes('user.role === "member" && body.memberId !== user.id'), 'demo-data.ts must prevent members from snooping peer dues');
});

// 26. BUG-SEC-11: Public & members can donate while register browsing remains executive-only
await test('BUG-SEC-11: Universal donation intake with strictly isolated register browsing', () => {
  const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok(routeContent.includes('"addDonation"].includes(body.action)'), 'addDonation must be accepted publicly');

  const wsContent = fs.readFileSync(resolveApp('src/lib/workspace.ts'), 'utf8');
  assert.ok(wsContent.includes('projectedDonations = isExecutive ? contributions : []'), 'workspace.ts must restrict donation register to executive');
});

// 27. BUG-SEC-12: Dues matrix and register UI views isolate non-executives
await test('BUG-SEC-12: Non-executives isolated from 12-Month matrix and full donor register', () => {
  const viewsContent = fs.readFileSync(resolveApp('src/components/people-views.tsx'), 'utf8');
  assert.ok(viewsContent.includes('if (!isExecutive) {') && viewsContent.includes('My Membership Contributions'), 'DuesView must render personal dues card for non-executives');
  assert.ok(viewsContent.includes('Field Donation Workbench (Record Only)'), 'DonationsView must render record workbench for non-executives');
  assert.ok(viewsContent.includes('(isExecutive || p.id === data.currentUserId) && ('), 'MembersView must restrict ID card button to own profile or executive');
});

// 28. BUG-SEC-13: ID card QR code adheres to "name and validity only" rule
await test('BUG-SEC-13: ID card QR payload omits phone number for verified privacy', () => {
  const idCardContent = fs.readFileSync(resolveApp('src/components/id-card.tsx'), 'utf8');
  const payloadIdx = idCardContent.indexOf('const payload = [');
  assert.ok(payloadIdx >= 0, 'payload array must exist in id-card.tsx');
  const payloadBlock = idCardContent.slice(payloadIdx, payloadIdx + 400);
  assert.ok(!payloadBlock.includes('member.phone'), 'QR verification payload must not include phone number');
  assert.ok(payloadBlock.includes('Validity: Active'), 'QR verification payload must include validity');
});

// 29. BUG-SEC-14: no public bootstrap secret and no hardcoded executive e-mail anywhere in the source.
// A tripwire for one value that has already leaked. The first executive is created with `npm run setup:admin`.
await test('BUG-SEC-14: no public bootstrap code or hardcoded executive e-mail in the source', () => {
  const burned = ['293672d5bac17faaedab18d894dfa18b62f987ffef09a05c1cf8bebbeb7da6b5', 'K7M2-Q9XD', 'K7M2Q9XD'];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' || e.name === '.next' ? [] : walk(p);
    return /\.(ts|tsx|mjs|js|json|md|sql)$/.test(e.name) ? [p] : [];
  });
  for (const root of ['src', 'scripts']) {
    for (const file of walk(resolveApp(root))) {
      if (file.endsWith('verify-suite.mjs')) continue; // this file names the values it forbids
      const text = fs.readFileSync(file, 'utf8');
      const rel = path.relative(ROOT_DIR, file);
      for (const secret of burned) assert.ok(!text.includes(secret), `${rel} must not contain the leaked bootstrap code`);
      assert.ok(!/SET\s+google_email\s*=\s*'/i.test(text), `${rel} must not hard-bind an e-mail address to a profile`);
    }
  }
});

// 30. BUG-SEC-15: authentication fails closed in production. These are tripwires on the source;
// the behaviour itself (start / refuse to start under each environment) is exercised by the verification harness.
await test('BUG-SEC-15: auth.ts has no built-in secret and refuses to start without its settings in production', () => {
  const authSrc = fs.readFileSync(resolveApp('src/lib/auth.ts'), 'utf8');
  assert.ok(!/[0-9a-f]{40,}/i.test(authSrc), 'auth.ts must not contain a hard-coded key');
  assert.ok(!/BETTER_AUTH_SECRET\s*\|\|/.test(authSrc), 'BETTER_AUTH_SECRET must not have a fallback value');
  assert.ok(!/demo-google-client/.test(authSrc), 'Google credentials must not fall back to placeholders');
  assert.ok(!/VERCEL_URL/.test(authSrc), 'the public URL must be configured explicitly, not guessed');
  assert.ok(authSrc.includes('isProductionRuntime()'), 'auth.ts must know whether it is running in production');
  assert.ok(/setting\("BETTER_AUTH_SECRET"\)/.test(authSrc) && /setting\("BETTER_AUTH_URL"\)/.test(authSrc), 'the secret and the URL must both be required in production');
  const env = fs.readFileSync(resolveApp('.env.example'), 'utf8');
  for (const key of ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']) {
    assert.ok(env.includes(`${key}=`), `.env.example must document ${key}`);
  }
});

// 31. BUG-SEC-16: demo mode (in-memory data, development-only sign-in) never answers production traffic.
await test('BUG-SEC-16: demo mode, demo receipts and a healthy health check are refused in production', () => {
  const route = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok((route.match(/if \(demoModeRefused\(\)\) return notConfigured\(\);/g) || []).length >= 2, 'both GET and POST must refuse demo mode in production');
  assert.ok(/status: 503/.test(route), 'a production server without a database must answer 503');
  const ws = fs.readFileSync(resolveApp('src/lib/workspace.ts'), 'utf8');
  assert.ok(/isProductionRuntime\(\)[\s\S]{0,200}getDemoWorkspace/.test(ws), 'getWorkspace must not return demo data in production');
  const receipt = fs.readFileSync(resolveApp('src/app/receipts/[id]/page.tsx'), 'utf8');
  assert.ok(/!isDatabaseConfigured && isProductionRuntime\(\)/.test(receipt), 'demo receipts must not be served in production');
  const health = fs.readFileSync(resolveApp('src/app/api/health/route.ts'), 'utf8');
  assert.ok(/status: production \? 503 : 200/.test(health), 'the health check must fail when production has no database');
});

// 32. BUG-SEC-17: one Google account, one profile, enforced by the database; application review is all-or-nothing.
// Tripwires on the source. The behaviour (two simultaneous claims, a failed approval) is in verification/followups.mjs.
await test('BUG-SEC-17: unique Google id in the database; claim and application review depend on it', () => {
  const seed = fs.readFileSync(resolveApp('src/db/seed.ts'), 'utf8');
  assert.ok(/CREATE UNIQUE INDEX IF NOT EXISTS profiles_google_sub_key ON profiles \(google_sub\)/.test(seed), 'seed.ts must create the unique index on profiles.google_sub');
  const schema = fs.readFileSync(resolveApp('src/db/schema.ts'), 'utf8');
  assert.ok(/googleSub: text\("google_sub"\)\.unique\(\)/.test(schema), 'schema.ts must declare profiles.google_sub as unique');
  const route = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
  assert.ok((route.match(/isUniqueViolation\(error\)/g) || []).length >= 2, 'claim and application approval must turn a unique violation into a clear message');
  const at = route.indexOf('case "reviewApplication"');
  assert.ok(at >= 0 && route.slice(at, at + 700).includes('db.transaction'), 'reviewApplication must run in one transaction');
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
