import { db, isDatabaseConfigured } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured) {
    return Response.json({
      ok: true,
      mode: "preview",
      database: "not_configured",
      message: "Light of Science platform running in Preview Mode. Set DATABASE_URL in .env.local for persistent Supabase storage.",
    });
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
