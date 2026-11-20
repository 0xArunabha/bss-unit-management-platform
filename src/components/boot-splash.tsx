"use client";

import { useEffect, useState, useRef, type CSSProperties } from "react";
import { ARROW_PATH, CUP_RADIUS, RING_INNER, RING_OUTER, WHEEL_CENTER } from "./boot-splash-art";

/*
 * Loading screen: the BSS emblem forms as a cup of tea being brewed (Jalpaiguri is tea country).
 *
 *   a drop of tea falls into the cup -> the tea fills it and ripples
 *   -> the frame is drawn -> the two rings swirl in like leaves stirred in the cup
 *   -> the arrow rises out of the wheel like steam -> steam keeps curling up while the app finishes loading
 *
 * ── Why the animation is driven by a JS clock, not pure CSS ──
 *
 * During React hydration the main thread is blocked for hundreds of milliseconds.
 * Pure CSS `animation:` properties keep counting wall-clock time while the compositor
 * is starved of a main-thread commit, so the visible result is:
 *   1. animations freeze mid-frame while hydration runs,
 *   2. they then jump ahead (or the DOM is rebuilt and they restart from 0).
 *
 * Instead we run a tiny rAF clock that only advances time while frames are actually
 * being painted.  When the main thread stalls, `elapsed` stops growing, so the
 * animation picks up exactly where it left off when the thread is free again.
 *
 * The inline script in layout.tsx marks <html data-splash="skip"> before paint for
 * visits that should not see it (reloads in the same tab session, other pages,
 * reduced motion).  Add ?splash=1 to the address to replay it.
 */

/** Total animation runtime before we start the leave transition (ms of *painted* frames). */
const ANIM_DURATION_MS = 2800;
/** Fade-out length. */
const LEAVE_MS = 480;

type Vars = CSSProperties & Record<`--${string}`, string | number>;
const vars = (v: Vars): CSSProperties => v;

const { x: CX, y: CY } = WHEEL_CENTER;

/* The square frame, as two strokes. */
const FRAME_LEFT = "M668 252.7H166.1V1966.3H1010";
const FRAME_RIGHT = "M1049.7 252.7H1851.9V1966.3H1008";

/* Two short highlights near the rim of the tea. */
const SHEEN = "M857 1076A227 227 0 0 1 972 973M1025 958A227 227 0 0 1 1065 956";

/* Steam wisps. */
const STEAM = [
  { d: "M880 6C820-80 940-130 880-220C830-295 920-350 868-440", w: 0 },
  { d: "M980-6C920-100 1040-160 980-260C930-340 1020-400 962-500", w: 1050 },
  { d: "M1074 24C1028-56 1120-112 1066-196C1026-262 1098-312 1060-392", w: 1900 },
];

/* Tea leaves drifting down behind everything. */
const LEAVES = [
  { x: "9vw", s: 1.15, dur: 12, delay: -3, sway: "6vw", r0: "-28deg" },
  { x: "27vw", s: 0.8, dur: 9.5, delay: -7, sway: "-5vw", r0: "40deg" },
  { x: "52vw", s: 1, dur: 13, delay: -1.5, sway: "7vw", r0: "10deg" },
  { x: "73vw", s: 0.9, dur: 10.5, delay: -5.5, sway: "-6vw", r0: "-55deg" },
  { x: "90vw", s: 1.2, dur: 11.5, delay: -9, sway: "-4vw", r0: "25deg" },
];

/* Terraced tea-garden rows. */
const ROWS = [0, 1, 2, 3, 4, 5].map((i) => {
  const y = 16 + i * 19;
  return `M0 ${y}C70 ${y - 15} 140 ${y + 9} 210 ${y - 3}S340 ${y - 17} 400 ${y - 2}`;
});

/* ── Timing helpers: map elapsed ms → a 0-1 progress for each element ── */

function clamp01(t: number) { return t < 0 ? 0 : t > 1 ? 1 : t; }
function easeOut(t: number) { return 1 - (1 - t) * (1 - t); }
function easeCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

/** Returns progress 0→1 for an animation starting at `start` ms lasting `dur` ms. */
function progress(elapsed: number, start: number, dur: number) {
  return clamp01((elapsed - start) / dur);
}

export default function BootSplash() {
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");
  const elRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    // If the layout script already marked skip, disappear immediately
    if (document.documentElement.dataset.splash === "skip") {
      setPhase("gone");
      return;
    }

    const root = elRef.current;
    if (!root) { setPhase("gone"); return; }

    let elapsed = 0;
    let lastTs: number | null = null;
    let leaving = false;

    function tick(ts: number) {
      if (lastTs !== null) {
        // Only advance by actual frame delta — if the thread was blocked,
        // the delta is small (capped at 100ms to avoid jumps after backgrounding)
        elapsed += Math.min(ts - lastTs, 100);
      }
      lastTs = ts;

      // Set the CSS custom property that drives every animation
      root!.style.setProperty("--t", String(elapsed));

      if (!leaving && elapsed >= ANIM_DURATION_MS) {
        leaving = true;
        setPhase("leave");
        // After fade-out, remove
        setTimeout(() => setPhase("gone"), LEAVE_MS);
      }

      if (!leaving || elapsed < ANIM_DURATION_MS + LEAVE_MS) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (phase === "gone") return null;

  /* ── Render: all animation is driven by var(--t) in CSS calc() ── */

  return (
    <div ref={elRef} className="boot-splash" data-phase={phase} aria-hidden="true" style={{ "--t": "0" } as CSSProperties}>
      <div className="boot-leaves">
        {LEAVES.map((leaf, i) => (
          <svg
            key={i}
            className="boot-leaf"
            viewBox="-4 -16 60 32"
            focusable="false"
            style={vars({ "--x": leaf.x, "--s": leaf.s, "--dur": `${leaf.dur}s`, "--delay": `${leaf.delay}s`, "--sway": leaf.sway, "--r0": leaf.r0 })}
          >
            <path d="M0 0C10-14 36-14 52 0C36 14 10 14 0 0Z" />
            <path className="boot-leaf-vein" d="M4 0H46" />
          </svg>
        ))}
      </div>

      <svg className="boot-terraces" viewBox="0 0 400 130" preserveAspectRatio="none" focusable="false">
        {ROWS.map((d, i) => (
          <path key={i} d={d} pathLength={1} style={vars({ "--i": i })} />
        ))}
      </svg>

      <div className="boot-stage">
        <svg
          className="boot-logo"
          viewBox="0 0 2000 2000"
          focusable="false"
          style={vars({ "--cx": `${CX}px`, "--cy": `${CY}px` })}
        >
          <defs>
            <radialGradient id="boot-tea-fill" cx="50%" cy="50%" r="55%">
              <stop offset="0" className="boot-tea-stop-a" />
              <stop offset="0.55" className="boot-tea-stop-b" />
              <stop offset="1" className="boot-tea-stop-c" />
            </radialGradient>
          </defs>

          {/* the cup: tea, ripples */}
          <g className="boot-cup">
            <circle className="boot-tea" cx={CX} cy={CY} r={CUP_RADIUS - 44} fill="url(#boot-tea-fill)" />
            <path className="boot-sheen" d={SHEEN} />
            <circle className="boot-ripple boot-ripple-a" cx={CX} cy={CY} r={CUP_RADIUS - 52} />
            <circle className="boot-ripple boot-ripple-b" cx={CX} cy={CY} r={CUP_RADIUS - 52} />
          </g>

          <path className="boot-frame" d={FRAME_LEFT} pathLength={1} />
          <path className="boot-frame" d={FRAME_RIGHT} pathLength={1} />

          <g fillRule="evenodd">
            <g className="boot-ring boot-ring-outer">
              {RING_OUTER.map((s, i) => (
                <path key={i} className="boot-seg" d={s.d} style={vars({ "--f": s.f })} />
              ))}
            </g>
            <g className="boot-ring boot-ring-inner">
              {RING_INNER.map((s, i) => (
                <path key={i} className="boot-seg" d={s.d} style={vars({ "--f": s.f })} />
              ))}
            </g>
            <path className="boot-arrow" d={ARROW_PATH} />
          </g>

          {STEAM.map((s, i) => (
            <path key={i} className="boot-steam" d={s.d} pathLength={1} style={vars({ "--w": `${s.w}ms` })} />
          ))}

          <path className="boot-drop" d="M0-46C22-14 34 6 34 22C34 42 18 56 0 56C-18 56-34 42-34 22C-34 6-22-14 0-46Z" />
        </svg>

        <div className="boot-text">
          <p className="boot-brand">
            <span className="lang-en">Light of Science</span>
            <span className="lang-bn">বিজ্ঞানের আলো</span>
            <b>.</b>
          </p>
          <p className="boot-status">
            <span className="lang-en">Brewing your workspace</span>
            <span className="lang-bn">ওয়ার্কস্পেস তৈরি হচ্ছে</span>
            <span className="boot-dots">
              <i />
              <i />
              <i />
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
