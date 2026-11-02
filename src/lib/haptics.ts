/**
 * Tactile micro-haptics for mobile touch interactions.
 * Safe for all platforms: gracefully falls back to no-op on iOS and desktop browsers.
 * Routine navigation taps are silenced to avoid physical buzzing or jarring vibration.
 */

export function hapticTap(_duration = 8) {
  // Silenced by default so normal taps and navigation feel smooth and calm without hardware buzzing
}

export function hapticSuccess() {
  // Silenced
}

export function hapticWarning() {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(20);
    } catch {
      // ignore
    }
  }
}
