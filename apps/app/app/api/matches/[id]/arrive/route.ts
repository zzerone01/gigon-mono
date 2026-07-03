import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ApiError, ok, withErrors } from "@/lib/server/errors";
import { matches } from "@/lib/server/schema";

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);

  await db.transaction(async (tx) => {
    const arrived = await tx
      .update(matches)
      .set({ status: "IN_PROGRESS", arrivedAt: sql`now()` })
      .where(
        and(
          eq(matches.id, matchId),
          eq(matches.workerId, user.id),
          eq(matches.status, "MATCHED"),
        ),
      )
      .returning({ id: matches.id });
    if (arrived.length === 0) {
      throw new ApiError(409, "invalid_state", "match not in MATCHED state");
    }

    await audit(tx, "arrived", { matchId, actorId: user.id });
  });

  return ok({});
});
