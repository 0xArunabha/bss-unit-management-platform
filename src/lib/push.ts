import webpush from "web-push";
import { db } from "@/db";
import { profiles, pushSubscriptions } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export function pushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

export async function sendPush(title: string, body: string, userId?: string, url = "/?view=procurement", volunteersOnly = false) {
  if (!pushConfigured()) return;
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
    const subscriptions = userId
      ? await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
      : volunteersOnly
        ? (await db.select({ subscription: pushSubscriptions }).from(pushSubscriptions).innerJoin(profiles, eq(pushSubscriptions.userId, profiles.id)).where(and(eq(profiles.status, "active"), inArray(profiles.role, ["admin", "organizer", "volunteer"])))).map((row) => row.subscription)
        : await db.select().from(pushSubscriptions);
    await Promise.allSettled(subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title, body, url }), { TTL: 3600, timeout: 4000, urgency: "high" });
      } catch (error) {
        if ([404, 410].includes((error as { statusCode?: number }).statusCode || 0)) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
        }
      }
    }));
  } catch (error) {
    // Communication is a best-effort side effect; a saved treasury record must remain successful.
    console.warn("Optional Web Push delivery unavailable:", error instanceof Error ? error.message : "Unknown provider error");
  }
}
