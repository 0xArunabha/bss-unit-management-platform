import { db, isDatabaseConfigured } from "@/db";
import { profiles, dues, events, procurements, donations, circulars, activities } from "@/db/schema";
import { ensureSeed, ADMIN_ID, OPENING_BALANCE } from "@/db/seed";
import { asc, desc } from "drizzle-orm";
import type { WorkspaceData, Profile } from "@/lib/types";
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

  // If no authenticated user session, return sanitized public data
  if (!requestingUser) {
    const publicProfiles: Profile[] = people.map((person) => ({
      id: person.id,
      fullName: person.fullName,
      phone: null, // Protected: phone numbers hidden from anonymous readers
      role: person.role as Profile["role"],
      status: person.status as "active" | "inactive",
      monthlyPledge: 0, // Protected: individual pledge amounts hidden
      avatarColor: person.avatarColor as "peach" | "sage" | "blue" | "lavender" | "sand",
      unpaidMonths: 0,
      createdAt: person.createdAt.toISOString(),
      hasGoogleLinked: false,
      googleEmail: null,
      needsPinChange: false,
    }));

    return JSON.parse(JSON.stringify({
      profiles: publicProfiles,
      dues: [], // Private financial ledger
      events: unitEvents,
      procurements: [], // Private procurement ledger
      donations: [], // Private donor contributions
      circulars: notices,
      activities: [], // Private audit log
      currentUserId: "",
      openingBalance: 0,
    })) as WorkspaceData;
  }

  const now = new Date();
  const paymentSet = new Set(payments.map((p) => `${p.memberId}-${p.year}-${p.month}`));
  const roster = people.map((person) => {
    let unpaidMonths = 0;
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      if (date < new Date(person.createdAt.getFullYear(), person.createdAt.getMonth(), 1)) break;
      if (paymentSet.has(`${person.id}-${date.getFullYear()}-${date.getMonth() + 1}`)) break;
      unpaidMonths++;
    }
    const sanitized: Record<string, unknown> = {
      ...person,
      unpaidMonths,
      status: unpaidMonths >= 6 ? "inactive" : "active",
      hasGoogleLinked: Boolean(person.googleEmail),
      googleEmail: person.id === userId ? person.googleEmail : person.googleEmail ? "Linked" : null,
      needsPinChange: Boolean(person.needsPinChange),
    };
    delete sanitized.pin;
    delete sanitized.assignedPin;
    return sanitized as unknown as Profile;
  });
  return JSON.parse(JSON.stringify({
    profiles: roster, dues: payments, events: unitEvents, procurements: items, donations: contributions,
    circulars: notices, activities: feed, currentUserId: requestingUser.id,
    openingBalance: OPENING_BALANCE,
  })) as WorkspaceData;
}
