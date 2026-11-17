"use client";

import React, { useState, useCallback, memo } from "react";

export interface TeaLeafParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  scale: number;
  variant: number;
  driftX1: number;
  driftX2: number;
  driftX3: number;
  driftX4: number;
  rotStart: number;
  rotMid1: number;
  rotMid2: number;
  rotEnd: number;
  duration: number;
  delay: number;
}

const LEAF_GRADIENTS = [
  { id: "tea-leaf-grad-0", start: "#1b4332", end: "#2d6a4f", vein: "#52b788" }, // Tender flush green
  { id: "tea-leaf-grad-1", start: "#2d6a4f", end: "#40916c", vein: "#74c69d" }, // Vibrant upland leaf
  { id: "tea-leaf-grad-2", start: "#1e3f20", end: "#52b788", vein: "#95d5b2" }, // Forest garden flush
  { id: "tea-leaf-grad-3", start: "#1b4332", end: "#386641", vein: "#d4af37" }, // Gold-infused first flush bud
];

/**
 * Botanical Camellia sinensis tea leaf SVG (First Flush tender shoot & leaf).
 */
export const PremiumTeaLeafSVG = memo(function PremiumTeaLeafSVG({
  variant = 0,
  size = 28,
}: {
  variant?: number;
  size?: number;
}) {
  const v = variant % LEAF_GRADIENTS.length;
  const grad = LEAF_GRADIENTS[v];

  return (
    <svg
      width={size}
      height={Math.round(size * 1.58)}
      viewBox="0 0 24 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: "drop-shadow(0 4px 6px rgba(10, 25, 15, 0.28))",
        overflow: "visible",
      }}
    >
      {/* Main leaf blade: gentle asymmetric serrated contour of tender flush */}
      <path
        d="M 12 1 
           C 7 7, 3 15, 3.5 24 
           C 4 30, 8.5 35, 12 37 
           C 15.5 35, 20 30, 20.5 24 
           C 21 15, 17 7, 12 1 Z"
        fill={`url(#tea-leaf-grad-${v})`}
      />

      {/* Soft daylight highlight on left lamina */}
      <path
        d="M 12 3 
           C 8 9, 5 16, 5.5 24 
           C 6 27, 9 32, 11 34 
           C 9.5 28, 8.5 18, 12 3 Z"
        fill={`url(#tea-leaf-glint-${v})`}
      />

      {/* Primary midrib vein */}
      <path
        d="M 12 2 Q 12 18 12 36"
        stroke={grad.vein}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Secondary lateral veins (pinnate venation) */}
      <path
        d="M 12 8 Q 8 6 6 9
           M 12 14 Q 7 13 5 17
           M 12 21 Q 7 22 5 26
           M 12 28 Q 8 29 7 32
           M 12 10 Q 16 8 18 11
           M 12 16 Q 17 15 19 19
           M 12 23 Q 17 24 19 28
           M 12 29 Q 16 30 17 33"
        stroke={grad.vein}
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Delicate leaf apex tip droplet */}
      <circle cx="12" cy="1.2" r="0.65" fill={grad.vein} opacity="0.9" />
    </svg>
  );
});

/**
 * Container rendering all actively floating tea leaf particles.
 */
export function FirstFlushLeaves({ leaves }: { leaves: TeaLeafParticle[] }) {
  if (leaves.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
        <defs>
          {LEAF_GRADIENTS.map((grad, i) => (
            <React.Fragment key={grad.id}>
              <linearGradient id={`tea-leaf-grad-${i}`} x1="0" y1="0" x2="24" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={grad.end} />
                <stop offset="45%" stopColor={grad.start} />
                <stop offset="100%" stopColor="#0e2318" />
              </linearGradient>
              <linearGradient id={`tea-leaf-glint-${i}`} x1="4" y1="2" x2="14" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </React.Fragment>
          ))}
        </defs>
      </svg>

      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute"
          style={
            {
              left: `${leaf.x}px`,
              top: `${leaf.y}px`,
              animation: `floatTeaLeaf ${leaf.duration}s cubic-bezier(0.22, 1, 0.36, 1) ${leaf.delay}s forwards`,
              transformOrigin: "center center",
              willChange: "transform, opacity",
              "--drift-1": `${leaf.driftX1}px`,
              "--drift-2": `${leaf.driftX2}px`,
              "--drift-3": `${leaf.driftX3}px`,
              "--drift-4": `${leaf.driftX4}px`,
              "--rot-0": `${leaf.rotStart}deg`,
              "--rot-1": `${leaf.rotMid1}deg`,
              "--rot-2": `${leaf.rotMid2}deg`,
              "--rot-3": `${leaf.rotEnd}deg`,
              "--target-scale": leaf.scale,
            } as React.CSSProperties
          }
        >
          <PremiumTeaLeafSVG variant={leaf.variant} size={leaf.size} />
        </div>
      ))}
      <style>{`
        @keyframes floatTeaLeaf {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) rotate(var(--rot-0)) scale(0.4);
          }
          12% {
            opacity: 0.96;
            transform: translate3d(var(--drift-1), -60px, 0) rotate(var(--rot-1)) scale(var(--target-scale));
          }
          45% {
            opacity: 0.9;
            transform: translate3d(var(--drift-2), -190px, 0) rotate(var(--rot-2)) scale(var(--target-scale));
          }
          75% {
            opacity: 0.75;
            transform: translate3d(var(--drift-3), -320px, 0) rotate(var(--rot-3)) scale(calc(var(--target-scale) * 0.95));
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--drift-4), -450px, 0) rotate(calc(var(--rot-3) + 70deg)) scale(calc(var(--target-scale) * 0.75));
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to trigger the Dooars First Flush burst on single click.
 */
export function useFirstFlush(notify: (msg: string) => void, locale?: string) {
  const [leaves, setLeaves] = useState<TeaLeafParticle[]>([]);

  const triggerFirstFlush = useCallback(
    (e?: React.MouseEvent | React.TouchEvent) => {
      // Determine origin coordinates
      let originX = 140;
      let originY = 60;

      if (e) {
        if ("clientX" in e && typeof e.clientX === "number" && e.clientX > 0) {
          originX = e.clientX;
          originY = e.clientY;
        } else if ("touches" in e && e.touches.length > 0) {
          originX = e.touches[0].clientX;
          originY = e.touches[0].clientY;
        }
      }

      // Generate 8 premium leaves with organic physics
      const count = 8;
      const batchId = Date.now();
      const newLeaves: TeaLeafParticle[] = Array.from({ length: count }, (_, i) => {
        const spread = (Math.random() - 0.5) * 50;
        const driftDirection = Math.random() > 0.5 ? 1 : -1;
        return {
          id: batchId + i,
          x: originX + spread,
          y: originY + (Math.random() - 0.5) * 20,
          size: Math.floor(Math.random() * 8) + 24, // 24px - 32px
          scale: Number((0.85 + Math.random() * 0.35).toFixed(2)),
          variant: i % 4,
          driftX1: Math.round(driftDirection * (20 + Math.random() * 35)),
          driftX2: Math.round(driftDirection * (45 + Math.random() * 65)),
          driftX3: Math.round(driftDirection * (30 + Math.random() * 95)),
          driftX4: Math.round(driftDirection * (50 + Math.random() * 130)),
          rotStart: Math.round((Math.random() - 0.5) * 60),
          rotMid1: Math.round((Math.random() - 0.5) * 120 + 30),
          rotMid2: Math.round((Math.random() - 0.5) * 180 + 75),
          rotEnd: Math.round((Math.random() - 0.5) * 240 + 130),
          duration: Number((2.8 + Math.random() * 0.8).toFixed(2)), // 2.8s - 3.6s
          delay: Number((i * 0.04).toFixed(3)),
        };
      });

      setLeaves((prev) => [...prev.slice(-16), ...newLeaves]);

      // Refined toast notification
      const toastMessage =
        locale === "bn"
          ? "🍃 ডুয়ার্স ফার্স্ট ফ্লাশ · জলপাইগুড়িতে যুক্তি ও বিজ্ঞানমনস্কতার মেলবন্ধন।"
          : "🍃 Dooars First Flush · Brewed with logic and scientific temper in Jalpaiguri.";
      notify(toastMessage);

      // Clean up leaves after animation completes
      setTimeout(() => {
        setLeaves((prev) => prev.filter((leaf) => !newLeaves.some((n) => n.id === leaf.id)));
      }, 4000);
    },
    [notify, locale]
  );

  return { leaves, triggerFirstFlush };
}
