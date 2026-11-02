// Crockford Base32 alphabet (omits 0, O, 1, I, L to prevent manual transcription errors)
export const CROCKFORD_CHARS = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Normalizes a user-entered code by trimming, uppercasing, and removing hyphens/whitespace.
 * Client-safe pure string function without any Node.js crypto dependencies.
 */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTVWXYZ]/g, "");
}
