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
  const now = new Date();
  const requestingUser = people.find((p) => p.id === userId);
  const userIsAdmin = requestingUser?.role === "admin";
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
      assignedPin: person.id === userId ? person.pin : undefined,
    };
    delete sanitized.pin;
    return sanitized as unknown as Profile;
  });
  return JSON.parse(JSON.stringify({
    profiles: roster, dues: payments, events: unitEvents, procurements: items, donations: contributions,
    circulars: notices, activities: feed, currentUserId: people.some((p) => p.id === userId) ? userId : "",
    openingBalance: OPENING_BALANCE,
  })) as WorkspaceData;
}
