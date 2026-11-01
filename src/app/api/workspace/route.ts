import { identity } from "@/lib/identity";
import { NextRequest, NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { profiles, dues, events, procurements, donations, circulars, activities } from "@/db/schema";
import { ADMIN_ID, ensureSeed } from "@/db/seed";
import { getWorkspace } from "@/lib/workspace";
import { sendPush } from "@/lib/push";
import { sendDonationSms } from "@/lib/sms";
import { executeDemoAction } from "@/lib/demo-data";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";
const text = (value: unknown, label: string, max = 300) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error(`Please enter a valid ${label}.`);
  return value.trim();
};
const number = (value: unknown, label: string, min = 0, max = 10000000) => {
  const n = Number(value);
  if (value === "" || value == null || !Number.isFinite(n) || Math.abs(n * 100 - Math.round(n * 100)) > 0.000001 || n < min || n > max) throw new Error(`${label} must be between ${min} and ${max}, with at most two decimal places.`);
  return Math.round(n * 100) / 100;
};
const whole = (value: unknown, label: string, min: number, max: number) => {
  const n = number(value, label, min, max);
  if (!Number.isInteger(n)) throw new Error(`${label} must be a whole number.`);
  return n;
};
const id = (value: unknown) => {
  const v = text(value, "selection", 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) throw new Error("Please choose a valid record.");
  return v;
};
const mode = (value: unknown) => {
  if (!["cash", "upi", "bank_transfer"].includes(String(value))) throw new Error("Choose a payment method.");
  return String(value);
};

export async function GET(request: NextRequest) {
  return NextResponse.json(await getWorkspace(request.cookies.get("bss_demo_user")?.value));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.cookies.get("bss_demo_user")?.value || ADMIN_ID;

    if (!isDatabaseConfigured) {
      const demoResult = await executeDemoAction(body.action, body, userId);
      const nextUser = demoResult.nextUser || userId;
      const response = NextResponse.json({
        data: await getWorkspace(nextUser),
        message: `${demoResult.message} (Preview Mode: connect Supabase in .env.local for permanent database persistence)`,
        receiptId: demoResult.receiptId,
      });
      response.cookies.set("bss_demo_user", nextUser, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 86400 * 7,
      });
      return response;
    }

    await ensureSeed();
    const [user] = await db.select().from(profiles).where(eq(profiles.id, id(userId)));
    if (!user) return NextResponse.json({ error: "This workspace session is unavailable." }, { status: 401 });
    const requireRole = (allowed: string[]) => { if (!allowed.includes(user.role)) throw new Error("Your current role cannot perform this action. Switch to an executive or organizer in Settings."); };
    const log = async (type: string, title: string, description: string, targetId?: string, amount?: number) => {
      await db.insert(activities).values({ type, title, description, actorId: user.id, targetId, amount });
    };
    let message = "Saved successfully.";
    let receiptId: string | undefined;
    let nextUser = user.id;
    switch (body.action) {
      case "collectDues": {
        requireRole(["admin", "organizer", "volunteer"]);
        const memberId = id(body.memberId);
        const [member] = await db.select().from(profiles).where(eq(profiles.id, memberId));
        if (!member) throw new Error("Member not found.");
        const total = number(body.amount, "Contribution", 20, 1000000);
        const monthly = number(body.monthlyAmount, "Monthly contribution", 20, 1000000);
        let m = whole(body.month, "Month", 1, 12);
        let y = whole(body.year, "Year", 2024, 2100);
        const paymentMode = mode(body.paymentMode);
        let count = 0;
        await db.transaction(async (tx) => {
          await tx.execute((await import("drizzle-orm")).sql`select pg_advisory_xact_lock(hashtext(${memberId}))`);
          const existing = await tx.select().from(dues).where(eq(dues.memberId, memberId));
          const occupied = new Set(existing.map((d) => `${d.year}-${d.month}`));
          let remaining = total;
          let guard = 0;
          const allocations: { memberId: string; month: number; year: number; amount: number; paymentMode: string; collectedBy: string }[] = [];
          while (remaining > 0 && guard < 1200) {
            guard++;
            if (!occupied.has(`${y}-${m}`)) {
              let amount = Math.min(monthly, remaining);
              if (remaining - amount > 0 && remaining - amount < 20) amount = remaining;
              allocations.push({ memberId, month: m, year: y, amount, paymentMode, collectedBy: user.id });
              remaining = Math.round((remaining - amount) * 100) / 100;
            }
            m = m === 12 ? 1 : m + 1;
            if (m === 1) y++;
          }
          if (remaining > 0) throw new Error("That contribution covers too many months. Please split the payment.");
          count = allocations.length;
          await tx.insert(dues).values(allocations);
          await tx.update(profiles).set({ status: "active", unpaidMonths: 0 }).where(eq(profiles.id, memberId));
        });
        message = `₹${total.toLocaleString("en-IN")} recorded across ${count} ${count === 1 ? "month" : "months"}.`;
        await log("dues", "Membership contribution recorded", `${member.fullName} contributed via ${paymentMode.replace("_", " ")}. Collected by ${user.fullName}.`, memberId, total);
        await sendPush("Membership dues received", `${message} Thank you for supporting science.`, memberId, "/?view=dues");
        break;
      }
      case "addDonation": {
        requireRole(["admin", "organizer", "volunteer"]);
        const donorName = text(body.donorName, "donor name", 150);
        const amount = number(body.amount, "Donation", 0.01);
        const phone = typeof body.donorPhone === "string" ? body.donorPhone.trim() : "";
        if (phone && !/^\+?[\d\s-]{10,16}$/.test(phone)) throw new Error("Please enter a valid phone number, or leave it blank.");
        const [donation] = await db.insert(donations).values({ donorName, amount, donorPhone: phone || null, eventId: body.eventId ? id(body.eventId) : null, paymentMode: mode(body.paymentMode), transactionRef: body.transactionRef ? text(body.transactionRef, "reference", 100) : null, receiptNo: `${identity.receiptPrefix}-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`, receivedBy: user.id }).returning();
        receiptId = donation.id;
        await log("donation", "A new contribution to the movement", `${donorName} made a donation. A digital receipt is ready.`, donation.id, amount);
        message = "Donation recorded. Your shareable receipt is ready.";
        break;
      }
      case "sendSms": {
        requireRole(["admin", "organizer", "volunteer"]);
        const donationId = id(body.id);
        const [donation] = await db.select().from(donations).where(eq(donations.id, donationId));
        if (!donation) throw new Error("Donation record not found.");
        const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : donation.donorPhone;
        const origin = request.nextUrl.origin;
        const smsResult = await sendDonationSms({
          donorName: donation.donorName,
          donorPhone: phone,
          amount: donation.amount,
          receiptNo: donation.receiptNo,
          receiptId: donation.id,
          origin,
        });
        await db.update(donations).set({ smsSent: true, donorPhone: phone }).where(eq(donations.id, donationId));
        await log("sms", "SMS receipt dispatched", `${smsResult.message} (${donation.receiptNo})`, donation.id, donation.amount);
        message = smsResult.message;
        break;
      }
      case "addProcurement": {
        requireRole(["admin", "organizer", "volunteer"]);
        const eventId = id(body.eventId);
        const [event] = await db.select().from(events).where(eq(events.id, eventId));
        if (!event) throw new Error("Choose an event first.");
        const itemName = text(body.itemName, "item name", 150);
        const [item] = await db.insert(procurements).values({ eventId, itemName, quantity: text(body.quantity, "quantity", 80), estimatedCost: number(body.estimatedCost, "Estimated cost"), createdBy: user.id }).returning();
        await log("procurement", `${itemName} needed`, `${user.fullName} added an item for ${event.title}.`, item.id);
        if (event.startsAt.getTime() - Date.now() <= 48 * 3600000 && event.startsAt.getTime() >= Date.now() - 24 * 3600000) await sendPush("Urgent: outreach materials needed", `${itemName} · ${event.title}`, undefined, "/?view=procurement", true);
        message = "Item added to the event checklist.";
        break;
      }
      case "purchase": {
        requireRole(["admin", "organizer", "volunteer"]);
        const itemId = id(body.id);
        const actualCost = number(body.actualCost, "Exact amount paid");
        const [item] = await db.update(procurements).set({ status: "purchased", actualCost, purchasedBy: user.id, purchasedAt: new Date() }).where(and(eq(procurements.id, itemId), eq(procurements.status, "needed"))).returning();
        if (!item) throw new Error("This item has already been purchased. Refresh the checklist.");
        await log("purchase", `${item.itemName} purchased`, `${user.fullName} logged the exact spend. A second volunteer can now verify it.`, item.id, actualCost);
        message = "Purchase recorded. Ready for independent peer verification.";
        break;
      }
      case "verify": {
        requireRole(["admin", "organizer", "volunteer"]);
        const itemId = id(body.id);
        const [existing] = await db.select().from(procurements).where(eq(procurements.id, itemId));
        if (!existing || existing.status !== "purchased") throw new Error("Only purchased items can be verified.");
        if (existing.purchasedBy === user.id) throw new Error("A different volunteer must verify your purchase.");
        const [item] = await db.update(procurements).set({ status: "verified", verifiedBy: user.id, verifiedAt: new Date() }).where(and(eq(procurements.id, itemId), eq(procurements.status, "purchased"))).returning();
        if (!item) throw new Error("This item has already been verified.");
        await log("verified", `${item.itemName} verified`, `${user.fullName} inspected the purchase. This item is complete and closed.`, item.id, item.actualCost || 0);
        await sendPush("Purchase verified", `${user.fullName} verified ${item.itemName}. Thank you!`, item.purchasedBy!);
        message = "Item verified and closed. No further approval needed.";
        break;
      }
      case "addMember": {
        requireRole(["admin"]);
        const role = ["member", "volunteer", "organizer", "admin"].includes(body.role) ? body.role : "member";
        const [member] = await db.insert(profiles).values({ fullName: text(body.fullName, "member name", 150), phone: body.phone ? text(body.phone, "phone", 30) : null, role, monthlyPledge: number(body.monthlyPledge || 20, "Monthly pledge", 20), avatarColor: ["peach", "sage", "blue", "lavender"][Math.floor(Math.random() * 4)] }).returning();
        await log("member", "Our community is growing", `${member.fullName} joined ${identity.name}, ${identity.unit}.`, member.id);
        message = "Welcome! The new member has been added.";
        break;
      }
      case "createEvent": {
        requireRole(["admin", "organizer"]);
        const startsAt = new Date(String(body.startsAt));
        if (isNaN(startsAt.getTime())) throw new Error("Choose a valid date and time.");
        const [event] = await db.insert(events).values({ title: text(body.title, "event title", 150), description: text(body.description, "description", 4000), location: text(body.location, "venue", 200), startsAt, category: text(body.category || "Outreach", "category", 50) }).returning();
        await log("event", "A new opportunity to get involved", `${event.title} has been added to the unit calendar.`, event.id);
        message = "Event published to the unit calendar.";
        break;
      }
      case "publishCircular": {
        requireRole(["admin", "organizer"]);
        const [notice] = await db.insert(circulars).values({ title: text(body.title, "title", 150), content: text(body.content, "notice", 10000), category: text(body.category || "Unit circular", "category", 50), pinned: Boolean(body.pinned), authorId: user.id }).returning();
        await log("circular", notice.title, "A new circular has been published to the notice board.", notice.id);
        if (body.category === "Urgent update") await sendPush(notice.title, notice.content.slice(0, 180), undefined, "/?view=circulars");
        message = "Your notice is on the board.";
        break;
      }
      case "switchUser": {
        const selectedId = id(body.userId);
        const [selected] = await db.select().from(profiles).where(eq(profiles.id, selectedId));
        if (!selected) throw new Error("Member not found.");
        nextUser = selected.id;
        message = `Now previewing as ${selected.fullName}.`;
        break;
      }
      default: throw new Error("Unknown workspace action.");
    }
    const response = NextResponse.json({ data: await getWorkspace(nextUser), message, receiptId });
    response.cookies.set("bss_demo_user", nextUser, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 86400 * 7, secure: process.env.NODE_ENV === "production" && request.nextUrl.protocol === "https:" });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
    console.error("Workspace action:", message);
    const safe = message.includes("violates") || message.includes("query:") || message.includes("invalid input") ? "Unable to save. Please check the details and try again." : message;
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
