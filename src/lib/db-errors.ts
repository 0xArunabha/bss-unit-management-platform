/**
 * True when Postgres rejected a statement because it would break a UNIQUE constraint (SQLSTATE 23505).
 * Drizzle wraps driver errors, so the code can be on the error itself or on its `cause`.
 */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null | undefined;
  return e?.code === "23505" || e?.cause?.code === "23505";
}
