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

export const KARALA_RIVER_MILESTONES: CampaignMilestone[] = [
  {
    id: "kr-1",
    phase: 1,
    title: "Riverbed Water Sampling & Contamination Audit",
    description: "Documented BOD/COD levels, municipal sewer outfalls, and solid waste choking points along River Karala from Dinbazar to Kadamtala.",
    status: "completed",
    completedDate: "12/05/2026",
  },
  {
    id: "kr-2",
    phase: 2,
    title: "Citizen Coalition & Joint Memorandum Drafting",
    description: "Forged joint action platform with Relief and Public Welfare Society formulating a 5-point river rejuvenation charter.",
    status: "completed",
    completedDate: "24/05/2026",
  },
  {
    id: "kr-3",
    phase: 3,
    title: "Mass Environmental March from Thana More to Kadamtala",
    description: "Mobilized 250+ citizens and student cadres carrying scientific placards demanding immediate desiltation on World Environment Day.",
    status: "completed",
    completedDate: "05/06/2026",
  },
  {
    id: "kr-4",
    phase: 4,
    title: "Citizen Deputation to Jalpaiguri Municipality Chairperson",
    description: "Submitted mass petition with 650+ verified resident signatures demanding relocation of the open-air toxic dumpsite.",
    status: "completed",
    completedDate: "15/06/2026",
  },
  {
    id: "kr-5",
    phase: 5,
    title: "Budget Sanction & Municipal Desiltation Tendering",
    description: "Jalpaiguri Municipality officially sanctioned desiltation works and designated new sanitary landfill relocation site.",
    status: "completed",
    completedDate: "28/07/2026",
  },
];

export const KARALA_RIVER_CAMPAIGN_DATA = {
  isOngoing: false,
  progressPercent: 100,
  targetGoal: "Ecological restoration of River Karala, desiltation tender, and relocation of municipal open dumping ground",
  milestones: KARALA_RIVER_MILESTONES,
};

export const PRAFULLA_RAY_MILESTONES: CampaignMilestone[] = [
  {
    id: "pr-1",
    phase: 1,
    title: "Commemoration & Scientific Legacy of Acharya P. C. Ray",
    description: "Floral tribute and public remembrance at Kadamtala More honouring Acharya Prafulla Chandra Ray's pioneering chemical research and social dedication.",
    status: "completed",
    completedDate: "02/08/2024",
  },
  {
    id: "pr-2",
    phase: 2,
    title: "Joint Relief Initiative with Students' Action Front",
    description: "United mobilization with Students' Action Front to formulate mass humanitarian appeal and deploy volunteer collection teams across town.",
    status: "completed",
    completedDate: "02/08/2024",
  },
  {
    id: "pr-3",
    phase: 3,
    title: "Public Fund & Material Drive Across Jalpaiguri Town",
    description: "Door-to-door, market stalls, and commuter collection drive at Kadamtala, Santpara, and central transit junctions with public receipt tracking.",
    status: "completed",
    completedDate: "02/08/2024",
  },
  {
    id: "pr-4",
    phase: 4,
    title: "Relief Consolidation & Despatch to Assam Flood Victims",
    description: "Reconciliation of collected relief funds and essential supplies for direct delivery to flood-affected communities in Assam.",
    status: "completed",
    completedDate: "05/08/2024",
  },
];

export const PRAFULLA_RAY_CAMPAIGN_DATA = {
  isOngoing: false,
  progressPercent: 100,
  targetGoal: "Acharya Prafulla Chandra Ray birth anniversary observance and joint mass flood relief collection for Assam with Students' Action Front",
  milestones: PRAFULLA_RAY_MILESTONES,
};

/**
 * Checks whether an event is a civic/environmental campaign (either ongoing or completed)
 * rather than a routine meeting or one-off workshop.
 */
export function isCampaignEvent(
  event?: { isOngoing?: boolean | null; category?: string | null; title?: string | null } | null
): boolean {
  if (!event) return false;
  const title = (event.title || "").toLowerCase();
  // Filter out any obsolete placeholder sample records
  if (title.includes("a greener neighbourhood")) return false;
  const category = (event.category || "").toLowerCase();
  return (
    category === "campaign" ||
    event.isOngoing === true ||
    title.includes("campaign") ||
    title.includes("mashkalaibari") ||
    title.includes("karala") ||
    title.includes("prafulla") ||
    title.includes("assam") ||
    title.includes("প্রফুল্ল") ||
    title.includes("বন্যাত্রাণ")
  );
}

/**
 * Hydrates campaign metadata (ongoing flag, progress %, target goal, phased milestones)
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
  const title = (event.title || "").toLowerCase();

  const matchedData = title.includes("karala")
    ? KARALA_RIVER_CAMPAIGN_DATA
    : (title.includes("prafulla") || title.includes("assam") || title.includes("প্রফুল্ল") || title.includes("বন্যাত্রাণ"))
    ? PRAFULLA_RAY_CAMPAIGN_DATA
    : MASHKALAIBARI_CAMPAIGN_DATA;

  const rawImage = event.image || "";
  const isBrokenImage =
    !rawImage ||
    rawImage.includes("environment-campaign") ||
    rawImage.includes("science-outreach") ||
    rawImage.includes("conference");

  let defaultImage = "/images/field-reports/mashkalaibari/inspection-1.jpg";
  if (title.includes("karala")) {
    defaultImage = "/images/field-reports/environment-day-2026/karala-rally-march.jpg";
  } else if (title.includes("prafulla") || title.includes("assam") || title.includes("প্রফুল্ল") || title.includes("বন্যাত্রাণ")) {
    defaultImage = "/images/field-reports/prafulla-ray/prafulla-flood-relief-2.jpg";
  }

  // Preserve explicit event.isOngoing boolean if defined; otherwise fallback to matched metadata
  const isOngoing = event.isOngoing !== undefined && event.isOngoing !== null
    ? Boolean(event.isOngoing)
    : (isCamp ? matchedData.isOngoing : false);

  return {
    id: event.id || "",
    title: event.title || "",
    description: event.description || "",
    location: event.location || "",
    category: event.category || (isCamp ? "Campaign" : "Outreach"),
    volunteers: event.volunteers || 0,
    image: isBrokenImage ? defaultImage : rawImage,
    startsAt: event.startsAt || new Date().toISOString(),
    createdAt: event.createdAt || new Date().toISOString(),
    isOngoing,
    progressPercent: event.progressPercent !== undefined && event.progressPercent !== null
      ? event.progressPercent
      : (isCamp ? matchedData.progressPercent : undefined),
    targetGoal: event.targetGoal || (isCamp ? matchedData.targetGoal : undefined),
    milestones: event.milestones && event.milestones.length > 0
      ? event.milestones
      : (isCamp ? matchedData.milestones : undefined),
  };
}
