import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ApiError, ok, withErrors } from "@/lib/server/errors";
import { applications, billableEvents, gigs, matches } from "@/lib/server/schema";

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const applicationId = z.uuid().parse((await ctx.params).id);

  const matchId = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ application: applications, employerId: gigs.employerId })
      .from(applications)
      .innerJoin(gigs, eq(gigs.id, applications.gigId))
      .where(eq(applications.id, applicationId));
    if (!row) throw new ApiError(404, "not_found", "application not found");
    if (row.employerId !== user.id) throw new ApiError(403, "forbidden", "not your gig");

    // race guard: only one applicant can flip the gig POSTED → MATCHED
    const flipped = await tx
      .update(gigs)
      .set({ status: "MATCHED" })
      .where(and(eq(gigs.id, row.application.gigId), eq(gigs.status, "POSTED")))
      .returning({ id: gigs.id });
    if (flipped.length === 0) throw new ApiError(409, "invalid_state", "gig is not open");

    const [match] = await tx
      .insert(matches)
      .values({
        gigId: row.application.gigId,
        applicationId: row.application.id,
        workerId: row.application.workerId,
        employerId: row.employerId,
      })
      .returning({ id: matches.id });

    await tx
      .update(applications)
      .set({ status: "SELECTED" })
      .where(eq(applications.id, row.application.id));

    await tx.insert(billableEvents).values({ matchId: match!.id });

    await audit(tx, "match_confirmed", {
      gigId: row.application.gigId,
      matchId: match!.id,
      actorId: user.id,
      payload: { billable: true, amount: 0 },
    });
    return match!.id;
  });

  return ok({ matchId });
});
