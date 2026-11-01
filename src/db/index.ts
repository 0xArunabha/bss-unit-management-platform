import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: NodePgDatabase;
};

export function getPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required to perform persistent database operations. Please set DATABASE_URL in .env.local with your Supabase / PostgreSQL connection string."
    );
  }
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: databaseUrl,
    });
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

export function getDb(): NodePgDatabase {
  if (!globalForDb.__arenaNextJsPostgresqlDb) {
    globalForDb.__arenaNextJsPostgresqlDb = drizzle(getPool());
  }
  return globalForDb.__arenaNextJsPostgresqlDb;
}

// Proxies for seamless backwards-compatibility with direct imports: import { db, pool } from "@/db"
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const targetPool = getPool();
    const value = Reflect.get(targetPool, prop);
    return typeof value === "function" ? value.bind(targetPool) : value;
  },
});

export const db = new Proxy({} as NodePgDatabase, {
  get(_target, prop) {
    const targetDb = getDb();
    const value = Reflect.get(targetDb, prop);
    return typeof value === "function" ? value.bind(targetDb) : value;
  },
});
