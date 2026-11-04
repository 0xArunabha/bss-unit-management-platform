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
