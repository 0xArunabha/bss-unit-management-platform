import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { pushConfigured } from "@/lib/push";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ configured: pushConfigured(), publicKey: process.env.VAPID_PUBLIC_KEY || null });
}
export async function POST(request: NextRequest) {
  if (!pushConfigured()) return NextResponse.json({ error: "Web Push is not configured on this server. In-app alerts remain available." }, { status: 503 });
  try {
    const rawCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value || request.cookies.get("bss_demo_user")?.value;
    const userId = await verifySessionToken(rawCookie);
    if (!userId) {
      return NextResponse.json({ error: "Please log in to the workspace to enable push notifications." }, { status: 401 });
    }

    await ensureSeed();
    const body = await request.json();
    const hostname = new URL(body.endpoint).hostname;
    if (!["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"].includes(hostname) && !hostname.endsWith(".push.apple.com") && !hostname.endsWith(".notify.windows.com")) throw new Error("Unsupported push endpoint.");
    if (!body.keys?.p256dh || !body.keys?.auth) throw new Error("Invalid subscription.");
    await db.insert(pushSubscriptions).values({ userId, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth }).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { p256dh: body.keys.p256dh, auth: body.keys.auth, userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to register this browser for push notifications." }, { status: 400 });
  }
}
