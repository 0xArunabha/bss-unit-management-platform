import { cookies, headers } from "next/headers";
import { getWorkspace } from "@/lib/workspace";
import Workspace from "@/components/workspace";
import { Suspense } from "react";
import BootSplash, { SplashReady } from "@/components/boot-splash";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { auth } from "@/lib/auth";
import { db, isDatabaseConfigured } from "@/db";
import { profiles } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { resolveProfileFromGoogle } from "@/lib/google-identity";
import { LOCALE_COOKIE, parseLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

// The splash is sent first, before the data below is ready, so it is already on screen while the server works.
// <SplashReady /> tells it when the workspace has mounted and it can be revealed.
export default function HomePage() {
  return (
    <>
      <BootSplash />
      <Suspense fallback={null}>
        <Home />
      </Suspense>
    </>
  );
}

async function Home() {
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

  const cookieStore = await cookies();
  // The saved language is in a cookie so the very first paint is already in the right language.
  const initialLocale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  if (!authenticatedUserId) {
    const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value || cookieStore.get("bss_demo_user")?.value;
    authenticatedUserId = await verifySessionToken(rawCookie);
  }

  const data = await getWorkspace(authenticatedUserId || undefined);
  return (
    <>
      <Workspace initialData={data} initialGoogleEmail={pendingGoogleEmail} initialLocale={initialLocale} />
      <SplashReady />
    </>
  );
}
