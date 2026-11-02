import { db, isDatabaseConfigured } from "@/db";
import { sessions } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "crypto";

export const SESSION_COOKIE_NAME = "bss_session";

interface MemorySession {
  userId: string;
  expiresAt: number;
  createdAt: number;
}

const memorySessions = new Map<string, MemorySession>();

// Periodically clean up expired in-memory sessions
setInterval(() => {
  const now = Date.now();
  for (const [token, s] of memorySessions.entries()) {
    if (s.expiresAt < now) {
      memorySessions.delete(token);
    }
  }
}, 15 * 60 * 1000).unref();

/**
 * Creates a cryptographically random 64-character server-issued session token
 * and stores it in the database `sessions` table (or in-memory sessions store).
 */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30-day session lifetime

  if (isDatabaseConfigured) {
    await db.insert(sessions).values({
      id: token,
      userId,
      expiresAt,
    });
  } else {
    memorySessions.set(token, {
      userId,
      expiresAt: expiresAt.getTime(),
      createdAt: Date.now(),
    });
  }

  return token;
}

/**
 * Verifies that a session token exists in the sessions table and is unexpired.
 * Returns the authenticated userId, or null if invalid, forged, expired, or missing.
 */
export async function verifySession(token: string | null | undefined): Promise<string | null> {
  if (!token || typeof token !== "string" || token.length !== 64 || !/^[0-9a-f]{64}$/i.test(token)) {
    return null;
  }

  if (isDatabaseConfigured) {
    try {
      const now = new Date();
      const [record] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, token), gt(sessions.expiresAt, now)));

      if (!record) return null;
      return record.userId;
    } catch (err) {
      console.error("[Session] DB session lookup failed:", err);
      return null;
    }
  } else {
    const record = memorySessions.get(token);
    if (!record) return null;
    if (record.expiresAt < Date.now()) {
      memorySessions.delete(token);
      return null;
    }
    return record.userId;
  }
}

/**
 * Destroys / revokes an active session from the database or in-memory store.
 */
export async function destroySession(token: string | null | undefined): Promise<void> {
  if (!token || typeof token !== "string") return;

  if (isDatabaseConfigured) {
    try {
      await db.delete(sessions).where(eq(sessions.id, token));
    } catch (err) {
      console.error("[Session] Error deleting DB session:", err);
    }
  } else {
    memorySessions.delete(token);
  }
}

// Aliases for seamless backward compatibility
export const verifySessionToken = verifySession;
export const createSessionToken = createSession;
