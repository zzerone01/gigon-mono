import { eq } from "drizzle-orm";
import { z } from "zod";

import { openDisputeBody } from "@repo/api/schemas";

import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ApiError, ok, readJson, withErrors } from "@/lib/server/errors";
import { disputes, matches } from "@/lib/server/schema";

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);
  const body = openDisputeBody.parse(await readJson(req));

  const ticket = await db.transaction(async (tx) => {
    const [match] = await tx
      .select({ workerId: matches.workerId, employerId: matches.employerId })
      .from(matches)
      .where(eq(matches.id, matchId));
    if (!match || (match.workerId !== user.id && match.employerId !== user.id)) {
      throw new ApiError(403, "forbidden", "not a participant");
    }

    const [dispute] = await tx
      .insert(disputes)
      .values({
        matchId,
        openerId: user.id,
        reason: body.reason,
        detail: body.detail ?? "",
      })
      .returning({ id: disputes.id });

    await audit(tx, "dispute_opened", {
      matchId,
      actorId: user.id,
      payload: { reason: body.reason },
    });
    return `D-${1000 + dispute!.id}`;
  });

  return ok({ ticket });
});
