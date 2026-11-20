import { db, isDatabaseConfigured } from "@/db";
import { profiles, dues, events, procurements, donations, circulars, activities } from "@/db/schema";
import { ensureSeed, ADMIN_ID, OPENING_BALANCE } from "@/db/seed";
import { asc, desc } from "drizzle-orm";
import type { WorkspaceData, Profile, Role } from "@/lib/types";
import { getDemoWorkspace } from "@/lib/demo-data";
import { isProductionRuntime } from "@/lib/runtime";
import { hydrateCampaignEvent } from "@/lib/campaign-data";

export async function getWorkspace(userId?: string): Promise<WorkspaceData> {
  if (!isDatabaseConfigured) {
    // Demo data is for local development only; a production server without a database must not serve it.
    if (isProductionRuntime()) throw new Error("DATABASE_URL (or POSTGRES_URL) is not set; refusing to serve demo data in production.");
    return getDemoWorkspace(userId);
  }

  try {
    await ensureSeed();
  } catch (err) {
    console.warn("[Workspace] Seed notice (proceeding):", err);
  }

  const [people, payments, rawEvents, items, contributions, notices, feed] = await Promise.all([
    db.select().from(profiles).orderBy(asc(profiles.createdAt)),
    db.select().from(dues),
    db.select().from(events).orderBy(asc(events.startsAt)).catch((err) => {
      console.warn("[Workspace] Failed to query events table, using fallback:", err);
      return [];
    }),
    db.select().from(procurements).orderBy(desc(procurements.createdAt)),
    db.select().from(donations).orderBy(desc(donations.createdAt)),
    db.select().from(circulars).orderBy(desc(circulars.pinned), desc(circulars.createdAt)),
    db.select().from(activities).orderBy(desc(activities.createdAt)).limit(50),
  ]);
  // Filter out obsolete sample events from initial project templates
  const validEvents = rawEvents.filter(
    (e) =>
      !e.title.toLowerCase().includes("greener neighbourhood") &&
      !e.image.includes("environment-campaign") &&
      e.id !== "20000000-0000-4000-8000-000000000003"
  );

  // Guarantee the real Mashkalaibari Campaign is always present
  const hasMashkalaibari = validEvents.some(
    (e) => e.title.includes("Mashkalaibari") || e.id === "20000000-0000-4000-8000-000000000005"
  );
  if (!hasMashkalaibari) {
    validEvents.push({
      id: "20000000-0000-4000-8000-000000000005",
      title: "Campaign: Clean Mashkalaibari — Stop Furnace Emissions & River Dumping",
      description: "Grassroots citizen advocacy and environmental intervention to end toxic crematorium furnace smoke, open waste dumping in the riverbed, and municipal inaction at Mashkalaibari, Jalpaiguri.",
      location: "Mashkalaibari Crematorium & Neighbourhoods, Jalpaiguri",
      startsAt: new Date("2026-11-03T08:00:00.000Z"),
      category: "Campaign",
      volunteers: 18,
      image: "/images/field-reports/mashkalaibari/inspection-1.jpg",
      createdAt: new Date("2026-11-03T08:00:00.000Z"),
      isOngoing: true,
      progressPercent: 20,
      targetGoal: "Installation of automated Air Pollution Control System (APCS) & River Protection",
    });
  }

  // Guarantee the real World Environment Day / Karala River Campaign is always present
  const hasEnvironmentDay = validEvents.some(
    (e) => e.title.includes("Environment Day") || e.title.includes("Karala") || e.id === "20000000-0000-4000-8000-000000000006"
  );
  if (!hasEnvironmentDay) {
    validEvents.push({
      id: "20000000-0000-4000-8000-000000000006",
      title: "Campaign: Save River Karala & Relocate Toxic Civic Dumping Ground",
      description: "Decisive grassroots environmental advocacy and citizen mobilization uniting Light of Science and Relief and Public Welfare Society. Successfully secured municipal budget sanction for comprehensive Karala river desiltation and initiated relocation proceedings for the hazardous municipal dumping ground away from town residential wards.",
      location: "Kotwali Thana More to Kadamtala & Municipality Office, Jalpaiguri",
      startsAt: new Date("2026-06-05T09:30:00.000Z"),
      category: "Campaign",
      volunteers: 35,
      image: "/images/field-reports/environment-day-2026/karala-rally-march.jpg",
      createdAt: new Date("2026-06-05T09:30:00.000Z"),
      isOngoing: false,
      progressPercent: 100,
      targetGoal: "Ecological restoration of River Karala, desiltation tender, and relocation of municipal open dumping ground",
    });
  }

  // Guarantee the real Acharya P. C. Ray & Assam Flood Relief Campaign is always present
  const hasPrafulla = validEvents.some(
    (e) => e.title.includes("Prafulla") || e.title.includes("প্রফুল্ল") || e.id === "20000000-0000-4000-8000-000000000008"
  );
  if (!hasPrafulla) {
    validEvents.push({
      id: "20000000-0000-4000-8000-000000000008",
      title: "Campaign: Acharya Prafulla Chandra Ray Birth Anniversary & Assam Flood Relief Drive",
      description: "Observance of Acharya Prafulla Chandra Ray's birth anniversary by Light of Science Club at Kadamtala, followed by a joint humanitarian flood relief collection drive across Jalpaiguri town for flood-affected families in Assam in collaboration with Students' Action Front.",
      location: "Kadamtala More & Jalpaiguri Town, Jalpaiguri",
      startsAt: new Date("2024-08-02T09:30:00.000Z"),
      category: "Campaign",
      volunteers: 18,
      image: "/images/field-reports/prafulla-ray/prafulla-flood-relief-2.jpg",
      createdAt: new Date("2024-08-02T09:30:00.000Z"),
      isOngoing: false,
      progressPercent: 100,
      targetGoal: "Acharya Prafulla Chandra Ray birth anniversary observance and joint mass flood relief collection for Assam with Students' Action Front",
    });
  }

  // Guarantee the World Environment Day Field Action Report is always present in circulars
  const hasEnvCircular = notices.some(
    (c) => c.id === "50000000-0000-4000-8000-000000000006" || c.title.includes("Environment Day")
  );
  if (!hasEnvCircular) {
    notices.unshift({
      id: "50000000-0000-4000-8000-000000000006",
      title: "Field Action Report: World Environment Day Rally for Karala River & Civic Dumping Ground",
      content: `LOCATION: Jalpaiguri (Kotwali Thana More to Kadamtala)\nDATE: June 5, 2026\nORGANIZED BY: Light of Science (Breakthrough Science Society, Jalpaiguri Unit) in solidarity with Relief and Public Welfare Society\n\n1. KEY ENVIRONMENTAL DEMANDS:\n• Complete ecological restoration, desiltation, and sewage prevention for River Karala.\n• Immediate relocation and scientific management of the open-air toxic municipal dumping ground away from town residential wards.\n\n2. RALLY SUMMARY:\nA massive youth and citizens' rally marched from Thana More to Kadamtala carrying scientific placards and banners ("Love the Earth, It's our Home", "There is no Planet B", "চাই বৈজ্ঞানিক বর্জ্য নিয়ন্ত্রণ", "করলা আমাদের মা, তাকে রক্ষা করা আমাদের কর্তব্য").\n\n3. ADDRESSES & SOLIDARITY:\n• Avash Rajak (Joint Secretary, Light of Science): Addressed administrative negligence and called for scientific desiltation.\n• Swarndeep Sen (Acting President, Light of Science): Highlighted severe respiratory and groundwater risks of municipal dumping.\n• Kunal Roy (President, Light of Science): Emphasized continuous civic scientific vigilance beyond symbolic annual observance.\n• Aditi Chowdhury addressed the gathering.`,
      category: "Campaign report",
      pinned: true,
      authorId: "10000000-0000-4000-8000-000000000026",
      createdAt: new Date("2026-06-05T10:00:00.000Z"),
    });
  }

  // Guarantee the Acharya Prafulla Chandra Ray & Assam Flood Relief Report is always present in circulars
  const hasPrafullaCircular = notices.some(
    (c) => c.id === "50000000-0000-4000-8000-000000000008" || c.title.includes("Prafulla") || c.title.includes("প্রফুল্ল")
  );
  if (!hasPrafullaCircular) {
    notices.unshift({
      id: "50000000-0000-4000-8000-000000000008",
      title: "Field Action Report: Acharya Prafulla Chandra Ray Birth Anniversary & Assam Flood Relief Drive",
      content: `LOCATION: Kadamtala More & Jalpaiguri Town\nDATE: August 2, 2024\nORGANIZED BY: Light of Science (Breakthrough Science Society, Jalpaiguri Unit) in joint collaboration with Students' Action Front\n\n1. COMMEMORATION OF ACHARYA P. C. RAY:\nThe birth anniversary of the father of Indian chemical science and pioneering social reformer Acharya Prafulla Chandra Ray was observed with floral tributes and scientific remembrance at Kadamtala More, Jalpaiguri.\n\n2. ASSAM FLOOD RELIEF HUMANITARIAN DRIVE:\nIn upholding Acharya Ray's lifelong conviction that scientific knowledge must actively alleviate human suffering during disasters, Light of Science Club and Students' Action Front organized a joint town-wide relief fund collection drive for flood-affected families in Assam.\n\n3. CADRE MOBILIZATION & TOWN COLLECTION:\nStudent and youth volunteers carrying collection cartons and appeal flyers engaged commuters, e-rickshaw passengers, and shopkeepers across Kadamtala, Santpara, and main market corridors.\n\n4. LEADERSHIP PRESENT:\n• Kunal Roy (President, Light of Science)\n• Pritam Sarkar (Secretary, Light of Science)\n• Dipta Paul (Joint Secretary, Light of Science)\n• Avash Rajak (Joint Secretary, Light of Science)\nAlong with student activists of Students' Action Front and unit volunteers.\n\n───────────────────────────────\n\nজলপাইগুড়ি শহরে ব্রেকথ্রু সায়েন্স সোসাইটির ইউনিট লাইট অফ সায়েন্স ক্লাবের পক্ষ থেকে আচার্য্য প্রফুল্ল চন্দ্র রায়ের জন্মদিবস পালন করা হয় এবং পরবর্তীতে স্টুডেন্টস অ্যাকশন ফ্রন্টের যৌথ উদ্যোগে আসামের বন্যাত্রান সংগ্রহ করা হয়। উপস্থিত ছিলেন লাইট অফ সায়েন্স ক্লাবের সভাপতি কুণাল রায় ও সম্পাদক প্রীতম সরকার, সহ সম্পাদক দীপ্ত পাল ও আভাস রজক।`,
      category: "Campaign report",
      pinned: true,
      authorId: "10000000-0000-4000-8000-000000000003",
      createdAt: new Date("2024-08-02T10:00:00.000Z"),
    });
  }

  const unitEvents = validEvents.map((e) =>
    hydrateCampaignEvent({
      ...e,
      startsAt: e.startsAt instanceof Date ? e.startsAt.toISOString() : String(e.startsAt),
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    })
  );
  people.sort((a, b) => a.id.localeCompare(b.id));
  const requestingUser = people.find((p) => p.id === userId);

  // 1. PUBLIC VISITOR (Unauthenticated)
  // Hidden means the server never sends it:
  // - No member directory
  // - No dues or money figures
  // - No procurements / shopping list
  // - No donor register
  // - No internal circulars or meeting agendas
  // - No activity audit log
  if (!requestingUser) {
    return JSON.parse(JSON.stringify({
      profiles: [],
      dues: [],
      events: unitEvents,
      procurements: [],
      donations: [],
      circulars: notices.filter((c) => c.category === "Campaign report" || c.pinned),
      activities: [],
      currentUserId: "",
      currentUserRole: "guest",
      openingBalance: 0,
    })) as WorkspaceData;
  }

  const role = requestingUser.role as Role;
  const isExecutive = role === "admin";
  const isVolunteerOrOrganizer = role === "volunteer" || role === "organizer";

  // Calculate unpaid months accurately for the requesting user
  const now = new Date();
  const paymentSet = new Set(payments.map((p) => `${p.memberId}-${p.year}-${p.month}`));

  // 2. MEMBER ROSTER PROJECTION
  // - Executive: Names, roles, plus phones, pledges, and arrears
  // - Member & Volunteer: Names, roles only. No phones! Other members' payment status is never revealed.
  const roster: Profile[] = people.map((person) => {
    let unpaidMonths = 0;
    if (isExecutive || person.id === requestingUser.id) {
      for (let i = 0; i < 24; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        if (date < new Date(person.createdAt.getFullYear(), person.createdAt.getMonth(), 1)) break;
        if (paymentSet.has(`${person.id}-${date.getFullYear()}-${date.getMonth() + 1}`)) break;
        unpaidMonths++;
      }
    }

    return {
      id: person.id,
      fullName: person.fullName,
      phone: isExecutive || person.id === requestingUser.id ? person.phone : null,
      role: person.role as Role,
      status: person.id === requestingUser.id ? (unpaidMonths >= 6 ? "inactive" : "active") : (person.status || "active"),
      monthlyPledge: isExecutive || person.id === requestingUser.id ? Number(person.monthlyPledge || 20) : 0,
      avatarColor: person.avatarColor as Profile["avatarColor"],
      unpaidMonths: isExecutive || person.id === requestingUser.id ? unpaidMonths : 0,
      createdAt: person.createdAt.toISOString(),
      hasGoogleLinked: Boolean(person.googleEmail || person.googleSub),
      googleEmail: person.id === requestingUser.id ? person.googleEmail : person.googleEmail ? "Linked" : null,
      isMinor: Boolean(person.isMinor),
    };
  });

  // 3. DUES PROJECTION
  // - Executive: Full 12-month treasury matrix of everyone's dues and who owes
  // - Volunteer & Member: Own dues only! (Volunteers only look up single member dues when recording)
  const projectedDues = isExecutive
    ? payments
    : payments.filter((p) => p.memberId === requestingUser.id);

  // 4. DONATIONS PROJECTION
  // - Executive: Full donation register (donor names, phones, amounts)
  // - Volunteer: Record-only (server sends empty array; volunteer submits new donations and gets shareable receipt)
  // - Member: Empty
  const projectedDonations = isExecutive ? contributions : [];

  // 5. PROCUREMENTS PROJECTION
  // - Executive & Volunteer / Organizer: Event shopping checklist & spend
  // - Member: Empty
  const projectedProcurements = (isExecutive || isVolunteerOrOrganizer) ? items : [];

  // 6. CIRCULARS & NOTICES PROJECTION
  // - Public: Empty (filtered above)
  // - Member, Volunteer, Executive: Unit circulars and meeting agendas
  const projectedCirculars = notices;

  // 7. ACTIVITY LOG PROJECTION
  // - Executive: Full audit log
  // - Volunteer & Member: Empty
  const projectedActivities = isExecutive ? feed : [];

  return JSON.parse(JSON.stringify({
    profiles: roster,
    dues: projectedDues,
    events: unitEvents,
    procurements: projectedProcurements,
    donations: projectedDonations,
    circulars: projectedCirculars,
    activities: projectedActivities,
    currentUserId: requestingUser.id,
    currentUserRole: role,
    openingBalance: isExecutive ? OPENING_BALANCE : 0,
  })) as WorkspaceData;
}
