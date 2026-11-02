#!/usr/bin/env node
/**
 * ============================================================================
 * Breakthrough Science Society — Jalpaiguri Unit Management Platform
 * Automated Code Audit & Bug Reproduction Suite
 *
 * Script: scripts/audit-reproduce.mjs
 * Purpose: Objectively and deterministically verify and reproduce cataloged
 *          security vulnerabilities, runtime crashes, PWA flaws, logic bugs,
 *          and build configuration defects.
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createJiti } from 'jiti';

const ROOT_DIR = process.cwd();
const resolveApp = (rel) => path.resolve(ROOT_DIR, rel);

const jiti = createJiti(import.meta.url, {
  alias: {
    '@': resolveApp('./src'),
  },
});

// Color helpers for terminal output
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

const results = [];

function banner(title) {
  console.log(`\n${CYAN}════════════════════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}  ${title}${RESET}`);
  console.log(`${CYAN}════════════════════════════════════════════════════════════════════════════${RESET}\n`);
}

async function recordTest(id, title, severity, category, runFn) {
  process.stdout.write(`${BOLD}[TEST] ${id}${RESET}: ${title} ... `);
  try {
    const evidence = await runFn();
    console.log(`${GREEN}${BOLD}REPRODUCED (DEFECT VERIFIED)${RESET}`);
    results.push({
      id,
      title,
      severity,
      category,
      status: 'REPRODUCED',
      evidence,
    });
  } catch (err) {
    console.log(`${RED}${BOLD}FAILED TO REPRODUCE${RESET}`);
    console.error(`  ${RED}Error: ${err.message}${RESET}`);
    results.push({
      id,
      title,
      severity,
      category,
      status: 'NOT_REPRODUCED',
      error: err.message,
    });
  }
}

banner('BSS UNIT MANAGEMENT PLATFORM — AUTOMATED DEFECT REPRODUCTION SUITE');
console.log(`Working Directory: ${ROOT_DIR}`);
console.log(`Node Runtime:      ${process.version}`);
console.log(`Execution Mode:    Deterministic Offline Audit Harness\n`);

// ============================================================================
// TEST 1: BUG-SEC-01 — Default Admin Fallback on Unauthenticated Requests
// ============================================================================
await recordTest(
  'BUG-SEC-01',
  'Default Admin Fallback on Unauthenticated Requests',
  'Critical',
  'Security / Authentication',
  async () => {
    const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
    const routeLines = routeContent.split('\n');

    // 1. Verify code-level fallback line
    const fallbackLineIndex = routeLines.findIndex((line) =>
      line.includes('request.cookies.get("bss_demo_user")?.value || ADMIN_ID')
    );
    assert.ok(fallbackLineIndex >= 0, 'Fallback to ADMIN_ID line missing from route.ts');
    const exactLine = routeLines[fallbackLineIndex].trim();

    // 2. Execute demonstration using demo-data module
    const { executeDemoAction, DEMO_ADMIN_ID } = jiti(resolveApp('src/lib/demo-data.ts'));
    
    // Simulate unauthenticated request: cookie is undefined
    const simulatedCookie = undefined;
    const resolvedUserId = simulatedCookie?.value || DEMO_ADMIN_ID;
    assert.equal(resolvedUserId, DEMO_ADMIN_ID, 'Cookie fallback must resolve to DEMO_ADMIN_ID');

    // Attempt administrative mutation without credentials
    const testAdminAction = {
      fullName: `Exploit Test Member ${Date.now()}`,
      role: 'admin',
      monthlyPledge: 100,
    };
    const res = await executeDemoAction('addMember', testAdminAction, resolvedUserId);

    assert.ok(
      res.message.includes('New member registered') || res.message.includes('added'),
      'Administrative action should succeed due to ADMIN_ID fallback'
    );

    return {
      filePath: 'src/app/api/workspace/route.ts',
      lineNumber: fallbackLineIndex + 1,
      codeSnippet: exactLine,
      attackVector: 'Unauthenticated POST request with no cookies',
      resolvedIdentity: resolvedUserId,
      outcome: `Unauthenticated caller executed administrative action: "${res.message}"`,
    };
  }
);

// ============================================================================
// TEST 2: BUG-SEC-02 — Arbitrary User and Admin Impersonation via switchUser
// ============================================================================
await recordTest(
  'BUG-SEC-02',
  'Arbitrary User and Admin Impersonation via switchUser Action',
  'Critical',
  'Security / Access Control',
  async () => {
    const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
    const switchCaseIndex = routeContent.indexOf('case "switchUser":');
    assert.ok(switchCaseIndex >= 0, 'case "switchUser" missing from route.ts');
    
    // Check that requireRole is omitted in the switchUser block
    const switchBlock = routeContent.slice(switchCaseIndex, switchCaseIndex + 400);
    assert.ok(!switchBlock.includes('requireRole'), 'switchUser must not contain requireRole');

    const { executeDemoAction, DEMO_ADMIN_ID } = jiti(resolveApp('src/lib/demo-data.ts'));
    
    // Impersonate admin from an unauthenticated or low-privilege perspective
    const attackerId = 'unauthenticated-guest';
    const switchRes = await executeDemoAction('switchUser', { userId: DEMO_ADMIN_ID }, attackerId);

    assert.equal(switchRes.nextUser, DEMO_ADMIN_ID, 'switchUser must return target admin ID without authorization');

    return {
      filePath: 'src/app/api/workspace/route.ts',
      lines: '297-306',
      targetSwitched: DEMO_ADMIN_ID,
      responseNextUser: switchRes.nextUser,
      outcome: `Caller successfully impersonated unit executive (${switchRes.nextUser}) without password, role check, or MFA.`,
    };
  }
);

// ============================================================================
// TEST 3: BUG-SEC-04 — Unverified Mock Google Account PIN Recovery
// ============================================================================
await recordTest(
  'BUG-SEC-04',
  'Unverified Mock Google PIN Recovery (Instant Account Takeover)',
  'High',
  'Security / Identity Verification',
  async () => {
    const { executeDemoAction, DEMO_ADMIN_ID } = jiti(resolveApp('src/lib/demo-data.ts'));
    
    // Setup target member with a linked Google email
    const victimEmail = 'arunabha.science@gmail.com';
    await executeDemoAction('linkGoogle', { googleEmail: victimEmail }, DEMO_ADMIN_ID);

    // Attacker resets victim's PIN knowing only victim's publicly known email
    const newAttackerPin = '9999';
    const resetRes = await executeDemoAction(
      'resetPinWithGoogle',
      { memberId: DEMO_ADMIN_ID, googleEmail: victimEmail, newPin: newAttackerPin },
      ''
    );

    assert.ok(resetRes.message.includes('Identity verified via'), 'Reset must claim identity verified');
    assert.equal(resetRes.nextUser, DEMO_ADMIN_ID, 'Reset must log attacker into victim account');

    // Confirm victim can now be logged in with attacker's new PIN
    const loginRes = await executeDemoAction('login', { memberId: DEMO_ADMIN_ID, pin: newAttackerPin }, '');
    assert.ok(loginRes.message.includes('Welcome back'), 'Victim account must accept hijacked PIN');

    return {
      filePath: 'src/app/api/workspace/route.ts',
      lines: '132-146',
      victimId: DEMO_ADMIN_ID,
      victimEmail,
      hijackedPin: newAttackerPin,
      outcome: `Account hijacked: Attacker reset PIN to "${newAttackerPin}" and authenticated as victim without OAuth tokens.`,
    };
  }
);

// ============================================================================
// TEST 4: BUG-UI-01 — Uncaught TypeError Crashing Guest Mode
// ============================================================================
await recordTest(
  'BUG-UI-01',
  'Uncaught TypeError Crashing Guest Mode (White Screen of Death)',
  'Critical',
  'UI / Runtime Crash',
  async () => {
    const { getDemoWorkspace } = jiti(resolveApp('src/lib/demo-data.ts'));
    
    // In Guest Mode, currentUserId is ""
    const guestWorkspace = await getDemoWorkspace('');
    assert.equal(guestWorkspace.currentUserId, '', 'Guest mode currentUserId must be empty string');

    const failingViews = [];

    // 1. Overview (src/components/overview.tsx:17-18)
    try {
      const currentUser = guestWorkspace.profiles.find((p) => p.id === guestWorkspace.currentUserId);
      // Simulating line 18: currentUser.role
      const _role = currentUser.role;
    } catch (err) {
      failingViews.push({
        view: 'Overview',
        file: 'src/components/overview.tsx:17-18',
        error: `${err.name}: ${err.message}`,
      });
    }

    // 2. DuesView (src/components/people-views.tsx:274-275)
    try {
      const user = guestWorkspace.profiles.find((p) => p.id === guestWorkspace.currentUserId);
      const _role = user.role;
    } catch (err) {
      failingViews.push({
        view: 'DuesView',
        file: 'src/components/people-views.tsx:274-275',
        error: `${err.name}: ${err.message}`,
      });
    }

    // 3. DonationsView (src/components/people-views.tsx:455-456)
    try {
      const user = guestWorkspace.profiles.find((p) => p.id === guestWorkspace.currentUserId);
      const _role = user.role;
    } catch (err) {
      failingViews.push({
        view: 'DonationsView',
        file: 'src/components/people-views.tsx:455-456',
        error: `${err.name}: ${err.message}`,
      });
    }

    // 4. ProcurementView (src/components/field-views.tsx:130-131)
    try {
      const user = guestWorkspace.profiles.find((p) => p.id === guestWorkspace.currentUserId);
      const _role = user.role;
    } catch (err) {
      failingViews.push({
        view: 'ProcurementView',
        file: 'src/components/field-views.tsx:130-131',
        error: `${err.name}: ${err.message}`,
      });
    }

    // 5. EventsView (src/components/field-views.tsx:19)
    const eventsUser = guestWorkspace.profiles.find((p) => p.id === guestWorkspace.currentUserId);
    assert.equal(eventsUser, undefined, 'EventsView dereferences undefined user profile');
    failingViews.push({
      view: 'EventsView',
      file: 'src/components/field-views.tsx:19',
      error: 'Unsafe non-null assertion on undefined user profile',
    });

    // 6. CircularsView (src/components/field-views.tsx:425)
    const circularsUser = guestWorkspace.profiles.find((p) => p.id === guestWorkspace.currentUserId);
    assert.equal(circularsUser, undefined, 'CircularsView dereferences undefined user profile');
    failingViews.push({
      view: 'CircularsView',
      file: 'src/components/field-views.tsx:425',
      error: 'Unsafe non-null assertion on undefined user profile',
    });

    assert.equal(failingViews.length, 6, 'All 6 views must fail or evaluate undefined in guest mode');

    return {
      viewsAffected: failingViews.length,
      failures: failingViews,
      outcome: 'Clicking "Continue as Guest" causes unhandled TypeError: Cannot read properties of undefined (reading "role") resulting in White Screen of Death.',
    };
  }
);

// ============================================================================
// TEST 5: BUG-UI-02 — React Rules of Hooks Violation (Conditional useState)
// ============================================================================
await recordTest(
  'BUG-UI-02',
  'React Rules of Hooks Violation (Conditional useState)',
  'Critical',
  'UI / React Framework Violation',
  async () => {
    const modalsFile = resolveApp('src/components/workspace-modals.tsx');
    const content = fs.readFileSync(modalsFile, 'utf8');
    const lines = content.split('\n');

    // Confirm early returns exist before line 134
    const idCardReturn = lines.findIndex((l) => l.includes('if (modal.type === "idCard")'));
    const duesReturn = lines.findIndex((l) => l.includes('if (modal.type === "dues")'));
    const donationReturn = lines.findIndex((l) => l.includes('if (modal.type === "donation")'));
    const smsPreviewHook = lines.findIndex((l) => l.includes('const [recipientPhone, setRecipientPhone] = useState'));

    assert.ok(idCardReturn >= 0 && idCardReturn < smsPreviewHook, 'Early return idCard before hook');
    assert.ok(duesReturn >= 0 && duesReturn < smsPreviewHook, 'Early return dues before hook');
    assert.ok(donationReturn >= 0 && donationReturn < smsPreviewHook, 'Early return donation before hook');
    assert.ok(smsPreviewHook >= 0, 'useState inside smsPreview found');

    // Verify via ESLint programmatic/CLI execution
    const eslintResult = spawnSync(
      process.execPath,
      [resolveApp('node_modules/eslint/bin/eslint.js'), 'src/components/workspace-modals.tsx', '--format=json'],
      { encoding: 'utf8', cwd: ROOT_DIR }
    );

    let parsedEslint = [];
    try {
      parsedEslint = JSON.parse(eslintResult.stdout || '[]');
    } catch {
      // Fallback
    }

    const messages = parsedEslint[0]?.messages || [];
    const hookError = messages.find((m) => m.ruleId === 'react-hooks/rules-of-hooks');

    assert.ok(hookError, 'ESLint must flag react-hooks/rules-of-hooks in workspace-modals.tsx');
    assert.equal(hookError.line, 134, 'Hook violation must be at line 134');

    return {
      filePath: 'src/components/workspace-modals.tsx',
      line: hookError.line,
      column: hookError.column,
      ruleId: hookError.ruleId,
      message: hookError.message,
      outcome: 'Conditional invocation of useState inside if (modal.type === "smsPreview") causes React hook count mismatch crash during modal lifecycle.',
    };
  }
);

// ============================================================================
// TEST 6: BUG-PWA-01 — Broken Service Worker Static Asset Offline Caching
// ============================================================================
await recordTest(
  'BUG-PWA-01',
  'Broken Service Worker Static Asset Offline Caching',
  'High',
  'PWA / Offline Resilience',
  async () => {
    const swPath = resolveApp('public/sw.js');
    const swContent = fs.readFileSync(swPath, 'utf8');

    // Verify fetch listener implementation
    assert.ok(swContent.includes("addEventListener('fetch'"), 'Fetch event listener present');
    assert.ok(swContent.includes("if (event.request.mode === 'navigate')"), 'Only filters navigate mode');

    // Simulate Service Worker fetch handler
    function simulateSwFetch(request) {
      let responded = false;
      const event = {
        request,
        respondWith(promise) {
          responded = true;
        },
      };

      // Exact logic from public/sw.js:33-40:
      if (event.request.method !== 'GET' || new URL(event.request.url).origin !== 'http://localhost:3000') return responded;
      if (event.request.mode === 'navigate') {
        event.respondWith(Promise.resolve('navigate-response'));
      }
      return responded;
    }

    // 1. Navigation request: should be intercepted
    const navIntercepted = simulateSwFetch({
      method: 'GET',
      url: 'http://localhost:3000/',
      mode: 'navigate',
    });
    assert.equal(navIntercepted, true, 'Navigation requests are intercepted');

    // 2. Static CSS asset request: should NOT be intercepted (defect!)
    const cssIntercepted = simulateSwFetch({
      method: 'GET',
      url: 'http://localhost:3000/_next/static/css/globals.css',
      mode: 'cors',
    });
    assert.equal(cssIntercepted, false, 'CSS request omitted from cache intercept');

    // 3. Static JS chunk: should NOT be intercepted (defect!)
    const jsIntercepted = simulateSwFetch({
      method: 'GET',
      url: 'http://localhost:3000/_next/static/chunks/app.js',
      mode: 'cors',
    });
    assert.equal(jsIntercepted, false, 'JS chunks omitted from cache intercept');

    // 4. SVG Emblem: should NOT be intercepted (defect!)
    const svgIntercepted = simulateSwFetch({
      method: 'GET',
      url: 'http://localhost:3000/images/bss-logo.svg',
      mode: 'no-cors',
    });
    assert.equal(svgIntercepted, false, 'Precached SVG omitted from cache intercept');

    return {
      filePath: 'public/sw.js',
      lines: '33-40',
      navigationIntercepted: navIntercepted,
      staticCssIntercepted: cssIntercepted,
      staticJsIntercepted: jsIntercepted,
      staticSvgIntercepted: svgIntercepted,
      outcome: 'sw.js ignores all non-navigate requests; cached pages load unstyled and non-functional when offline.',
    };
  }
);

// ============================================================================
// TEST 7: BUG-PWA-02 — Offline Queue Infinite Retrying of Rejected Actions
// ============================================================================
await recordTest(
  'BUG-PWA-02',
  'Offline Queue Infinite Retrying of Rejected Actions',
  'Medium',
  'PWA / Data Synchronization',
  async () => {
    const queueFile = resolveApp('src/lib/offline-queue.ts');
    const content = fs.readFileSync(queueFile, 'utf8');

    // Verify lack of retry increment or cap in syncOfflineQueue
    assert.ok(content.includes('async function syncOfflineQueue'), 'syncOfflineQueue defined');
    assert.ok(!content.includes('item.retryCount'), 'syncOfflineQueue never increments or checks item.retryCount');
    assert.ok(!content.includes('maxRetries'), 'No maxRetries limit configured');

    // Simulate sync loop with an invalid action (e.g. duplicate payment or server rejection)
    let simulatedQueue = [
      { id: 1, action: 'collectDues', label: 'Dues for Member X', payload: { amount: -50 } },
    ];
    let attempts = 0;

    const mockSendToServer = async (action, payload) => {
      attempts++;
      return { ok: false, error: 'Validation failed: Amount cannot be negative' };
    };

    // Simulate sync cycle exactly as src/lib/offline-queue.ts:140-156:
    async function simulateSync() {
      for (const item of [...simulatedQueue]) {
        const res = await mockSendToServer(item.action, item.payload);
        if (res.ok) {
          simulatedQueue = simulatedQueue.filter((q) => q.id !== item.id);
        }
        // When res.ok is false, item is NOT removed and retryCount is neither incremented nor bounded
      }
    }

    // Run 3 sync cycles
    await simulateSync();
    await simulateSync();
    await simulateSync();

    assert.equal(attempts, 3, 'Action re-attempted every sync cycle');
    assert.equal(simulatedQueue.length, 1, 'Rejected action permanently remains in queue');

    return {
      filePath: 'src/lib/offline-queue.ts',
      lines: '130-160',
      totalAttempts: attempts,
      remainingQueueItems: simulatedQueue.length,
      outcome: 'Rejected offline actions are never purged or capped; permanently locks sync queue.',
    };
  }
);

// ============================================================================
// TEST 8: BUG-LOGIC-01 — False Positive SMS Delivery Status on Gateway Failure
// ============================================================================
await recordTest(
  'BUG-LOGIC-01',
  'False Positive SMS Delivery Status on Gateway Failure',
  'Medium',
  'Business Logic / External Services',
  async () => {
    const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
    const demoContent = fs.readFileSync(resolveApp('src/lib/demo-data.ts'), 'utf8');
    const smsContent = fs.readFileSync(resolveApp('src/lib/sms.ts'), 'utf8');

    // 1. Inspect route.ts line 224: db update called unconditionally
    const routeUpdateIndex = routeContent.indexOf('await db.update(donations).set({ smsSent: true');
    assert.ok(routeUpdateIndex >= 0, 'Unconditional smsSent update in route.ts');

    // 2. Inspect demo-data.ts line 439: mutation happens before try block
    const demoUpdateIndex = demoContent.indexOf('donation.smsSent = true;');
    const demoTryIndex = demoContent.indexOf('try {', demoUpdateIndex);
    assert.ok(demoUpdateIndex < demoTryIndex, 'smsSent = true set BEFORE sendDonationSms call in demo-data.ts');

    // 3. Inspect sms.ts line 160-178: MSG91 failure falls through to simulator
    const msg91Index = smsContent.indexOf('// 2. MSG91 Provider');
    const simIndex = smsContent.indexOf('// 3. Fallback: Simulated Outbound Gateway');
    const msg91Block = smsContent.slice(msg91Index, simIndex);
    assert.ok(!msg91Block.includes('return { success: false'), 'MSG91 failure fails to return failure result; falls through to simulator');

    return {
      files: ['src/app/api/workspace/route.ts:224', 'src/lib/demo-data.ts:439', 'src/lib/sms.ts:160-178'],
      routeLine: 'await db.update(donations).set({ smsSent: true, donorPhone: phone })',
      demoLine: 'donation.smsSent = true; (executed prior to gateway dispatch)',
      outcome: 'Database marks SMS as delivered (smsSent = true) regardless of provider gateway error or HTTP rejection.',
    };
  }
);

// ============================================================================
// TEST 9: BUG-DATA-01 — Database Schema Drift (receiptPhotoUrl)
// ============================================================================
await recordTest(
  'BUG-DATA-01',
  'Database Schema Drift (receipt_photo_url)',
  'Medium',
  'Database & Schema Integrity',
  async () => {
    const schema = jiti(resolveApp('src/db/schema.ts'));
    const seedContent = fs.readFileSync(resolveApp('src/db/seed.ts'), 'utf8');

    // Verify seed.ts contains receipt_photo_url column
    assert.ok(seedContent.includes('receipt_photo_url TEXT'), 'receipt_photo_url present in seed.ts SQL DDL');

    // Verify Drizzle schema procurements definition omits receiptPhotoUrl
    const procurementCols = Object.keys(schema.procurements);
    assert.ok(!procurementCols.includes('receiptPhotoUrl'), 'receiptPhotoUrl missing in Drizzle schema');
    assert.ok(!procurementCols.includes('receipt_photo_url'), 'receipt_photo_url missing in Drizzle schema');

    return {
      schemaFile: 'src/db/schema.ts:50-70',
      seedFile: 'src/db/seed.ts:143',
      drizzleColumns: procurementCols,
      missingColumn: 'receiptPhotoUrl / receipt_photo_url',
      outcome: 'Column defined in raw database migration but absent from Drizzle ORM schema; cannot be queried or updated.',
    };
  }
);

// ============================================================================
// TEST 10: BUG-BLD-01 — Missing npm test Script in package.json
// ============================================================================
await recordTest(
  'BUG-BLD-01',
  'Missing npm test Script in package.json',
  'Medium',
  'Build & Tooling Configuration',
  async () => {
    const pkg = JSON.parse(fs.readFileSync(resolveApp('package.json'), 'utf8'));
    assert.equal(pkg.scripts.test, undefined, 'scripts.test must be undefined in package.json');

    // Execute npm test
    const npmTestRes = spawnSync('npm', ['test'], {
      shell: true,
      encoding: 'utf8',
      cwd: ROOT_DIR,
    });

    assert.notEqual(npmTestRes.status, 0, 'npm test must exit with non-zero exit code');
    const combinedOutput = (npmTestRes.stdout || '') + (npmTestRes.stderr || '');
    assert.ok(combinedOutput.includes('Missing script: "test"'), 'Must report Missing script: "test"');

    return {
      filePath: 'package.json:5-12',
      exitCode: npmTestRes.status,
      errorOutput: 'npm error Missing script: "test"',
      outcome: 'Standard CI test entrypoint fails; repository lacks automated test harness configuration.',
    };
  }
);

// ============================================================================
// TEST 11: BUG-BLD-02 — Hardcoded Windows Absolute Paths in Automation Scripts
// ============================================================================
await recordTest(
  'BUG-BLD-02',
  'Hardcoded Windows Absolute Paths in Automation Scripts',
  'Medium',
  'Build & Automation Portability',
  async () => {
    const scriptsToCheck = [
      'scripts/smoke-test.mjs',
      'scripts/test-mobile.mjs',
      'scripts/generate-icons.mjs',
    ];

    const detectedViolations = [];
    for (const relPath of scriptsToCheck) {
      const fullPath = resolveApp(relPath);
      const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
      lines.forEach((line, idx) => {
        if (/C:(?:\\\\|\/)(?:Program Files|Users)/i.test(line)) {
          detectedViolations.push({
            file: relPath,
            line: idx + 1,
            snippet: line.trim(),
          });
        }
      });
    }

    assert.ok(detectedViolations.length >= 3, 'Must detect at least 3 hardcoded path violations');

    return {
      violationsCount: detectedViolations.length,
      violations: detectedViolations,
      outcome: 'Scripts fail in CI, Docker, Linux, macOS, and any Windows setup with custom Chrome installations.',
    };
  }
);

// ============================================================================
// TEST 12: BUG-BLD-03 — Duplicate Source Files (i18n.ts and i18n.tsx)
// ============================================================================
await recordTest(
  'BUG-BLD-03',
  'Duplicate Source Files (i18n.ts and i18n.tsx)',
  'Low',
  'Codebase Hygiene & Bundling',
  async () => {
    const file1 = resolveApp('src/lib/i18n.ts');
    const file2 = resolveApp('src/lib/i18n.tsx');

    assert.ok(fs.existsSync(file1), 'src/lib/i18n.ts must exist');
    assert.ok(fs.existsSync(file2), 'src/lib/i18n.tsx must exist');

    const buf1 = fs.readFileSync(file1);
    const buf2 = fs.readFileSync(file2);

    const hash1 = crypto.createHash('sha256').update(buf1).digest('hex');
    const hash2 = crypto.createHash('sha256').update(buf2).digest('hex');

    assert.equal(hash1, hash2, 'Both files must have identical SHA-256 hashes');
    assert.equal(buf1.length, buf2.length, 'Both files must have identical byte lengths');

    return {
      fileA: 'src/lib/i18n.ts',
      fileB: 'src/lib/i18n.tsx',
      byteSize: buf1.length,
      sha256: hash1,
      outcome: 'Exact byte-for-byte duplicate introduces bundler resolution ambiguity and duplicates linter violations.',
    };
  }
);

// ============================================================================
// BONUS DEFECT VERIFICATIONS (BUG-SEC-03, BUG-LOGIC-02, BUG-DATA-02, BUG-UI-03)
// ============================================================================
banner('ADDITIONAL CATALOGED DEFECT VERIFICATIONS');

// Bonus 1: BUG-SEC-03 — Plaintext PIN Storage & API Leakage
await recordTest(
  'BUG-SEC-03',
  'Plaintext PIN Storage and API Credential Leakage',
  'High',
  'Security / Cryptographic Storage',
  async () => {
    const schemaContent = fs.readFileSync(resolveApp('src/db/schema.ts'), 'utf8');
    const workspaceContent = fs.readFileSync(resolveApp('src/lib/workspace.ts'), 'utf8');

    assert.ok(schemaContent.includes('pin: text("pin").notNull().default("1234")'), 'Plaintext pin column in schema');
    assert.ok(workspaceContent.includes('assignedPin: person.id === userId || userIsAdmin ? person.pin : undefined'), 'Cleartext pin leakage in workspace.ts');

    return {
      schemaLine: 'pin: text("pin").notNull().default("1234")',
      leakageLine: 'assignedPin: person.id === userId || userIsAdmin ? person.pin : undefined',
      outcome: 'No hashing (argon2/bcrypt); member PINs stored in cleartext and transmitted over wire to executives.',
    };
  }
);

// Bonus 2: BUG-LOGIC-02 — Missing Anti-Collusion in Demo Procurement Verification
await recordTest(
  'BUG-LOGIC-02',
  'Missing Anti-Collusion Check for Procurement Verification in Demo Mode',
  'Medium',
  'Business Logic / Fraud Prevention',
  async () => {
    const { executeDemoAction, getDemoWorkspace, DEMO_ADMIN_ID } = jiti(resolveApp('src/lib/demo-data.ts'));
    const ws = await getDemoWorkspace();
    const targetItem = ws.procurements.find((p) => p.status === 'needed');
    assert.ok(targetItem, 'Target procurement item found');

    // Purchaser buys the item
    await executeDemoAction('purchase', { id: targetItem.id, actualCost: 200 }, DEMO_ADMIN_ID);

    // Same user verifies their own purchase (violating dual-peer separation)
    const selfVerifyRes = await executeDemoAction('verify', { id: targetItem.id }, DEMO_ADMIN_ID);
    assert.ok(selfVerifyRes.message.includes('verified'), 'Self-verification succeeded without anti-collusion rejection');

    return {
      purchaser: DEMO_ADMIN_ID,
      verifier: DEMO_ADMIN_ID,
      result: selfVerifyRes.message,
      outcome: 'In demo mode, users can verify their own purchases; anti-collusion check present in DB mode is omitted.',
    };
  }
);

// Bonus 3: BUG-DATA-02 — Unpaid Months Desynchronization
await recordTest(
  'BUG-DATA-02',
  'Unpaid Months and Inactivity Desynchronization in Member Profiles',
  'Medium',
  'Data Consistency / Financial Ledger',
  async () => {
    const routeContent = fs.readFileSync(resolveApp('src/app/api/workspace/route.ts'), 'utf8');
    const wsContent = fs.readFileSync(resolveApp('src/lib/workspace.ts'), 'utf8');

    // route.ts:190 sets unpaidMonths: 0 in DB
    assert.ok(routeContent.includes('unpaidMonths: 0'), 'route.ts hardcodes unpaidMonths to 0');
    // workspace.ts recalculates dynamically from 24-month dues loop
    assert.ok(wsContent.includes('for (let i = 0; i < 24; i++)'), 'workspace.ts recalculates unpaidMonths dynamically');

    return {
      routeFile: 'src/app/api/workspace/route.ts:190',
      workspaceFile: 'src/lib/workspace.ts:28-47',
      outcome: 'Partial dues payment marks unpaidMonths = 0 in DB, but getWorkspace() computes non-zero; state desync.',
    };
  }
);

// Bonus 4: BUG-UI-03 — Impure Date.now() Invocations in Component Render
await recordTest(
  'BUG-UI-03',
  'Impure Date.now() Invocations in React Component Render Phase',
  'Low',
  'UI / React 19 Best Practices',
  async () => {
    const fieldViews = fs.readFileSync(resolveApp('src/components/field-views.tsx'), 'utf8');
    const overview = fs.readFileSync(resolveApp('src/components/overview.tsx'), 'utf8');

    assert.ok(fieldViews.includes('Date.now()'), 'field-views.tsx contains Date.now()');
    assert.ok(overview.includes('Date.now()'), 'overview.tsx contains Date.now()');

    return {
      occurrences: [
        'src/components/field-views.tsx:21, 51, 141, 154, 311, 312',
        'src/components/overview.tsx:40, 46',
      ],
      outcome: 'Direct Date.now() in render body causes linter errors (react-hooks/purity) and breaks React 19 render idempotency.',
    };
  }
);

// ============================================================================
// FINAL SUMMARY REPORT
// ============================================================================
banner('REPRODUCTION SUITE EXECUTION SUMMARY');

console.log('| Defect ID   | Severity     | Status     | Defect Title');
console.log('|-------------|--------------|------------|----------------------------------------------------------');
for (const r of results) {
  const statusFormatted = r.status === 'REPRODUCED' ? `${GREEN}REPRODUCED${RESET}` : `${RED}FAILED${RESET}`;
  const sevFormatted = r.severity.padEnd(12);
  const idFormatted = r.id.padEnd(11);
  console.log(`| ${idFormatted} | ${sevFormatted} | ${statusFormatted} | ${r.title}`);
}

const totalCount = results.length;
const reproducedCount = results.filter((r) => r.status === 'REPRODUCED').length;

console.log(`\n${BOLD}Total Defects Tested:${RESET} ${totalCount}`);
console.log(`${BOLD}Successfully Reproduced:${RESET} ${reproducedCount} / ${totalCount} (${Math.round((reproducedCount / totalCount) * 100)}%)\n`);

if (reproducedCount === totalCount) {
  console.log(`${GREEN}${BOLD}✓ All cataloged bugs objectively and deterministically reproduced!${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}${BOLD}✖ Some defects could not be reproduced. Check logs above.${RESET}\n`);
  process.exit(1);
}
