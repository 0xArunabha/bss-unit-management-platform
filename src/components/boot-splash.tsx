"use client";

import { useEffect, useRef, useState } from "react";
import { ARROW_PATH, CUP_RADIUS, RING_INNER, RING_OUTER, WHEEL_CENTER } from "./boot-splash-art";
import { BOOT_JS, ENGINE_SRC } from "./boot-splash-engine";

/*
 * Loading screen: the BSS emblem forms as a cup of tea being brewed (Jalpaiguri is tea country).
 *
 *   a drop of tea falls into the cup -> the tea fills it and ripples
 *   -> the frame is drawn -> the two rings swirl in like leaves stirred in the cup
 *   -> the arrow rises out of the wheel like steam -> steam keeps curling up until the app is ready
 *
 * How it stays smooth and complete:
 *   - The emblem is drawn on a canvas by a Web Worker (boot-splash-engine.ts), so it keeps moving while the main
 *     thread is busy loading and hydrating the app.  The text and falling leaves are plain CSS transform/opacity
 *     animations, which the browser runs off the main thread too.
 *   - The splash is plain markup in the server's first chunk (app/page.tsx streams it before the data is ready),
 *     so it is on screen as soon as the HTML starts arriving instead of after the server has finished its work.
 *   - The markup is set with dangerouslySetInnerHTML, so React never reconciles (or restarts) the artwork.
 *   - It leaves when BOTH the animation has had its time (SPLASH_MIN_MS counted from when it arrived) AND the app has
 *     mounted (<SplashReady /> in app/page.tsx).  A tap or key press skips the waiting part.
 *   - The still emblem inside it is the fallback: reduced motion, no worker/canvas support, or markup rebuilt by
 *     React all show it instead of an animation.
 *
 * The inline script in layout.tsx marks <html data-splash="skip"> before paint for visits that should not see it
 * (reloads in the same tab session, other pages).  Add ?splash=1 to the address to replay it.
 */

/** The splash stays at least this long (ms, counted from when it arrives) so the emblem always finishes forming. */
const SPLASH_MIN_MS = 2600;
/** Reduced-motion visitors get a still emblem, so there is nothing to wait for. */
const SPLASH_MIN_STILL_MS = 300;
/** Never keep the splash longer than this, even if the app never reports ready. */
const SPLASH_MAX_MS = 10000;
/** Fade-out time, keep in step with the transition on ".boot-splash" in globals.css. */
const SPLASH_LEAVE_MS = 520;

declare global {
  interface Window {
    __bssSplash?: { stop: () => void };
  }
}

const { x: CX, y: CY } = WHEEL_CENTER;

/* The square frame as two strokes that start at the bottom centre and end at the gap the arrow passes through. */
const FRAME_LEFT = "M1010 1966.3H166.1V252.7H668";
const FRAME_RIGHT = "M1008 1966.3H1851.9V252.7H1049.7";
const SHEEN = "M857 1076A227 227 0 0 1 972 973M1025 958A227 227 0 0 1 1065 956";

const LEAVES = [
  { x: "9vw", s: 1.15, dur: 12, delay: -3, sway: "6vw", r0: "-28deg" },
  { x: "27vw", s: 0.8, dur: 9.5, delay: -7, sway: "-5vw", r0: "40deg" },
  { x: "52vw", s: 1, dur: 13, delay: -1.5, sway: "7vw", r0: "10deg" },
  { x: "73vw", s: 0.9, dur: 10.5, delay: -5.5, sway: "-6vw", r0: "-55deg" },
  { x: "90vw", s: 1.2, dur: 11.5, delay: -9, sway: "-4vw", r0: "25deg" },
];

const ROWS = [0, 1, 2, 3, 4, 5].map((i) => {
  const y = 16 + i * 19;
  return `M0 ${y}C70 ${y - 15} 140 ${y + 9} 210 ${y - 3}S340 ${y - 17} 400 ${y - 2}`;
});

const ringPaths = (list: readonly { d: string; f: number }[], ring: number) =>
  list.map((s) => `<path class="bs" data-r="${ring}" data-f="${s.f}" d="${s.d}"/>`).join("");

/*
 * The finished emblem as a still SVG (also what the animation reads its shapes from), the canvas the animation is
 * drawn on, the name and status line, and the two scripts.  Precomputed once; the server and the browser print the
 * same string.
 */
const SPLASH_HTML = `
<div class="boot-glow"></div>
<div class="boot-leaves">${LEAVES.map(
  (l) =>
    `<svg class="boot-leaf" viewBox="-4 -16 60 32" focusable="false" style="--x:${l.x};--s:${l.s};--dur:${l.dur}s;--delay:${l.delay}s;--sway:${l.sway};--r0:${l.r0}"><path d="M0 0C10-14 36-14 52 0C36 14 10 14 0 0Z"/><path class="boot-leaf-vein" d="M4 0H46"/></svg>`,
).join("")}</div>
<svg class="boot-terraces" viewBox="0 0 400 130" preserveAspectRatio="none" focusable="false">${ROWS.map(
  (d, i) => `<path d="${d}" style="--i:${i}"/>`,
).join("")}</svg>
<div class="boot-stage">
  <div class="boot-logo">
    <svg class="boot-static" viewBox="0 0 2000 2000" focusable="false">
      <defs><radialGradient id="boot-tea-fill" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="#e5a84f"/><stop offset="0.55" stop-color="#c47c2b"/><stop offset="1" stop-color="#8c4c16"/></radialGradient></defs>
      <circle cx="${CX}" cy="${CY}" r="${CUP_RADIUS - 44}" fill="url(#boot-tea-fill)" stroke="#7b4112" stroke-width="9"/>
      <path d="${SHEEN}" fill="none" stroke="#fff" stroke-opacity="0.34" stroke-width="14" stroke-linecap="round"/>
      <g fill="none" stroke="#1b4332" stroke-width="35"><path class="bf" d="${FRAME_LEFT}"/><path class="bf" d="${FRAME_RIGHT}"/></g>
      <g fill="#1b4332" fill-rule="evenodd">${ringPaths(RING_INNER, 0)}${ringPaths(RING_OUTER, 1)}<path class="ba" d="${ARROW_PATH}"/></g>
    </svg>
    <canvas class="boot-canvas" width="2" height="2"></canvas>
  </div>
  <div class="boot-text">
    <p class="boot-brand"><span class="lang-en">Light of Science</span><span class="lang-bn">বিজ্ঞানের আলো</span><b>.</b></p>
    <p class="boot-status"><span class="lang-en">Brewing your workspace</span><span class="lang-bn">ওয়ার্কস্পেস তৈরি হচ্ছে</span><span class="boot-dots"><i></i><i></i><i></i></span></p>
  </div>
</div>
<script type="text/plain" id="bss-engine">${ENGINE_SRC}</script>
<script>${BOOT_JS}</script>
`;

export default function BootSplash() {
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const html = document.documentElement;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, Math.max(0, ms)));
    };

    if (!root || html.dataset.splash === "skip") {
      later(() => setPhase("gone"), 0);
      return () => timers.forEach((id) => window.clearTimeout(id));
    }

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The animation's script did not run (the markup was rebuilt, or it was not in the server HTML): show the still emblem.
    if (root.dataset.live !== "1") root.dataset.canvas = "off";

    // How long the splash has already been playing: counted from when it arrived (the inline script stamps data-t0),
    // which is the clock the animation runs on.  A paint-timing entry is no good here: the first contentful paint is
    // often the app's own text behind the splash, which can come much later.  If the markup was rebuilt (no stamp),
    // its animations restart now, so count from now.
    const stamp = Number(root.dataset.t0);
    const shown = Math.max(0, performance.now() - (stamp > 0 ? stamp : performance.now()));
    let minDone = false;
    let ready = html.dataset.appReady === "1";
    let leaving = false;

    const leave = () => {
      if (leaving) return;
      leaving = true;
      setPhase("leave");
      later(() => {
        html.dataset.splash = "skip"; // later in-app navigations to "/" must not replay it
        window.__bssSplash?.stop();
        setPhase("gone");
      }, SPLASH_LEAVE_MS);
    };
    const check = () => {
      if (minDone && ready) leave();
    };
    const onReady = () => {
      ready = true;
      check();
    };
    const skipWaiting = () => {
      minDone = true;
      check();
    };

    later(skipWaiting, (still ? SPLASH_MIN_STILL_MS : SPLASH_MIN_MS) - shown);
    later(leave, SPLASH_MAX_MS - shown);
    window.addEventListener("bss-app-ready", onReady);
    window.addEventListener("keydown", skipWaiting);
    root.addEventListener("pointerdown", skipWaiting);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("bss-app-ready", onReady);
      window.removeEventListener("keydown", skipWaiting);
      root.removeEventListener("pointerdown", skipWaiting);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      ref={rootRef}
      className="boot-splash"
      data-phase={phase}
      aria-hidden="true"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: SPLASH_HTML }}
    />
  );
}

/** Rendered next to the workspace in app/page.tsx: tells the splash the app has mounted and can be revealed. */
export function SplashReady() {
  useEffect(() => {
    document.documentElement.dataset.appReady = "1";
    window.dispatchEvent(new Event("bss-app-ready"));
  }, []);
  return null;
}
