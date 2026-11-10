import { cookies, headers } from "next/headers";
import { getWorkspace } from "@/lib/workspace";
import Workspace from "@/components/workspace";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { auth } from "@/lib/auth";
import { db, isDatabaseConfigured } from "@/db";
import { profiles } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { resolveProfileFromGoogle } from "@/lib/google-identity";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let authenticatedUserId: string | null = null;
  let pendingGoogleEmail: string | null = null;

  if (isDatabaseConfigured) {
    try {
      const headerList = await headers();
      authenticatedUserId = await resolveProfileFromGoogle(headerList, db, profiles, { eq, and, isNull });
      if (!authenticatedUserId) {
        // Check if they are signed in with Google but not linked to a member profile
        const session = await auth.api.getSession({ headers: headerList });
        if (session?.user?.emailVerified) {
          pendingGoogleEmail = session.user.email.toLowerCase();
        }
      }
    } catch (err) {
      console.warn("[Auth] Better Auth session check skipped:", err);
    }
  }

  if (!authenticatedUserId) {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value || cookieStore.get("bss_demo_user")?.value;
    authenticatedUserId = await verifySessionToken(rawCookie);
  }

  const data = await getWorkspace(authenticatedUserId || undefined);
  return <Workspace initialData={data} initialGoogleEmail={pendingGoogleEmail} />;
}
