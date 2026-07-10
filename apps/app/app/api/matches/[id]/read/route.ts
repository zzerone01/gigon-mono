import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ApiError, ok, withErrors } from "@/lib/server/errors";
import { chatReads, matches } from "@/lib/server/schema";

/** Stamp "I've seen this chat" — drives the other side's Read receipt. */
export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);

  const [match] = await db
    .select({ workerId: matches.workerId, employerId: matches.employerId })
    .from(matches)
    .where(eq(matches.id, matchId));
  if (!match || (match.workerId !== user.id && match.employerId !== user.id)) {
    throw new ApiError(403, "forbidden", "not a participant of this match");
  }

  await db
    .insert(chatReads)
    .values({ matchId, userId: user.id })
    .onConflictDoUpdate({
      target: [chatReads.matchId, chatReads.userId],
      set: { lastReadAt: sql`now()` },
    });

  return ok({});
});
