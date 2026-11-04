import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { isProductionRuntime } from "@/lib/runtime";

// Fail closed. In production the server refuses to start without its own secret and its public URL.
// There is deliberately no built-in fallback: a default that lives in the source code is a key everyone can read.
const production = isProductionRuntime();

function setting(name: string): string | undefined {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (production) throw new Error(`${name} is not set. It is required in production (see .env.example).`);
  return undefined;
}

function checkedUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("BETTER_AUTH_URL is not a valid URL. Use the public address of the site, for example https://your-domain.example");
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (production && url.protocol !== "https:" && !local) {
    throw new Error("BETTER_AUTH_URL must start with https:// in production.");
  }
  return raw;
}

const secret = setting("BETTER_AUTH_SECRET");
if (production && secret && secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET is too short. Use at least 32 random characters (openssl rand -base64 32).");
}
const configuredUrl = setting("BETTER_AUTH_URL");
const baseURL = configuredUrl ? checkedUrl(configuredUrl) : "http://localhost:3000";

// Missing Google credentials cannot open anything up (nobody can sign in), so the app still starts and says why.
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
if (production && (!googleClientId || !googleClientSecret)) {
  console.error("[auth] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set, so Google sign-in cannot work yet.");
}

export const auth = betterAuth({
  secret,
  baseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
});
