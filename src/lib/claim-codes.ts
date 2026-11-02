import { createHash, randomBytes } from "crypto";
import { db, isDatabaseConfigured } from "@/db";
import { claimCodes, profiles } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { CROCKFORD_CHARS, normalizeCode } from "./claim-format";

export { CROCKFORD_CHARS, normalizeCode };

/**
 * Computes a deterministic SHA-256 hash of a normalized claim code.
 */
export function hashClaimCode(code: string): string {
  const normalized = normalizeCode(code);
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Generates an 8-character Crockford Base32 code formatted as XXXX-XXXX.
 */
export function generateClaimCode(): { code: string; normalized: string; hash: string } {
  const bytes = randomBytes(8);
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += CROCKFORD_CHARS[bytes[i] % CROCKFORD_CHARS.length];
  }
  const formatted = `${result.slice(0, 4)}-${result.slice(4, 8)}`;
  return {
    code: formatted,
    normalized: result,
    hash: hashClaimCode(result),
  };
}

// In-memory rate limiting map for claim attempts (key: IP or user identifier -> { attempts, resetAt })
const claimRateLimits = new Map<string, { attempts: number; resetAt: number }>();

export function checkClaimRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = claimRateLimits.get(identifier);
  if (!record || record.resetAt < now) {
    claimRateLimits.set(identifier, { attempts: 1, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.attempts >= 5) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.attempts++;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetClaimRateLimit(identifier: string): void {
  claimRateLimits.delete(identifier);
}

// In-memory demo claim codes storage for preview mode
interface DemoClaimCode {
  id: string;
  codeHash: string;
  memberId: string;
  issuedBy: string;
  claimedByGoogleSub?: string | null;
  claimedAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
}
export const demoClaimCodesStore = new Map<string, DemoClaimCode>();
