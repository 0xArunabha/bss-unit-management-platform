import { auth } from "@/lib/auth";

export interface GoogleIdentity {
  /** Better Auth user id: exactly one per Google account. This is what profiles.google_sub stores. */
  sub: string;
  /** Lower-cased e-mail address that Google has verified. */
  email: string;
  name: string;
}

/**
 * The only trusted answer to "which Google account is making this request?".
 *
 * It reads the Better Auth session from the request cookies on the server. Never use googleSub or
 * googleEmail values that arrive in a request body: the browser can send anything it likes there.
 * Returns null when nobody is signed in with Google, or when Google has not verified the e-mail.
 */
export async function getVerifiedGoogleIdentity(headers: Headers): Promise<GoogleIdentity | null> {
  try {
    const session = await auth.api.getSession({ headers });
    const user = session?.user;
    if (!user?.id || !user.email || !user.emailVerified) return null;
    return { sub: user.id, email: user.email.toLowerCase(), name: user.name || "" };
  } catch {
    return null;
  }
}

/**
 * Resolves a Google identity to a member profile id.
 *
 * Primary match: strictly by unique immutable googleSub.
 * First-bind fallback: if no match and emailVerified, bind a profile that has
 * googleEmail set but no googleSub. The update guards with isNull(googleSub)
 * so a concurrent bind cannot overwrite.
 *
 * Returns the member profile id or null.
 */
export async function resolveProfileFromGoogle(
  headers: Headers,
  db: any,
  profiles: any,
  ops: { eq: any; and: any; isNull: any }
): Promise<string | null> {
  const identity = await getVerifiedGoogleIdentity(headers);
  if (!identity) return null;
  const { eq, and, isNull } = ops;
  // Primary match: immutable googleSub
  let [matched] = await db.select().from(profiles).where(eq(profiles.googleSub, identity.sub));
  if (!matched) {
    // First-bind: email match only if profile has no googleSub yet
    const [unbound] = await db.select().from(profiles).where(
      and(eq(profiles.googleEmail, identity.email), isNull(profiles.googleSub))
    );
    if (unbound) {
      await db.update(profiles).set({ googleSub: identity.sub })
        .where(and(eq(profiles.id, unbound.id), isNull(profiles.googleSub)));
      matched = unbound;
    }
  }
  return matched?.id || null;
}
