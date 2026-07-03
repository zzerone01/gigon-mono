import type { Db, DbTx } from "./db";
import { auditLog } from "./schema";

/**
 * Append to audit_log inside the caller's transaction. Unlike the old SQL
 * audit(), actor_id is passed explicitly — there is no auth.uid() here.
 */
export async function audit(
  tx: Db | DbTx,
  event: string,
  fields: {
    gigId?: string | null;
    matchId?: string | null;
    actorId?: string | null;
    payload?: Record<string, unknown>;
  } = {},
): Promise<void> {
  await tx.insert(auditLog).values({
    event,
    gigId: fields.gigId ?? null,
    matchId: fields.matchId ?? null,
    actorId: fields.actorId ?? null,
    payload: fields.payload ?? {},
  });
}
