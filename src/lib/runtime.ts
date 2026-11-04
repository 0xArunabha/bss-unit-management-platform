/**
 * True when this process is serving real production traffic.
 *
 * `next build` also runs with NODE_ENV=production while it imports routes to collect page data, and the hosting
 * platform may not expose the runtime secrets to that step. The build phase is therefore excluded; everything after
 * it (`next start`, the hosted serverless runtime) counts as production.
 */
export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";
}
