/**
 * Subtle tactile micro-haptics for mobile touch interactions.
 * Safe for all platforms: gracefully falls back to no-op on iOS and desktop browsers.
 */

export function hapticTap(duration = 10) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // ignore
    }
  }
}

export function hapticSuccess() {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([12, 30, 18]);
    } catch {
      // ignore
    }
  }
}

export function hapticWarning() {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([35, 45, 35]);
    } catch {
      // ignore
    }
  }
}
