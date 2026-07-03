import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { postReviewBody } from "@repo/api/schemas";

import { track } from "@/lib/server/analytics";
import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, ok, readJson, withErrors } from "@/lib/server/errors";
import { matches, profiles, reviews } from "@/lib/server/schema";

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);
  const body = postReviewBody.parse(await readJson(req));

  const reviewed = await db.transaction(async (tx) => {
    const [match] = await tx.select().from(matches).where(eq(matches.id, matchId));
    if (!match) throw new ApiError(404, "not_found", "match not found");
    if (match.workerId !== user.id && match.employerId !== user.id) {
      throw new ApiError(403, "forbidden", "not a participant");
    }
    if (match.status !== "COMPLETED") {
      throw new ApiError(409, "invalid_state", "reviews unlock only after PIN completion");
    }

    const rateeId = user.id === match.workerId ? match.employerId : match.workerId;

    try {
      await tx.insert(reviews).values({
        matchId,
        raterId: user.id,
        rateeId,
        stars: body.stars,
        tags: body.tags,
        comment: body.comment ?? "",
      });
    } catch (e) {
      // unique (match_id, rater_id) — drizzle may wrap the pg error as cause
      const code =
        (e as { code?: string }).code ??
        ((e as { cause?: { code?: string } }).cause?.code);
      if (code === "23505") {
        throw new ApiError(409, "invalid_state", "already reviewed");
      }
      throw e;
    }

    await tx
      .update(profiles)
      .set({
        ratingSum: sql`${profiles.ratingSum} + ${body.stars}`,
        ratingCount: sql`${profiles.ratingCount} + 1`,
      })
      .where(eq(profiles.id, rateeId));

    await audit(tx, "review_posted", {
      gigId: match.gigId,
      matchId,
      actorId: user.id,
      payload: { stars: body.stars },
    });
    return {
      gigId: match.gigId,
      role: user.id === match.workerId ? "worker" : "business",
    };
  });

  defer(() =>
    track(user.id, "review_submitted", {
      gigId: reviewed.gigId,
      matchId,
      role: reviewed.role,
      stars: body.stars,
    }),
  );

  return ok({});
});
