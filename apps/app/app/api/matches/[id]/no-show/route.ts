import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, ok, withErrors } from "@/lib/server/errors";
import { sendPushTo } from "@/lib/server/push";
import { applications, gigs, matches, profiles } from "@/lib/server/schema";

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);

  const notify = await db.transaction(async (tx) => {
    const [match] = await tx
      .update(matches)
      .set({ status: "NO_SHOW" })
      .where(
        and(
          eq(matches.id, matchId),
          eq(matches.employerId, user.id),
          eq(matches.status, "MATCHED"),
        ),
      )
      .returning();
    if (!match) throw new ApiError(409, "invalid_state", "match not in MATCHED state");

    await tx
      .update(applications)
      .set({ status: "REJECTED" })
      .where(eq(applications.id, match.applicationId));

    // reopen — unless the posting already ran out of time
    await tx
      .update(gigs)
      .set({
        status: sql`(case when ${gigs.expiresAt} > now() then 'POSTED' else 'EXPIRED' end)::public.gig_status`,
      })
      .where(and(eq(gigs.id, match.gigId), eq(gigs.status, "MATCHED")));

    await tx
      .update(profiles)
      .set({ noShowCount: sql`${profiles.noShowCount} + 1` })
      .where(eq(profiles.id, match.workerId));

    await audit(tx, "no_show_recorded", {
      gigId: match.gigId,
      matchId,
      actorId: user.id,
      payload: { worker: match.workerId },
    });

    const [gig] = await tx
      .select({ title: gigs.title })
      .from(gigs)
      .where(eq(gigs.id, match.gigId));
    return { workerId: match.workerId, gigTitle: gig?.title ?? "the gig" };
  });

  defer(() =>
    sendPushTo([notify.workerId], {
      title: "No-show recorded",
      body: `You were marked as a no-show for “${notify.gigTitle}”. Open a dispute if this is wrong.`,
      data: { type: "no_show", matchId },
    }),
  );

  return ok({});
});
