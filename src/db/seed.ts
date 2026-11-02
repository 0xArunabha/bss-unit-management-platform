import { identity } from "@/lib/identity";
import { db } from "@/db";
import { profiles, dues, events, procurements, donations, circulars, activities } from "@/db/schema";
import { REAL_MEMBERS } from "@/lib/demo-data";
import { and, eq, sql } from "drizzle-orm";

export const ADMIN_ID = "10000000-0000-4000-8000-000000000001";
export const OPENING_BALANCE = 24800;
let ready: Promise<void> | null = null;
const uid = (group: number, n: number) => `${group}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const sampleVenues = [
  { previous: "Jadavpur Vidyapith, Kolkata", location: `Community outreach venue, ${identity.city}` },
  { previous: "BSS Unit Office, Jadavpur", location: `${identity.name} meeting venue, ${identity.city}` },
  { previous: "Sukanta Setu Community Hall", location: `Community meeting point, ${identity.city}` },
  { previous: "Jadavpur Community Centre", location: `Workshop venue, ${identity.city}` },
];
const originalCircularContent = "Our National Science Day outreach is coming up. We invite every member to help make science accessible, joyful, and rooted in evidence.\n\nPlease reach the venue one hour before the programme. Demonstration volunteers should review the safety checklist and bring their assigned materials.\n\nTogether, we can build a culture that welcomes questions. Contact the unit secretary if you would like to join the outreach team.";
const unitCircularTitle = `Science for every ${identity.city} neighbourhood`;
const unitCircularContent = originalCircularContent.replace("Our National Science Day outreach", `${identity.name}’s ${identity.city} outreach`);

async function seed() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7428101)`);
    await tx.execute(sql`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        monthly_pledge NUMERIC(12, 2) NOT NULL DEFAULT 20,
        avatar_color TEXT NOT NULL DEFAULT 'peach',
        unpaid_months INTEGER NOT NULL DEFAULT 0,
        pin TEXT NOT NULL DEFAULT '1234',
        google_email TEXT,
        needs_pin_change BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin TEXT DEFAULT '1234';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_email TEXT;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS needs_pin_change BOOLEAN DEFAULT FALSE;
      UPDATE profiles SET pin = '1234' WHERE pin IS NULL;

      CREATE TABLE IF NOT EXISTS membership_dues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        dues_month INTEGER NOT NULL,
        dues_year INTEGER NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        payment_mode TEXT NOT NULL DEFAULT 'cash',
        collected_by UUID REFERENCES profiles(id),
        paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT member_month_year UNIQUE(member_id, dues_month, dues_year)
      );

      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        category TEXT NOT NULL,
        volunteers INTEGER NOT NULL DEFAULT 0,
        image TEXT NOT NULL DEFAULT '/images/science-outreach.jpg',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_procurements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        item_name TEXT NOT NULL,
        quantity TEXT NOT NULL,
        estimated_cost NUMERIC(12, 2) NOT NULL,
        actual_cost NUMERIC(12, 2),
        status TEXT NOT NULL DEFAULT 'needed',
        purchased_by UUID REFERENCES profiles(id),
        purchased_at TIMESTAMPTZ,
        receipt_photo_url TEXT,
        verified_by UUID REFERENCES profiles(id),
        verified_at TIMESTAMPTZ,
        created_by UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS donations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        donor_name TEXT NOT NULL,
        donor_phone TEXT,
        amount NUMERIC(12, 2) NOT NULL,
        event_id UUID REFERENCES events(id) ON DELETE SET NULL,
        payment_mode TEXT NOT NULL DEFAULT 'cash',
        transaction_ref TEXT,
        receipt_no TEXT NOT NULL UNIQUE,
        sms_sent BOOLEAN NOT NULL DEFAULT false,
        received_by UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS circulars (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        pinned BOOLEAN NOT NULL DEFAULT false,
        author_id UUID REFERENCES profiles(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        actor_id UUID REFERENCES profiles(id),
        target_id UUID,
        amount NUMERIC(12, 2),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    if ((await tx.select({ id: profiles.id }).from(profiles).limit(1)).length) {
      // Localize only untouched, fixed-ID sample records. Never reset user data or ledger history.
      for (const [index, venue] of sampleVenues.entries()) {
        await tx.update(events).set({ location: venue.location }).where(and(eq(events.id, uid(2, index + 1)), eq(events.location, venue.previous)));
      }
      await tx.update(donations).set({ donorName: `${identity.city} community supporters` }).where(and(eq(donations.id, uid(4, 2)), eq(donations.donorName, "Jadavpur Vidyapith")));
      // Align sample receipt numbering with the unit prefix. Only untouched, fixed-ID demo rows change.
      await tx.update(donations).set({ receiptNo: sql`replace(${donations.receiptNo}, 'BSS-', ${identity.receiptPrefix + "-"})` }).where(and(eq(donations.id, uid(4, 1)), sql`${donations.receiptNo} like 'BSS-%'`));
      for (const index of [2, 3, 4, 5, 6]) {
        await tx.update(donations).set({ receiptNo: sql`replace(${donations.receiptNo}, 'BSS-', ${identity.receiptPrefix + "-"})` }).where(and(eq(donations.id, uid(4, index)), sql`${donations.receiptNo} like 'BSS-%'`));
      }
      await tx.update(circulars).set({ title: unitCircularTitle, content: unitCircularContent }).where(and(eq(circulars.id, uid(5, 1)), eq(circulars.title, "Let’s take science to every neighbourhood"), eq(circulars.content, originalCircularContent)));
      const year = new Date().getFullYear();
      if ((await tx.select().from(dues).where(and(eq(dues.memberId, uid(1, 1)), eq(dues.month, 11), eq(dues.year, year)))).length === 0) {
        await tx.insert(dues).values([
          { memberId: uid(1, 1), month: 11, year, amount: 100, paymentMode: "upi", collectedBy: ADMIN_ID, paidAt: new Date(year, 9, 8) },
          { memberId: uid(1, 1), month: 12, year, amount: 100, paymentMode: "upi", collectedBy: ADMIN_ID, paidAt: new Date(year, 9, 8) },
          { memberId: uid(1, 2), month: 11, year, amount: 50, paymentMode: "cash", collectedBy: ADMIN_ID, paidAt: new Date(year, 9, 8) },
          { memberId: uid(1, 2), month: 12, year, amount: 50, paymentMode: "cash", collectedBy: ADMIN_ID, paidAt: new Date(year, 9, 8) },
        ]).onConflictDoNothing();
      }
      for (const member of REAL_MEMBERS) {
        await tx.execute(sql`UPDATE profiles SET pin = ${member.pin} WHERE id = ${member.id} AND (pin = '1234' OR pin IS NULL)`);
        await tx.execute(sql`UPDATE profiles SET full_name = ${member.fullName} WHERE id = ${member.id} AND full_name LIKE 'Member (%'`);
      }
      return;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000);
    const upcoming = (days: number, hour: number) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d; };

    const people = REAL_MEMBERS.map((m, idx) => ({
      id: m.id,
      fullName: m.fullName,
      phone: m.phone,
      role: m.role,
      status: "active",
      monthlyPledge: m.monthlyPledge,
      avatarColor: m.avatarColor,
      unpaidMonths: m.paid ? 0 : 1,
      pin: m.pin,
      googleEmail: null,
      needsPinChange: false,
      createdAt: new Date(year - 1, idx % 12, 10),
    }));
    await tx.insert(profiles).values(people);

    const payments: { memberId: string; month: number; year: number; amount: number; paymentMode: string; collectedBy: string; paidAt: Date }[] = [];
    for (const member of REAL_MEMBERS) {
      if (member.paid) {
        const maxMonth = ["admin", "organizer"].includes(member.role) ? Math.min(12, month + 1) : month;
        for (let m = 1; m <= maxMonth; m++) {
          payments.push({
            memberId: member.id,
            month: m,
            year,
            amount: member.monthlyPledge,
            paymentMode: member.role === "admin" ? "upi" : payments.length % 2 === 0 ? "cash" : "upi",
            collectedBy: ADMIN_ID,
            paidAt: new Date(year, m - 1, 8),
          });
        }
      } else {
        for (let m = 1; m < month; m++) {
          payments.push({
            memberId: member.id,
            month: m,
            year,
            amount: member.monthlyPledge,
            paymentMode: "cash",
            collectedBy: ADMIN_ID,
            paidAt: new Date(year, m - 1, 10),
          });
        }
      }
    }
    if (payments.length) await tx.insert(dues).values(payments);

    await tx.insert(events).values([
      { id: uid(2, 1), title: "National Science Day outreach", description: "Take science beyond the classroom. Join our hands-on demonstrations, a science quiz, and conversations on scientific temper. Volunteers meet one hour before the programme for setup.", location: sampleVenues[0].location, startsAt: upcoming(1, 10), category: "Outreach", volunteers: 18, image: "/images/science-outreach.jpg" },
      { id: uid(2, 2), title: "Unit volunteers’ meeting", description: "Our monthly gathering to review outreach plans, collect membership dues, and coordinate the next round of community programmes. All unit members are welcome.", location: sampleVenues[1].location, startsAt: upcoming(3, 17), category: "Unit meeting", volunteers: 24, image: "/images/conference.jpg" },
      { id: uid(2, 3), title: "A greener neighbourhood", description: "A community discussion on local environmental challenges, followed by a neighbourhood clean-up and awareness walk. Bring a reusable water bottle.", location: sampleVenues[2].location, startsAt: upcoming(6, 8), category: "Campaign", volunteers: 12, image: "/images/environment-campaign.jpg" },
      { id: uid(2, 4), title: "Science, not superstition", description: "An open demonstration and discussion exploring the science behind everyday ‘miracles’. Help us encourage curiosity, evidence, and questions.", location: sampleVenues[3].location, startsAt: upcoming(10, 15), category: "Workshop", volunteers: 9, image: "/images/science-march.jpg" },
    ]);

    await tx.insert(procurements).values([
      { id: uid(3, 1), eventId: uid(2, 1), itemName: "Science demonstration kits", quantity: "4 kits", estimatedCost: 2400, status: "needed", createdBy: uid(1, 6), createdAt: ago(35) },
      { id: uid(3, 2), eventId: uid(2, 1), itemName: "Printed outreach leaflets", quantity: "500 copies", estimatedCost: 800, status: "needed", createdBy: ADMIN_ID, createdAt: ago(90) },
      { id: uid(3, 3), eventId: uid(2, 1), itemName: "Extension boards & cables", quantity: "3 sets", estimatedCost: 1200, actualCost: 1080, status: "purchased", purchasedBy: uid(1, 3), purchasedAt: ago(75), createdBy: ADMIN_ID, createdAt: ago(200) },
      { id: uid(3, 4), eventId: uid(2, 1), itemName: "Volunteer badges", quantity: "30 pieces", estimatedCost: 450, actualCost: 420, status: "verified", purchasedBy: uid(1, 6), purchasedAt: ago(300), verifiedBy: uid(1, 9), verifiedAt: ago(120), createdBy: ADMIN_ID, createdAt: ago(480) },
      { id: uid(3, 5), eventId: uid(2, 3), itemName: "Reusable collection bags", quantity: "20 bags", estimatedCost: 600, status: "needed", createdBy: uid(1, 9), createdAt: ago(260) },
      { id: uid(3, 6), eventId: uid(2, 1), itemName: "Drinking water canisters", quantity: "2 × 20 litres", estimatedCost: 200, actualCost: 180, status: "purchased", purchasedBy: ADMIN_ID, purchasedAt: ago(180), createdBy: uid(1, 3), createdAt: ago(400) },
    ]);

    await tx.insert(donations).values([
      { id: uid(4, 1), donorName: "Jalpaiguri Science Club Patrons", donorPhone: null, amount: 5000, eventId: uid(2, 1), paymentMode: "upi", receiptNo: `${identity.receiptPrefix}-${year}-001`, receivedBy: ADMIN_ID, createdAt: ago(25) },
      { id: uid(4, 2), donorName: `${identity.city} community supporters`, donorPhone: null, amount: 3500, eventId: uid(2, 1), paymentMode: "bank_transfer", receiptNo: `${identity.receiptPrefix}-${year}-002`, receivedBy: uid(1, 6), createdAt: ago(1500) },
      { id: uid(4, 3), donorName: "North Bengal Teachers Forum", donorPhone: null, amount: 1000, eventId: null, paymentMode: "cash", receiptNo: `${identity.receiptPrefix}-${year}-003`, receivedBy: ADMIN_ID, createdAt: ago(2800) },
      { id: uid(4, 4), donorName: "Friends of Science Jalpaiguri", donorPhone: null, amount: 6000, eventId: uid(2, 3), paymentMode: "bank_transfer", receiptNo: `${identity.receiptPrefix}-${year}-004`, receivedBy: uid(1, 3), createdAt: ago(4200) },
      { id: uid(4, 5), donorName: "Town School Science Circle", donorPhone: null, amount: 2000, eventId: null, paymentMode: "upi", receiptNo: `${identity.receiptPrefix}-${year}-005`, receivedBy: ADMIN_ID, createdAt: ago(6000) },
      { id: uid(4, 6), donorName: "Local community collection", donorPhone: null, amount: 1000, eventId: uid(2, 1), paymentMode: "cash", receiptNo: `${identity.receiptPrefix}-${year}-006`, receivedBy: uid(1, 9), createdAt: ago(7200) },
    ]);

    await tx.insert(circulars).values([
      { id: uid(5, 1), title: unitCircularTitle, content: unitCircularContent, category: "Unit circular", pinned: true, authorId: ADMIN_ID, createdAt: ago(180) },
      { id: uid(5, 2), title: "February unit meeting: agenda & updates", content: "The next unit meeting will cover:\n\n1. Review of recent outreach activities\n2. Membership dues and treasury report\n3. Procurement and volunteer coordination\n4. Upcoming environmental campaign\n\nMembers can pay dues by cash, UPI, or bank transfer during the meeting. Advance contributions are welcome, with a minimum of ₹20 per month.", category: "Meeting agenda", authorId: uid(1, 6), createdAt: ago(1560) },
      { id: uid(5, 3), title: "New in the archive: demonstration handbook", content: "The volunteer resource archive now includes a practical guide for science demonstrations. It covers planning, participant safety, explaining evidence, and encouraging questions.\n\nVisit Science resources to explore the handbook, environmental outreach notes, and the conference poster archive.", category: "Resource update", authorId: uid(1, 3), createdAt: ago(3200) },
    ]);

    await tx.insert(activities).values([
      { type: "dues", title: "Membership contribution recorded", description: "Arunabha Ghosh collected monthly dues from Utsav Sen.", actorId: ADMIN_ID, targetId: uid(1, 2), amount: 50, createdAt: ago(25) },
      { type: "procurement", title: "Science demonstration kits needed", description: "Samarpan added 4 kits to tomorrow’s outreach checklist.", actorId: uid(1, 6), targetId: uid(3, 1), createdAt: ago(35) },
      { type: "dues", title: "Membership dues collected", description: "Pritam Sarkar paid his monthly contribution via UPI.", actorId: ADMIN_ID, amount: 50, createdAt: ago(55) },
      { type: "purchase", title: "Extension boards purchased", description: "Pritam logged the exact spend. Ready for peer verification.", actorId: uid(1, 3), targetId: uid(3, 3), amount: 1080, createdAt: ago(75) },
      { type: "verified", title: "Volunteer badges verified", description: "Udita verified Samarpan’s purchase at the venue. Complete!", actorId: uid(1, 9), targetId: uid(3, 4), amount: 420, createdAt: ago(120) },
    ]);
  });
}

export function ensureSeed() {
  if (!ready) ready = seed().catch((error) => { ready = null; throw error; });
  return ready;
}
