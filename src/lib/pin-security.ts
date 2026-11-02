import { createHmac, timingSafeEqual } from "node:crypto";

const PIN_SALT = process.env.PIN_SALT || "bss_jalpaiguri_science_pin_salt_918237";

/**
 * Hash a PIN salted with the member's unique ID and a server secret.
 */
export function hashPin(pin: string, memberId: string): string {
  const normalizedPin = pin.trim();
  return createHmac("sha256", PIN_SALT)
    .update(`${memberId}:${normalizedPin}`)
    .digest("hex");
}

/**
 * Timing-safe PIN verification against stored hash.
 * Also supports legacy plaintext PIN fallback during initial migration if needed,
 * but returns true only on match.
 */
export function verifyPin(attemptPin: string, memberId: string, storedValue: string | null | undefined): boolean {
  if (!storedValue || !attemptPin) return false;

  const attemptHash = hashPin(attemptPin, memberId);

  // If storedValue is already a 64-char sha256 hex string
  if (storedValue.length === 64 && /^[0-9a-f]+$/i.test(storedValue)) {
    try {
      const a = Buffer.from(attemptHash, "hex");
      const b = Buffer.from(storedValue, "hex");
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  // Fallback for initial plaintext seed comparison
  const a = Buffer.from(attemptPin.trim());
  const b = Buffer.from(storedValue.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
