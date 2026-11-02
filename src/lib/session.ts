import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "bss_session_salt_jalpaiguri_2026_scientific_temper_secure";
export const SESSION_COOKIE_NAME = "bss_session";

/**
 * Creates an HMAC-SHA256 signed session token:
 * Format: `<userId>.<timestamp>.<signature>`
 */
export function createSessionToken(userId: string): string {
  const timestamp = Date.now().toString();
  const payload = `${userId}.${timestamp}`;
  const hmac = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

/**
 * Verifies an HMAC-SHA256 session token and extracts the authenticated userId.
 * Returns null if the token is tampered, forged, or expired (>30 days).
 */
export function verifySessionToken(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, timestampStr, signature] = parts;
  if (!userId || !timestampStr || !signature) return null;

  // Basic UUID format validation
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return null;
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return null;

  // Expire after 30 days
  const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) {
    return null;
  }

  const expectedHmac = createHmac("sha256", SESSION_SECRET).update(`${userId}.${timestampStr}`).digest("hex");

  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expectedHmac, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
    return userId;
  } catch {
    return null;
  }
}
