#!/usr/bin/env node
/**
 * Creates the first executive's one-time member code, or resets it if access is lost.
 *
 *   npm run setup:admin              first-time setup
 *   npm run setup:admin -- --reset   unlink the admin's Google account, end its sessions, print a new code
 *
 * How the admin gets in: sign in with Google on the site, then enter this code once. The code only LINKS that
 * Google account to the admin profile. It is random, expires in 14 days, is printed once here and is stored
 * hashed in the database. Nothing about it is kept in the source code.
 */
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const CROCKFORD_CHARS = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const ADMIN_ID = "10000000-0000-4000-8000-000000000001";
const RESET = process.argv.includes("--reset");

// Must match generateClaimCode() and hashClaimCode() in src/lib/claim-codes.ts:
// 8 characters from the alphabet above, stored as the SHA-256 of the code without the hyphen.
function generateClaimCode() {
  const bytes = randomBytes(8);
  let result = "";
  for (let i = 0; i < 8; i++) result += CROCKFORD_CHARS[bytes[i] % CROCKFORD_CHARS.length];
  return { code: `${result.slice(0, 4)}-${result.slice(4, 8)}`, hash: createHash("sha256").update(result).digest("hex") };
}

async function main() {
  console.log("\n  BREAKTHROUGH SCIENCE SOCIETY - EXECUTIVE SETUP\n");

  const connStr = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connStr) {
    console.log("  No DATABASE_URL (or POSTGRES_URL) found in .env.local, so there is no database to set up.");
    console.log("  Without a database the app runs in local demo mode, which has its own development-only sign-in.\n");
    return;
  }

  const client = new pg.Client({ connectionString: connStr });
  await client.connect();
  try {
    const { rows: cols } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'claim_codes'"
    );
    const names = new Set(cols.map((c) => c.column_name));
    if (!names.size) throw new Error("The claim_codes table does not exist yet. Start the app once (it creates its tables), then run this again.");
    if (!names.has("issued_by")) throw new Error("claim_codes still has the old column names (created_by / claimed_by_sub). Apply the ALTER statements from the patch README first.");

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO profiles (id, full_name, phone, role, status, monthly_pledge, avatar_color, unpaid_months)
       VALUES ($1, 'Arunabha Ghosh', '9434000001', 'admin', 'active', 100, 'peach', 0)
       ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active'`,
      [ADMIN_ID]
    );

    const { rows: [admin] } = await client.query("SELECT google_sub, google_email FROM profiles WHERE id = $1", [ADMIN_ID]);
    const linked = Boolean(admin.google_sub || admin.google_email);
    if (linked && !RESET) {
      await client.query("ROLLBACK");
      console.log(`  The admin profile is already linked to a Google account${admin.google_email ? ` (${admin.google_email})` : ""}.`);
      console.log("  If that is you, just sign in with Google. If access is lost, run: npm run setup:admin -- --reset\n");
      return;
    }
    if (linked) {
      await client.query("UPDATE profiles SET google_sub = NULL, google_email = NULL WHERE id = $1", [ADMIN_ID]);
      await client.query("DELETE FROM sessions WHERE user_id = $1", [ADMIN_ID]);
      if (admin.google_sub) await client.query('DELETE FROM "session" WHERE user_id = $1', [admin.google_sub]);
      console.log("  Reset: the admin's Google link and all of its sessions were removed.\n");
    }

    await client.query("DELETE FROM claim_codes WHERE member_id = $1 AND claimed_at IS NULL", [ADMIN_ID]);
    const { code, hash } = generateClaimCode();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await client.query(
      "INSERT INTO claim_codes (code_hash, member_id, issued_by, expires_at) VALUES ($1, $2, $2, $3)",
      [hash, ADMIN_ID, expiresAt]
    );
    await client.query("COMMIT");

    console.log("  Executive setup code (shown once, valid for 14 days):\n");
    console.log(`      ${code}\n`);
    console.log("  1. Open the app and choose Member login, then sign in with the Google account you will use as admin.");
    console.log("  2. Enter the code when asked. That links your Google account to the admin profile.");
    console.log("  3. Turn on Google 2-Step Verification for that account.\n");
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch { /* nothing to roll back */ }
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("  Setup failed:", err.message);
  process.exitCode = 1;
});
