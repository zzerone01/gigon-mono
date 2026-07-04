import { and, eq, inArray, or, sql } from "drizzle-orm";

import { track } from "@/lib/server/analytics";
import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, ok, withErrors } from "@/lib/server/errors";
import { applications, disputes, gigs, matches, messages, reviews } from "@/lib/server/schema";

/**
 * Permanently delete the caller's account and data (Play "account deletion"
 * requirement). All user-referencing FKs except push_tokens are NO ACTION, so
 * dependents must go before the profile; auth.users then cascades to profiles
 * and push_tokens, and GoTrue cascades sessions/refresh tokens internally.
 */
export const POST = withErrors(async (req) => {
  // Route handlers have no CSRF layer and this endpoint accepts cookie
  // sessions — reject cross-site browser POSTs (bearer callers skip this).
  const origin = req.headers.get("origin");
  if (!req.headers.get("authorization") && origin) {
    let sameHost = false;
    try {
      sameHost = new URL(origin).host === new URL(req.url).host;
    } catch {
      // Origin "null" (sandboxed iframe) or malformed — not same-site.
    }
    if (!sameHost) throw new ApiError(403, "forbidden", "cross-origin request rejected");
  }

  const user = await requireUser(req);

  await db.transaction(async (tx) => {
    // Reopen counterparties' gigs held by the user's live worker matches —
    // same rule as a worker cancel (POSTED again, or EXPIRED if past expiry).
    await tx
      .update(gigs)
      .set({
        status: sql`(case when ${gigs.expiresAt} > now() then 'POSTED' else 'EXPIRED' end)::public.gig_status`,
      })
      .where(
        and(
          eq(gigs.status, "MATCHED"),
          inArray(
            gigs.id,
            tx
              .select({ gigId: matches.gigId })
              .from(matches)
              .where(
                and(
                  eq(matches.workerId, user.id),
                  inArray(matches.status, ["MATCHED", "IN_PROGRESS"]),
                ),
              ),
          ),
        ),
      );

    // Matches on either side — cascades their messages, reviews, disputes,
    // billable_events, and match_pins.
    await tx
      .delete(matches)
      .where(or(eq(matches.workerId, user.id), eq(matches.employerId, user.id)));
    await tx
      .update(matches)
      .set({ cancelledBy: null })
      .where(eq(matches.cancelledBy, user.id));
    await tx.delete(messages).where(eq(messages.senderId, user.id));
    await tx
      .delete(reviews)
      .where(or(eq(reviews.raterId, user.id), eq(reviews.rateeId, user.id)));
    await tx.delete(disputes).where(eq(disputes.openerId, user.id));
    await tx.delete(applications).where(eq(applications.workerId, user.id));
    // Own gigs — cascades other workers' applications to them.
    await tx.delete(gigs).where(eq(gigs.employerId, user.id));

    // audit_log.actor_id has no FK: the event outlives the account, but the
    // uuid stops mapping to a person once the profile row is gone.
    await audit(tx, "account_deleted", { actorId: user.id });

    await tx.execute(sql`delete from auth.users where id = ${user.id}`);
  });

  defer(() => track(user.id, "account_deleted"));

  return ok({ deleted: true });
});
