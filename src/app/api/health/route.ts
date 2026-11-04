import { db, isDatabaseConfigured } from "@/db";
import { sql } from "drizzle-orm";
import { isProductionRuntime } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured) {
    // In production a missing database is a broken deployment, not a preview, so a monitor must see a failure.
    const production = isProductionRuntime();
    return Response.json(
      {
        ok: !production,
        mode: production ? "misconfigured" : "preview",
        database: "not_configured",
        message: production
          ? "DATABASE_URL is not set. The service is refusing requests."
          : "Light of Science platform running in Preview Mode. Set DATABASE_URL in .env.local for persistent Supabase storage.",
      },
      { status: production ? 503 : 200 }
    );
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, mode: "production", database: "connected" });
  } catch (error) {
    return Response.json(
      { ok: false, database: "error", message: error instanceof Error ? error.message : "Database connection error" },
      { status: 500 }
    );
  }
}
