import { db, isDatabaseConfigured } from "@/db";
import { profiles, dues, events, procurements, donations, circulars, activities } from "@/db/schema";
import { ensureSeed, ADMIN_ID, OPENING_BALANCE } from "@/db/seed";
import { asc, desc } from "drizzle-orm";
import type { WorkspaceData, Profile, Role } from "@/lib/types";
import { getDemoWorkspace } from "@/lib/demo-data";

export async function getWorkspace(userId?: string): Promise<WorkspaceData> {
  if (!isDatabaseConfigured) {
    return getDemoWorkspace(userId);
  }

  await ensureSeed();
  const [people, payments, unitEvents, items, contributions, notices, feed] = await Promise.all([
    db.select().from(profiles).orderBy(asc(profiles.createdAt)),
    db.select().from(dues),
    db.select().from(events).orderBy(asc(events.startsAt)),
    db.select().from(procurements).orderBy(desc(procurements.createdAt)),
    db.select().from(donations).orderBy(desc(donations.createdAt)),
    db.select().from(circulars).orderBy(desc(circulars.pinned), desc(circulars.createdAt)),
    db.select().from(activities).orderBy(desc(activities.createdAt)).limit(50),
  ]);
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
      circulars: [],
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
      hasGoogleLinked: Boolean(person.googleEmail),
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
