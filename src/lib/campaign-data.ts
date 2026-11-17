import type { CampaignMilestone, UnitEvent } from "@/lib/types";

export const MASHKALAIBARI_MILESTONES: CampaignMilestone[] = [
  {
    id: "m-1",
    phase: 1,
    title: "Field Inspection & Photographic Fact-Finding",
    description: "On-site visit on 03/11/2026 with local youth; documented toxic emissions, resident distress, and 6 photographic evidence records.",
    status: "completed",
    completedDate: "03/11/2026",
  },
  {
    id: "m-2",
    phase: 2,
    title: "Citizen Alignment & Joint Committee Formation",
    description: "Convening neighbourhood meetings with conscious resident Babul Choudhury and local youth to formulate unity demands.",
    status: "in_progress",
  },
  {
    id: "m-3",
    phase: 3,
    title: "Technical Deputation to Municipality & SPCB",
    description: "Formal submission of engineering charter demanding wet scrubbers, high-stack filtration, and river waste containment.",
    status: "planned",
  },
  {
    id: "m-4",
    phase: 4,
    title: "Mass Citizen Petition & 500+ Signature Drive",
    description: "Neighbourhood awareness walk and mass signature collection across Jalpaiguri wards.",
    status: "planned",
  },
  {
    id: "m-5",
    phase: 5,
    title: "APCS Installation & Environmental Verification",
    description: "Independent citizen verification of furnace emission levels and restored riverfront cleanliness.",
    status: "planned",
  },
];

export const MASHKALAIBARI_CAMPAIGN_DATA = {
  isOngoing: true,
  progressPercent: 20,
  targetGoal: "Installation of automated Air Pollution Control System (APCS) & River Protection",
  milestones: MASHKALAIBARI_MILESTONES,
};

/**
 * Checks whether an event is an ongoing civic/environmental campaign
 * rather than a single-day rally or convention.
 */
export function isCampaignEvent(
  event?: { isOngoing?: boolean | null; category?: string | null; title?: string | null } | null
): boolean {
  if (!event) return false;
  const title = (event.title || "").toLowerCase();
  // Filter out any obsolete placeholder sample records
  if (title.includes("a greener neighbourhood")) return false;
  if (event.isOngoing) return true;
  const category = (event.category || "").toLowerCase();
  return (
    category === "campaign" ||
    title.includes("mashkalaibari") ||
    title.includes("campaign:") ||
    title.startsWith("campaign")
  );
}

/**
 * Hydrates campaign metadata (ongoing flag, 20% progress, goal, phased milestones)
 * if missing from the underlying database row or API payload.
 */
export function hydrateCampaignEvent<
  T extends {
    id?: string;
    title?: string;
    description?: string;
    location?: string;
    category?: string;
    volunteers?: number;
    image?: string;
    startsAt?: string;
    createdAt?: string;
    isOngoing?: boolean | null;
    progressPercent?: number | null;
    targetGoal?: string | null;
    milestones?: CampaignMilestone[] | null;
  }
>(event: T): UnitEvent {
  const isCamp = isCampaignEvent(event);
  const rawImage = event.image || "";
  const isBrokenImage =
    !rawImage ||
    rawImage.includes("environment-campaign") ||
    rawImage.includes("science-outreach") ||
    rawImage.includes("conference");

  return {
    id: event.id || "",
    title: event.title || "",
    description: event.description || "",
    location: event.location || "",
    category: event.category || "Outreach",
    volunteers: event.volunteers || 0,
    image: isBrokenImage
      ? "/images/field-reports/mashkalaibari/inspection-1.jpg"
      : rawImage,
    startsAt: event.startsAt || new Date().toISOString(),
    createdAt: event.createdAt || new Date().toISOString(),
    isOngoing: isCamp ? true : Boolean(event.isOngoing),
    progressPercent: isCamp
      ? (event.progressPercent ?? MASHKALAIBARI_CAMPAIGN_DATA.progressPercent)
      : (event.progressPercent ?? undefined),
    targetGoal: isCamp
      ? (event.targetGoal || MASHKALAIBARI_CAMPAIGN_DATA.targetGoal)
      : (event.targetGoal ?? undefined),
    milestones: isCamp
      ? (event.milestones && event.milestones.length > 0
          ? event.milestones
          : MASHKALAIBARI_CAMPAIGN_DATA.milestones)
      : (event.milestones ?? undefined),
  };
}
