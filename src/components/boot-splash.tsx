"use client";

import { useEffect, useState } from "react";
import { ARROW_PATH, CUP_RADIUS, RING_INNER, RING_OUTER, WHEEL_CENTER } from "./boot-splash-art";

const { x: CX, y: CY } = WHEEL_CENTER;
const FRAME_LEFT = "M668 252.7H166.1V1966.3H1010";
const FRAME_RIGHT = "M1049.7 252.7H1851.9V1966.3H1008";
const SHEEN = "M857 1076A227 227 0 0 1 972 973M1025 958A227 227 0 0 1 1065 956";

const STEAM = [
  { d: "M880 6C820-80 940-130 880-220C830-295 920-350 868-440", w: "0s" },
  { d: "M980-6C920-100 1040-160 980-260C930-340 1020-400 962-500", w: "1.05s" },
  { d: "M1074 24C1028-56 1120-112 1066-196C1026-262 1098-312 1060-392", w: "1.9s" },
];

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

/**
 * Precomputed HTML string of the splash artwork.
 * Using dangerouslySetInnerHTML ensures React hydration does NOT reconcile or touch
 * child SVG nodes, preventing Chrome/WebKit from resetting CSS animations mid-flight.
 */
const SPLASH_HTML = `
  <div class="boot-leaves">
    ${LEAVES.map(l => `
      <svg class="boot-leaf" viewBox="-4 -16 60 32" focusable="false" style="--x:${l.x};--s:${l.s};--dur:${l.dur}s;--delay:${l.delay}s;--sway:${l.sway};--r0:${l.r0}">
        <path d="M0 0C10-14 36-14 52 0C36 14 10 14 0 0Z"></path>
        <path class="boot-leaf-vein" d="M4 0H46"></path>
      </svg>
    `).join("")}
  </div>
  <svg class="boot-terraces" viewBox="0 0 400 130" preserveAspectRatio="none" focusable="false">
    ${ROWS.map((d, i) => `<path d="${d}" pathLength="1" style="--i:${i}"></path>`).join("")}
  </svg>
  <div class="boot-stage">
    <svg class="boot-logo" viewBox="0 0 2000 2000" focusable="false" style="--cx:${CX}px;--cy:${CY}px">
      <defs>
        <radialGradient id="boot-tea-fill" cx="50%" cy="50%" r="55%">
          <stop offset="0" class="boot-tea-stop-a"></stop>
          <stop offset="0.55" class="boot-tea-stop-b"></stop>
          <stop offset="1" class="boot-tea-stop-c"></stop>
        </radialGradient>
      </defs>
      <g class="boot-cup">
        <circle class="boot-tea" cx="${CX}" cy="${CY}" r="${CUP_RADIUS - 44}" fill="url(#boot-tea-fill)"></circle>
        <path class="boot-sheen" d="${SHEEN}"></path>
        <circle class="boot-ripple boot-ripple-a" cx="${CX}" cy="${CY}" r="${CUP_RADIUS - 52}"></circle>
        <circle class="boot-ripple boot-ripple-b" cx="${CX}" cy="${CY}" r="${CUP_RADIUS - 52}"></circle>
      </g>
      <path class="boot-frame" d="${FRAME_LEFT}" pathLength="1"></path>
      <path class="boot-frame" d="${FRAME_RIGHT}" pathLength="1"></path>
      <g fill-rule="evenodd">
        <g class="boot-ring boot-ring-outer">
          ${RING_OUTER.map(s => `<path class="boot-seg" d="${s.d}" style="--f:${s.f}"></path>`).join("")}
        </g>
        <g class="boot-ring boot-ring-inner">
          ${RING_INNER.map(s => `<path class="boot-seg" d="${s.d}" style="--f:${s.f}"></path>`).join("")}
        </g>
        <path class="boot-arrow" d="${ARROW_PATH}"></path>
      </g>
      ${STEAM.map(s => `<path class="boot-steam" d="${s.d}" pathLength="1" style="--w:${s.w}"></path>`).join("")}
      <path class="boot-drop" d="M0-46C22-14 34 6 34 22C34 42 18 56 0 56C-18 56-34 42-34 22C-34 6-22-14 0-46Z"></path>
    </svg>
    <div class="boot-text">
      <p class="boot-brand">
        <span class="lang-en">Light of Science</span>
        <span class="lang-bn">বিজ্ঞানের আলো</span>
        <b>.</b>
      </p>
      <p class="boot-status">
        <span class="lang-en">Brewing your workspace</span>
        <span class="lang-bn">ওয়ার্কস্পেস তৈরি হচ্ছে</span>
        <span class="boot-dots"><i></i><i></i><i></i></span>
      </p>
    </div>
  </div>
`;

export default function BootSplash() {
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");

  useEffect(() => {
    if (document.documentElement.dataset.splash === "skip") {
      setPhase("gone");
      return;
    }

    // Full tea-brew animation sequence finishes at ~2.5s; trigger graceful fade-out
    const t1 = setTimeout(() => setPhase("leave"), 2600);
    const t2 = setTimeout(() => setPhase("gone"), 3150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className="boot-splash"
      data-phase={phase}
      aria-hidden="true"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: SPLASH_HTML }}
    />
  );
}
