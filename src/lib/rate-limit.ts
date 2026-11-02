interface AttemptRecord {
  count: number;
  lockedUntil: number;
  lastAttempt: number;
}

const failedAttempts = new Map<string, AttemptRecord>();

// Clean up stale memory records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of failedAttempts.entries()) {
    if (now - record.lastAttempt > 15 * 60 * 1000 && now > record.lockedUntil) {
      failedAttempts.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
  message?: string;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if the caller IP or member ID is currently locked out from login.
 */
export function checkLoginRateLimit(key: string): RateLimitCheckResult {
  const now = Date.now();
  const record = failedAttempts.get(key);

  if (record && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
      message: `Too many failed PIN attempts. Account locked. Please try again in ${retryAfterSeconds} seconds or use Google recovery.`,
    };
  }

  const currentCount = record ? record.count : 0;
  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - currentCount),
    retryAfterSeconds: 0,
  };
}

/**
 * Record a failed login attempt. If attempts exceed MAX_FAILED_ATTEMPTS, lock out for 5 minutes.
 */
export function recordFailedLogin(key: string): RateLimitCheckResult {
  const now = Date.now();
  const record = failedAttempts.get(key) || { count: 0, lockedUntil: 0, lastAttempt: now };

  record.count += 1;
  record.lastAttempt = now;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    failedAttempts.set(key, record);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      message: "Too many failed PIN attempts. Account locked for 5 minutes. Please use Google recovery or contact Secretary Arunabha Ghosh.",
    };
  }

  failedAttempts.set(key, record);
  return {
    allowed: true,
    remainingAttempts: MAX_FAILED_ATTEMPTS - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset failed attempts upon successful authentication.
 */
export function resetLoginRateLimit(key: string) {
  failedAttempts.delete(key);
}
