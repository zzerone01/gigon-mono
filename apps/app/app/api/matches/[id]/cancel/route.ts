import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";

import { cancelBody } from "@repo/api/schemas";

import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ApiError, ok, readJson, withErrors } from "@/lib/server/errors";
import { applications, gigs, matches, matchPins, profiles } from "@/lib/server/schema";

/** Pre-arrival cancellation — only while MATCHED (PRD §4.1). */
export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);
  const body = cancelBody.parse(await readJson(req));
  const reason = body.reason ?? "";

  await db.transaction(async (tx) => {
    const participant = or(eq(matches.workerId, user.id), eq(matches.employerId, user.id));
    const [match] = await tx
      .update(matches)
      .set({
        status: "CANCELLED",
        cancelledBy: user.id,
        cancelReason: reason,
        cancelledAt: sql`now()`,
      })
      .where(and(eq(matches.id, matchId), eq(matches.status, "MATCHED"), participant))
      .returning();
    if (!match) {
      const [existing] = await tx
        .select({ id: matches.id })
        .from(matches)
        .where(and(eq(matches.id, matchId), participant));
      if (!existing) throw new ApiError(404, "not_found", "match not found");
      throw new ApiError(
        409,
        "invalid_state",
        "only a MATCHED gig can be cancelled — after arrival use no-show or dispute",
      );
    }

    const isWorker = match.workerId === user.id;

    await tx
      .update(profiles)
      .set({ cancelCount: sql`${profiles.cancelCount} + 1` })
      .where(eq(profiles.id, user.id));
    await tx.delete(matchPins).where(eq(matchPins.matchId, matchId));

    if (isWorker) {
      await tx
        .update(applications)
        .set({ status: "WITHDRAWN" })
        .where(eq(applications.id, match.applicationId));
      // reopen for other applicants unless the posting already expired
      await tx
        .update(gigs)
        .set({
          status: sql`(case when ${gigs.expiresAt} > now() then 'POSTED' else 'EXPIRED' end)::public.gig_status`,
        })
        .where(and(eq(gigs.id, match.gigId), eq(gigs.status, "MATCHED")));
    } else {
      await tx
        .update(applications)
        .set({ status: "REJECTED" })
        .where(eq(applications.id, match.applicationId));
      await tx
        .update(gigs)
        .set({ status: "CANCELLED" })
        .where(and(eq(gigs.id, match.gigId), eq(gigs.status, "MATCHED")));
    }

    await audit(tx, "match_cancelled", {
      gigId: match.gigId,
      matchId,
      actorId: user.id,
      payload: { by: isWorker ? "worker" : "employer", reason },
    });
  });

  return ok({});
});
