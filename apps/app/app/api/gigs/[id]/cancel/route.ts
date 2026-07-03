import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { cancelBody } from "@repo/api/schemas";

import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ApiError, ok, readJson, withErrors } from "@/lib/server/errors";
import { applications, gigs } from "@/lib/server/schema";

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const gigId = z.uuid().parse((await ctx.params).id);
  const body = cancelBody.parse(await readJson(req));

  await db.transaction(async (tx) => {
    const cancelled = await tx
      .update(gigs)
      .set({ status: "CANCELLED" })
      .where(
        and(eq(gigs.id, gigId), eq(gigs.employerId, user.id), eq(gigs.status, "POSTED")),
      )
      .returning({ id: gigs.id });
    if (cancelled.length === 0) {
      throw new ApiError(409, "invalid_state", "gig is not an open posting of yours");
    }

    await tx
      .update(applications)
      .set({ status: "REJECTED" })
      .where(and(eq(applications.gigId, gigId), eq(applications.status, "APPLIED")));

    await audit(tx, "gig_cancelled", {
      gigId,
      actorId: user.id,
      payload: { reason: body.reason ?? "" },
    });
  });

  return ok({});
});
