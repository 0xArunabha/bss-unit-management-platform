import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { ADMIN_ID, ensureSeed } from "@/db/seed";
import { pushConfigured } from "@/lib/push";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ configured: pushConfigured(), publicKey: process.env.VAPID_PUBLIC_KEY || null });
}
export async function POST(request: NextRequest) {
  if (!pushConfigured()) return NextResponse.json({ error: "Web Push is not configured on this server. In-app alerts remain available." }, { status: 503 });
  try {
    await ensureSeed();
    const body = await request.json();
    const hostname = new URL(body.endpoint).hostname;
    if (!["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"].includes(hostname) && !hostname.endsWith(".push.apple.com") && !hostname.endsWith(".notify.windows.com")) throw new Error("Unsupported push endpoint.");
    if (!body.keys?.p256dh || !body.keys?.auth) throw new Error("Invalid subscription.");
    await db.insert(pushSubscriptions).values({ userId: request.cookies.get("bss_demo_user")?.value || ADMIN_ID, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth }).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { p256dh: body.keys.p256dh, auth: body.keys.auth, userId: request.cookies.get("bss_demo_user")?.value || ADMIN_ID } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to register this browser for push notifications." }, { status: 400 });
  }
}
