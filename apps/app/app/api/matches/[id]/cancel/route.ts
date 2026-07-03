import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";

import { cancelBody } from "@repo/api/schemas";

import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, ok, readJson, withErrors } from "@/lib/server/errors";
import { sendPushTo } from "@/lib/server/push";
import { applications, gigs, matches, matchPins, profiles } from "@/lib/server/schema";

/** Pre-arrival cancellation — only while MATCHED (PRD §4.1). */
export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);
  const body = cancelBody.parse(await readJson(req));
  const reason = body.reason ?? "";

  const notify = await db.transaction(async (tx) => {
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

    const [gig] = await tx
      .select({ title: gigs.title })
      .from(gigs)
      .where(eq(gigs.id, match.gigId));
    const [canceller] = await tx
      .select({ fullName: profiles.fullName, businessName: profiles.businessName })
      .from(profiles)
      .where(eq(profiles.id, user.id));
    return {
      recipientId: isWorker ? match.employerId : match.workerId,
      gigTitle: gig?.title ?? "your gig",
      cancellerName:
        (isWorker ? null : canceller?.businessName) ?? canceller?.fullName ?? "The other party",
    };
  });

  defer(() =>
    sendPushTo([notify.recipientId], {
      title: "Gig cancelled",
      body: `${notify.cancellerName} cancelled “${notify.gigTitle}”.`,
      data: { type: "match_cancelled", matchId },
    }),
  );

  return ok({});
});
