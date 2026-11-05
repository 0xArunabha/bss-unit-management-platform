import { identity } from "@/lib/identity";
import { NextRequest, NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { profiles, dues, events, procurements, donations, circulars, activities, actionIdempotency, claimCodes, membershipApplications, sessions, session as authSessions } from "@/db/schema";
import { ADMIN_ID, ensureSeed } from "@/db/seed";
import { getWorkspace } from "@/lib/workspace";
import { sendPush } from "@/lib/push";
import { sendDonationSms } from "@/lib/sms";
import { executeDemoAction } from "@/lib/demo-data";
import { SESSION_COOKIE_NAME, createSession, verifySession, verifySessionToken, destroySession } from "@/lib/session";
import { generateClaimCode, hashClaimCode, normalizeCode, checkClaimRateLimit, resetClaimRateLimit } from "@/lib/claim-codes";
import { and, eq, isNull, gt, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { getVerifiedGoogleIdentity } from "@/lib/google-identity";
import { isProductionRuntime } from "@/lib/runtime";
import { isUniqueViolation } from "@/lib/db-errors";

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

// Demo mode (in-memory data and a development-only sign-in) must never answer a production request.
// A production server without a database refuses every request instead of falling back to demo data.
const demoModeRefused = () => !isDatabaseConfigured && isProductionRuntime();
const notConfigured = () => {
  console.error("[Workspace] DATABASE_URL (or POSTGRES_URL) is not set; refusing to serve demo data in production.");
  return NextResponse.json({ error: "This service is not configured yet. Please try again later." }, { status: 503 });
};

export async function GET(request: NextRequest) {
  if (demoModeRefused()) return notConfigured();
  try {
    const rawCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value || request.cookies.get("bss_demo_user")?.value;
    let userId = await verifySessionToken(rawCookie);
    if (!userId && isDatabaseConfigured) {
      try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (session?.user) {
          const userSub = session.user.id;
          const userEmail = session.user.email.toLowerCase();
          let [matched] = await db.select().from(profiles).where(eq(profiles.googleSub, userSub));
          if (!matched && session.user.emailVerified) {
            const [unbound] = await db.select().from(profiles).where(
              and(eq(profiles.googleEmail, userEmail), isNull(profiles.googleSub))
            );
            if (unbound) {
              await db.update(profiles).set({ googleSub: userSub }).where(eq(profiles.id, unbound.id));
              matched = unbound;
            }
          }
          if (matched) userId = matched.id;
        }
      } catch {}
    }
    return NextResponse.json(await getWorkspace(userId || undefined));
  } catch (error) {
    console.error("[Workspace GET Error]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (demoModeRefused()) return notConfigured();
  try {
    const body = await request.json();
    const rawCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value || request.cookies.get("bss_demo_user")?.value;
    let userId = await verifySessionToken(rawCookie);
    if (!userId && isDatabaseConfigured) {
      try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (session?.user) {
          const userSub = session.user.id;
          const userEmail = session.user.email.toLowerCase();
          let [matched] = await db.select().from(profiles).where(eq(profiles.googleSub, userSub));
          if (!matched && session.user.emailVerified) {
            const [unbound] = await db.select().from(profiles).where(
              and(eq(profiles.googleEmail, userEmail), isNull(profiles.googleSub))
            );
            if (unbound) {
              await db.update(profiles).set({ googleSub: userSub }).where(eq(profiles.id, unbound.id));
              matched = unbound;
            }
          }
          if (matched) userId = matched.id;
        }
      } catch {}
    }
    // Actions that do not need an existing member session. Signing in is NOT one of them:
    // the only way in is a Google session linked to a member profile (see page.tsx / getWorkspace).
    const isPublicAction = ["claimInviteCode", "applyToJoin", "addDonation"].includes(body.action);

    if (body.action === "claimInviteCode") {
      const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1";
      const claimCheck = checkClaimRateLimit(clientIp);
      if (!claimCheck.allowed) {
        return NextResponse.json(
          { error: `Too many claim attempts. Please wait ${claimCheck.retryAfterSeconds} seconds.` },
          { status: 429, headers: { "Retry-After": String(claimCheck.retryAfterSeconds) } }
        );
      }
    }

    if (!isDatabaseConfigured) {
      if (!isPublicAction && !userId) {
        return NextResponse.json({ error: "Please log in to the workspace with your member account." }, { status: 401 });
      }
      const demoResult = await executeDemoAction(body.action, body, userId || "");
      const nextUser = demoResult.nextUser !== undefined ? demoResult.nextUser : (userId || "");
      const response = NextResponse.json({
        data: await getWorkspace(nextUser),
        message: `${demoResult.message} (Preview Mode: connect Supabase in .env.local for permanent database persistence)`,
        receiptId: demoResult.receiptId,
        claimCode: demoResult.claimCode,
      });
      if (nextUser) {
        const sessionToken = await createSession(nextUser);
        response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 86400 * 30,
          secure: process.env.NODE_ENV === "production" && request.nextUrl.protocol === "https:",
        });
      } else {
        if (rawCookie) await destroySession(rawCookie);
        response.cookies.delete(SESSION_COOKIE_NAME);
      }
      response.cookies.delete("bss_demo_user");
      return response;
    }

    await ensureSeed();
    let foundUser: typeof profiles.$inferSelect | undefined;
    if (userId) {
      try {
        const [found] = await db.select().from(profiles).where(eq(profiles.id, id(userId)));
        foundUser = found;
      } catch {
        foundUser = undefined;
      }
    }
    if (!isPublicAction && !foundUser) {
      return NextResponse.json({ error: "Please sign in with your member account." }, { status: 401 });
    }
    const user = foundUser!;

    // Idempotency check: prevent duplicate actions/double-booking on retries
    const idempotencyKey = typeof body.idempotencyKey === "string" && body.idempotencyKey.trim() ? body.idempotencyKey.trim() : null;
    if (idempotencyKey && user) {
      const [existingRecord] = await db.select().from(actionIdempotency).where(eq(actionIdempotency.key, idempotencyKey));
      if (existingRecord) {
        const cached = existingRecord.responsePayload ? JSON.parse(existingRecord.responsePayload) : null;
        return NextResponse.json({
          data: await getWorkspace(user.id),
          message: cached?.message || "Action already processed (idempotent duplicate request).",
          receiptId: cached?.receiptId,
        });
      }
    }

    const requireRole = (allowed: string[]) => {
      if (!user || !allowed.includes(user.role)) throw new Error("Your current role cannot perform this action.");
    };
    const log = async (type: string, title: string, description: string, targetId?: string, amount?: number) => {
      if (user) {
        await db.insert(activities).values({ type, title, description, actorId: user.id, targetId, amount });
      }
    };
    let message = "Saved successfully.";
    let receiptId: string | undefined;
    let nextUser = foundUser ? foundUser.id : "";
    switch (body.action) {
      case "logout": {
        nextUser = "";
        if (rawCookie) await destroySession(rawCookie);
        message = "You have logged out of the workspace.";
        break;
      }
      case "issueClaimCode": {
        requireRole(["admin"]);
        const targetId = id(body.memberId);
        const [target] = await db.select().from(profiles).where(eq(profiles.id, targetId));
        if (!target) throw new Error("Member not found.");
        // A code can only link a member who has no Google account yet. To replace a linked account (lost phone,
        // new Google account) an executive unlinks it first, which also ends that person's sessions.
        if (target.googleSub) throw new Error(`${target.fullName} is already linked to a Google account. Unlink it first, then issue a new code.`);
        const { code, hash } = generateClaimCode();
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
        // One live code per member: a new code cancels any unused older one.
        await db.delete(claimCodes).where(and(eq(claimCodes.memberId, target.id), isNull(claimCodes.claimedAt)));
        await db.insert(claimCodes).values({
          codeHash: hash,
          memberId: target.id,
          issuedBy: user.id,
          expiresAt,
        });
        await log("member", "Member invite code issued", `Issued single-use invite code for ${target.fullName}.`, target.id);
        message = `Single-use code issued for ${target.fullName}: ${code}. Valid for 14 days. Hand this over in person.`;
        nextUser = user.id;
        return NextResponse.json({
          data: await getWorkspace(user.id),
          message,
          claimCode: code,
        });
      }
      case "claimInviteCode": {
        // Who is asking comes from the signed-in Google session on the server. Anything the browser sends in the
        // body (googleSub, googleEmail) is ignored on purpose: a code only LINKS a verified Google account to a
        // member profile. It is not a password and never signs anyone in by itself.
        const google = await getVerifiedGoogleIdentity(request.headers);
        if (!google) {
          return NextResponse.json({ error: "Please sign in with Google first, then enter your member code." }, { status: 401 });
        }
        const perUser = checkClaimRateLimit(`user:${google.sub}`);
        if (!perUser.allowed) {
          return NextResponse.json(
            { error: `Too many attempts. Please wait ${perUser.retryAfterSeconds} seconds.` },
            { status: 429, headers: { "Retry-After": String(perUser.retryAfterSeconds) } }
          );
        }
        const normalized = normalizeCode(String(body.code || ""));
        if (normalized.length !== 8) throw new Error("Please enter your 8-character member code.");
        const hash = hashClaimCode(normalized);

        const [alreadyLinked] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.googleSub, google.sub));
        if (alreadyLinked) throw new Error("This Google account is already linked to a member profile.");

        // One message for every way a code can fail, so the form cannot be used to find out which codes exist.
        const invalidCode = "This code is not valid, has already been used, or has expired. Please ask an executive for a new one.";
        const [record] = await db.select().from(claimCodes).where(eq(claimCodes.codeHash, hash));
        if (!record || record.claimedAt || record.expiresAt.getTime() < Date.now()) throw new Error(invalidCode);
        const [target] = await db.select().from(profiles).where(eq(profiles.id, record.memberId));
        if (!target) throw new Error(invalidCode);
        if (target.googleSub) throw new Error("This member is already linked to a Google account. An executive must unlink it first.");

        // Single use has to hold even when two requests arrive together: the UPDATE only succeeds while the code is
        // still unused, and the profile link is written in the same transaction.
        try {
          await db.transaction(async (tx) => {
            const [won] = await tx.update(claimCodes)
              .set({ claimedAt: new Date(), claimedByGoogleSub: google.sub })
              .where(and(eq(claimCodes.id, record.id), isNull(claimCodes.claimedAt)))
              .returning();
            if (!won) throw new Error(invalidCode);
            await tx.update(profiles).set({ googleSub: google.sub, googleEmail: google.email }).where(eq(profiles.id, target.id));
          });
        } catch (error) {
          // The database allows one profile per Google account, even when two requests get past the check above
          // together. The transaction has rolled back, so this code is still unused.
          if (isUniqueViolation(error)) throw new Error("This Google account is already linked to a member profile.");
          throw error;
        }
        resetClaimRateLimit(`user:${google.sub}`);
        await db.insert(activities).values({
          type: "member",
          title: "Member code claimed",
          description: `${target.fullName} linked a Google account (${google.email}).`,
          actorId: target.id,
          targetId: target.id,
        });
        // The Google session is the login. No second cookie is created here.
        return NextResponse.json({
          data: await getWorkspace(target.id),
          message: `Welcome to Breakthrough Science Society, ${target.fullName}! Your Google account has been linked.`,
        });
      }
      case "unlinkGoogle": {
        requireRole(["admin"]);
        const targetId = id(body.memberId);
        const [target] = await db.select().from(profiles).where(eq(profiles.id, targetId));
        if (!target) throw new Error("Member not found.");
        if (target.id === user.id) throw new Error("You cannot unlink your own account. Ask another executive, or run the setup script with --reset.");
        const oldSub = target.googleSub;
        await db.update(profiles).set({ googleSub: null, googleEmail: null }).where(eq(profiles.id, target.id));
        // Cancel unused codes, but keep the record of codes that were already claimed.
        await db.delete(claimCodes).where(and(eq(claimCodes.memberId, target.id), isNull(claimCodes.claimedAt)));
        // Unlinking must also sign the person out everywhere: old-style cookie sessions and Google sessions.
        await db.delete(sessions).where(eq(sessions.userId, target.id));
        if (oldSub) await db.delete(authSessions).where(eq(authSessions.userId, oldSub));
        await log("member", "Google account unlinked", `Executive unlinked Google account for ${target.fullName}.`, target.id);
        message = `Google account unlinked for ${target.fullName}. A fresh invite code can now be issued.`;
        nextUser = user.id;
        break;
      }
      case "applyToJoin": {
        // Same rule as the claim: the applicant's Google identity comes from the server-side session only.
        const google = await getVerifiedGoogleIdentity(request.headers);
        if (!google) {
          return NextResponse.json({ error: "Please sign in with Google before applying." }, { status: 401 });
        }
        const [linked] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.googleSub, google.sub));
        if (linked) throw new Error("This Google account is already linked to a member profile.");
        const [waiting] = await db.select({ id: membershipApplications.id }).from(membershipApplications)
          .where(and(eq(membershipApplications.googleSub, google.sub), eq(membershipApplications.status, "pending")));
        if (waiting) throw new Error("You already have an application waiting for review.");
        const fullName = text(body.fullName, "full name", 150);
        const phone = text(body.phone, "phone number", 30);
        const reason = text(body.reason, "reason", 1000);
        const isMinor = Boolean(body.isMinor);
        const guardianName = body.guardianName ? text(body.guardianName, "guardian name", 150) : null;
        if (isMinor && !guardianName) throw new Error("Applicants under 18 must give a parent or guardian name.");
        await db.insert(membershipApplications).values({
          googleSub: google.sub,
          googleEmail: google.email,
          fullName,
          phone,
          isMinor,
          guardianName,
          reason,
          status: "pending",
        });
        message = "Your membership application has been received. Unit executives will review and approve your request.";
        break;
      }
      case "reviewApplication": {
        requireRole(["admin"]);
        const appId = id(body.applicationId);
        const status = body.status === "approved" ? "approved" : "rejected";
        // One transaction: if anything below fails, the application goes back to "pending" instead of being left
        // marked as approved with no member created.
        const reviewed = await db.transaction(async (tx) => {
          const [app] = await tx
            .update(membershipApplications)
            .set({ status, reviewedBy: user.id })
            .where(and(eq(membershipApplications.id, appId), eq(membershipApplications.status, "pending")))
            .returning();
          if (!app) throw new Error("Application not found or has already been reviewed.");
          if (status !== "approved") return { app, newProfile: null };
          const [alreadyLinked] = await tx.select().from(profiles).where(eq(profiles.googleSub, app.googleSub));
          if (alreadyLinked) {
            throw new Error(`This applicant's Google account is already linked to ${alreadyLinked.fullName}.`);
          }
          try {
            const [newProfile] = await tx.insert(profiles).values({
              fullName: app.fullName,
              phone: app.phone,
              role: "member",
              status: "active",
              monthlyPledge: 20,
              avatarColor: ["peach", "sage", "blue", "lavender"][Math.floor(Math.random() * 4)],
              googleSub: app.googleSub,
              googleEmail: app.googleEmail,
              isMinor: app.isMinor,
            }).returning();
            return { app, newProfile };
          } catch (error) {
            if (isUniqueViolation(error)) throw new Error("This applicant's Google account is already linked to a member profile.");
            throw error;
          }
        });
        if (reviewed.newProfile) {
          await log("member", "Membership application approved", `${reviewed.app.fullName} has joined as a unit member.`, reviewed.newProfile.id);
          message = `Application approved! ${reviewed.app.fullName} has been enrolled as a member.`;
        } else {
          message = `Application from ${reviewed.app.fullName} was rejected.`;
        }
        nextUser = user.id;
        break;
      }
      case "checkMemberDues": {
        if (!user) {
          return NextResponse.json({ error: "Please log in to look up dues." }, { status: 401 });
        }
        const memberId = id(body.memberId);
        if (user.role === "member" && memberId !== user.id) {
          return NextResponse.json({ error: "Members may only inspect their own dues." }, { status: 403 });
        }
        const [target] = await db.select().from(profiles).where(eq(profiles.id, memberId));
        if (!target) throw new Error("Member not found.");
        return NextResponse.json({
          memberId: target.id,
          fullName: target.fullName,
          monthlyPledge: Number(target.monthlyPledge || 20),
          unpaidMonths: target.unpaidMonths,
        });
      }
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

          // Check if this action was already processed by unique idempotencyKey
          if (idempotencyKey && existing.some((d) => d.idempotencyKey === idempotencyKey)) {
            message = `₹${total.toLocaleString("en-IN")} already recorded (idempotent duplicate request).`;
            return;
          }

          const occupied = new Set(existing.map((d) => `${d.year}-${d.month}`));

          // Check if this starting month is already paid (prevent double booking)
          if (occupied.has(`${y}-${m}`)) {
            const recent = existing.find(
              (d) => d.year === y && d.month === m &&
                     Date.now() - new Date(d.paidAt).getTime() < 30000
            );
            if (recent) {
              message = `₹${total.toLocaleString("en-IN")} already recorded (idempotent retry).`;
              return;
            }
            throw new Error(`Dues for ${m}/${y} have already been recorded for ${member.fullName}. Please refresh the dues ledger.`);
          }

          let remaining = total;
          let guard = 0;
          const allocations: { memberId: string; month: number; year: number; amount: number; paymentMode: string; collectedBy: string; idempotencyKey?: string | null }[] = [];
          while (remaining > 0 && guard < 1200) {
            guard++;
            if (!occupied.has(`${y}-${m}`)) {
              let amount = Math.min(monthly, remaining);
              if (remaining - amount > 0 && remaining - amount < 20) amount = remaining;
              allocations.push({ memberId, month: m, year: y, amount, paymentMode, collectedBy: user.id, idempotencyKey });
              remaining = Math.round((remaining - amount) * 100) / 100;
            }
            m = m === 12 ? 1 : m + 1;
            if (m === 1) y++;
          }
          if (remaining > 0) throw new Error("That contribution covers too many months. Please split the payment.");
          count = allocations.length;
          await tx.insert(dues).values(allocations);
          const allMemberPayments = await tx.select().from(dues).where(eq(dues.memberId, memberId));
          const memPaymentSet = new Set(allMemberPayments.map((p) => `${p.year}-${p.month}`));
          let remainingUnpaid = 0;
          const now = new Date();
          for (let i = 0; i < 24; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            if (d < new Date(member.createdAt.getFullYear(), member.createdAt.getMonth(), 1)) break;
            if (memPaymentSet.has(`${d.getFullYear()}-${d.getMonth() + 1}`)) break;
            remainingUnpaid++;
          }
          await tx.update(profiles).set({
            status: remainingUnpaid >= 6 ? "inactive" : "active",
            unpaidMonths: remainingUnpaid,
          }).where(eq(profiles.id, memberId));
        });
        message = `₹${total.toLocaleString("en-IN")} recorded across ${count} ${count === 1 ? "month" : "months"}.`;
        await log("dues", "Membership contribution recorded", `${member.fullName} contributed via ${paymentMode.replace("_", " ")}. Collected by ${user.fullName}.`, memberId, total);
        await sendPush("Membership dues received", `${message} Thank you for supporting science.`, memberId, "/?view=dues");
        break;
      }
      case "addDonation": {
        // Public visitors, members, volunteers, and executives can all donate
        const donorName = text(body.donorName, "donor name", 150);
        const amount = number(body.amount, "Donation", 0.01);
        const phone = typeof body.donorPhone === "string" ? body.donorPhone.trim() : "";
        if (phone && !/^\+?[\d\s-]{10,16}$/.test(phone)) throw new Error("Please enter a valid phone number, or leave it blank.");
        const [donation] = await db.insert(donations).values({
          donorName,
          amount,
          donorPhone: phone || null,
          eventId: body.eventId ? id(body.eventId) : null,
          paymentMode: mode(body.paymentMode),
          transactionRef: body.transactionRef ? text(body.transactionRef, "reference", 100) : null,
          receiptNo: `${identity.receiptPrefix}-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          receivedBy: user ? user.id : null,
          idempotencyKey,
        }).returning();
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
        const updateData: { donorPhone: string; smsSent?: boolean } = { donorPhone: phone };
        if (!smsResult.simulated && smsResult.success) {
          updateData.smsSent = true;
        }
        await db.update(donations).set(updateData).where(eq(donations.id, donationId));
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
        const isMinor = Boolean(body.isMinor);
        const [member] = await db.insert(profiles).values({
          fullName: text(body.fullName, "member name", 150),
          phone: body.phone ? text(body.phone, "phone", 30) : null,
          role,
          monthlyPledge: number(body.monthlyPledge || 20, "Monthly pledge", 20),
          avatarColor: ["peach", "sage", "blue", "lavender"][Math.floor(Math.random() * 4)],
          isMinor,
        }).returning();

        const { code, hash } = generateClaimCode();
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        await db.insert(claimCodes).values({
          codeHash: hash,
          memberId: member.id,
          issuedBy: user.id,
          expiresAt,
        });
        await log("member", "Our community is growing", `${member.fullName} joined ${identity.name}, ${identity.unit}.`, member.id);
        message = `Welcome! ${member.fullName} added. Single-use invite code: ${code}. Hand this over in person.`;
        return NextResponse.json({
          data: await getWorkspace(user.id),
          message,
          claimCode: code,
        });
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
      default: throw new Error("Unknown workspace action.");
    }

    // Persist idempotency record if client provided an action idempotency key
    if (idempotencyKey && user) {
      await db.insert(actionIdempotency).values({
        key: idempotencyKey,
        action: body.action,
        userId: user.id,
        responsePayload: JSON.stringify({ message, receiptId }),
      }).onConflictDoNothing();
    }

    const response = NextResponse.json({ data: await getWorkspace(nextUser), message, receiptId });
    if (nextUser) {
      const sessionToken = await createSession(nextUser);
      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 86400 * 30,
        secure: process.env.NODE_ENV === "production" && request.nextUrl.protocol === "https:",
      });
    } else {
      if (rawCookie) await destroySession(rawCookie);
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete("better-auth.session_token");
      response.cookies.delete("__Secure-better-auth.session_token");
    }
    response.cookies.delete("bss_demo_user");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
    console.error("Workspace action:", message);
    const safe = message.includes("violates") || message.includes("query:") || message.includes("invalid input") ? "Unable to save. Please check the details and try again." : message;
    return NextResponse.json({ error: safe }, { status: 400 });
  }
}
