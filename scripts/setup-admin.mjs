#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const CROCKFORD_CHARS = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const ADMIN_ID = "10000000-0000-4000-8000-000000000001";

function generateClaimCode() {
  const bytes = randomBytes(8);
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += CROCKFORD_CHARS[bytes[i] % CROCKFORD_CHARS.length];
  }
  const formatted = `${result.slice(0, 4)}-${result.slice(4, 8)}`;
  const hash = createHash("sha256").update(result).digest("hex");
  return { code: formatted, hash };
}

async function main() {
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("  BREAKTHROUGH SCIENCE SOCIETY — EXECUTIVE SETUP BOOTSTRAP  ");
  console.log("════════════════════════════════════════════════════════════\n");

  const { code, hash } = generateClaimCode();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const connStr = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connStr) {
    console.log("ℹ️  Running in Preview / Demo Mode (no PostgreSQL connection string in .env.local).");
    console.log("   Bootstrap invite code generated for local demonstration:");
    console.log("\n   ╔═══════════════════════════════════════╗");
    console.log(`   ║  EXECUTIVE SETUP CODE:  ${code}  ║`);
    console.log("   ╚═══════════════════════════════════════╝\n");
    console.log("   How to use:");
    console.log("   1. Open the app in your browser.");
    console.log("   2. Click 'Member Login' and sign in with your Google account.");
    console.log(`   3. When prompted, enter the 8-character code: ${code}`);
    console.log("   4. Your Google account will be permanently linked to Executive Arunabha Ghosh.\n");
    process.exit(0);
  }

  const client = new pg.Client({ connectionString: connStr });
  try {
    await client.connect();
    // Ensure admin profile exists
    await client.query(`
      INSERT INTO profiles (id, full_name, phone, role, status, monthly_pledge, avatar_color, unpaid_months)
      VALUES ($1, 'Arunabha Ghosh', '9434000001', 'admin', 'active', 100, 'peach', 0)
      ON CONFLICT (id) DO UPDATE SET role = 'admin', status = 'active';
    `, [ADMIN_ID]);

    // Insert claim code
    await client.query(`
      INSERT INTO claim_codes (code_hash, member_id, issued_by, expires_at)
      VALUES ($1, $2, $2, $3);
    `, [hash, ADMIN_ID, expiresAt]);

    console.log("✅ Successfully generated single-use executive bootstrap invite in database!");
    console.log("\n   ╔═══════════════════════════════════════╗");
    console.log(`   ║  EXECUTIVE SETUP CODE:  ${code}  ║`);
    console.log("   ╚═══════════════════════════════════════╝\n");
    console.log("   Convey this code directly to Secretary Arunabha Ghosh.");
    console.log("   Expires in 14 days. Stored hashed with SHA-256 (cannot be read from DB).\n");
  } catch (err) {
    console.error("❌ Database bootstrap error:", err.message);
  } finally {
    await client.end();
  }
}

main();
