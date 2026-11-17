"use client";

import React, { useState, useCallback, memo } from "react";

export interface TeaLeafParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  scale: number;
  variant: number;
  spreadX: number;
  driftX1: number;
  driftX2: number;
  driftX3: number;
  driftX4: number;
  dropY1: number;
  dropY2: number;
  dropY3: number;
  dropY4: number;
  rotZ0: number;
  rotZ1: number;
  rotZ2: number;
  rotZ3: number;
  rotZ4: number;
  rotX1: number;
  rotX2: number;
  rotY1: number;
  rotY2: number;
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
 * Container rendering all actively falling and swirling tea leaf particles.
 */
export function FirstFlushLeaves({ leaves }: { leaves: TeaLeafParticle[] }) {
  if (leaves.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      style={{ perspective: "1000px" }}
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
              animation: `fallTeaLeaf ${leaf.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${leaf.delay}s forwards`,
              transformOrigin: "center center",
              transformStyle: "preserve-3d",
              willChange: "transform, opacity",
              "--spread-x": `${leaf.spreadX}px`,
              "--drift-1": `${leaf.driftX1}px`,
              "--drift-2": `${leaf.driftX2}px`,
              "--drift-3": `${leaf.driftX3}px`,
              "--drift-4": `${leaf.driftX4}px`,
              "--drop-1": `${leaf.dropY1}px`,
              "--drop-2": `${leaf.dropY2}px`,
              "--drop-3": `${leaf.dropY3}px`,
              "--drop-4": `${leaf.dropY4}px`,
              "--rot-z-0": `${leaf.rotZ0}deg`,
              "--rot-z-1": `${leaf.rotZ1}deg`,
              "--rot-z-2": `${leaf.rotZ2}deg`,
              "--rot-z-3": `${leaf.rotZ3}deg`,
              "--rot-z-4": `${leaf.rotZ4}deg`,
              "--rot-x-1": `${leaf.rotX1}deg`,
              "--rot-x-2": `${leaf.rotX2}deg`,
              "--rot-y-1": `${leaf.rotY1}deg`,
              "--rot-y-2": `${leaf.rotY2}deg`,
              "--target-scale": leaf.scale,
            } as React.CSSProperties
          }
        >
          <PremiumTeaLeafSVG variant={leaf.variant} size={leaf.size} />
        </div>
      ))}
      <style>{`
        @keyframes fallTeaLeaf {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) rotateZ(var(--rot-z-0)) rotateX(0deg) rotateY(0deg) scale(0.35);
          }
          10% {
            opacity: 0.98;
            /* Gentle upward plucking flick then begins smooth descent */
            transform: translate3d(var(--spread-x), -28px, 0) rotateZ(var(--rot-z-1)) rotateX(var(--rot-x-1)) rotateY(var(--rot-y-1)) scale(var(--target-scale));
          }
          32% {
            opacity: 0.95;
            /* Falling & swaying outwards to side A */
            transform: translate3d(var(--drift-1), var(--drop-1), 10px) rotateZ(var(--rot-z-2)) rotateX(var(--rot-x-2)) rotateY(var(--rot-y-2)) scale(var(--target-scale));
          }
          58% {
            opacity: 0.9;
            /* Swirling back across the opposite side like a real leaf catching air resistance */
            transform: translate3d(var(--drift-2), var(--drop-2), -10px) rotateZ(var(--rot-z-3)) rotateX(calc(var(--rot-x-1) * -1)) rotateY(calc(var(--rot-y-1) * -1)) scale(var(--target-scale));
          }
          82% {
            opacity: 0.78;
            /* Gliding downward with smooth tilt */
            transform: translate3d(var(--drift-3), var(--drop-3), 5px) rotateZ(var(--rot-z-4)) rotateX(var(--rot-x-2)) rotateY(var(--rot-y-1)) scale(calc(var(--target-scale) * 0.95));
          }
          100% {
            opacity: 0;
            /* Smooth descent towards floor */
            transform: translate3d(var(--drift-4), var(--drop-4), 0) rotateZ(calc(var(--rot-z-4) + 45deg)) rotateX(60deg) rotateY(40deg) scale(calc(var(--target-scale) * 0.82));
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

      // Generate 8 premium leaves with realistic falling & swirling physics
      const count = 8;
      const batchId = Date.now();
      const newLeaves: TeaLeafParticle[] = Array.from({ length: count }, (_, i) => {
        const driftDirection = i % 2 === 0 ? 1 : -1;
        const speedFactor = 0.85 + Math.random() * 0.35;
        return {
          id: batchId + i,
          x: originX + (Math.random() - 0.5) * 30,
          y: originY + (Math.random() - 0.5) * 15,
          size: Math.floor(Math.random() * 7) + 25, // 25px - 31px
          scale: Number((0.9 + Math.random() * 0.3).toFixed(2)),
          variant: i % 4,
          spreadX: Math.round((Math.random() - 0.5) * 50),
          driftX1: Math.round(driftDirection * (35 + Math.random() * 45)),
          driftX2: Math.round(-driftDirection * (25 + Math.random() * 50)), // Swings back across!
          driftX3: Math.round(driftDirection * (45 + Math.random() * 65)),  // Swings back again!
          driftX4: Math.round((driftDirection * 30) + (Math.random() - 0.5) * 80),
          dropY1: Math.round(100 * speedFactor + Math.random() * 30), // Cascades down smoothly
          dropY2: Math.round(250 * speedFactor + Math.random() * 50),
          dropY3: Math.round(440 * speedFactor + Math.random() * 70),
          dropY4: Math.round(650 * speedFactor + Math.random() * 90),
          rotZ0: Math.round((Math.random() - 0.5) * 40),
          rotZ1: Math.round(driftDirection * (25 + Math.random() * 35)),
          rotZ2: Math.round(-driftDirection * (45 + Math.random() * 40)),
          rotZ3: Math.round(driftDirection * (60 + Math.random() * 50)),
          rotZ4: Math.round(-driftDirection * (75 + Math.random() * 60)),
          rotX1: Math.round(30 + Math.random() * 30),
          rotX2: Math.round(-35 - Math.random() * 25),
          rotY1: Math.round(25 + Math.random() * 35),
          rotY2: Math.round(-30 - Math.random() * 30),
          duration: Number((3.6 + Math.random() * 0.9).toFixed(2)), // 3.6s - 4.5s smooth fluttering descent
          delay: Number((i * 0.07).toFixed(3)),
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
      }, 5500);
    },
    [notify, locale]
  );

  return { leaves, triggerFirstFlush };
}
