import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { verifyPinBody, type VerifyPinResponse } from "@repo/api/schemas";

import { track } from "@/lib/server/analytics";
import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, raw, readJson, withErrors } from "@/lib/server/errors";
import { gigs, matches, matchPins, profiles } from "@/lib/server/schema";

const PIN_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Legacy RPC contract: guard failures throw (404/409), but verification
 * outcomes are always HTTP 200 `{ok: ...}` — clients consume them as state.
 */
export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);
  const body = verifyPinBody.parse(await readJson(req));

  // hoisted out of the transaction — analytics fires only after commit
  let completed: { gigId: string; employerId: string } | null = null;

  const result = await db.transaction(async (tx): Promise<VerifyPinResponse> => {
    const [match] = await tx.select().from(matches).where(eq(matches.id, matchId));
    if (!match || match.workerId !== user.id) {
      throw new ApiError(404, "not_found", "match not found");
    }
    if (match.status !== "IN_PROGRESS") {
      throw new ApiError(409, "invalid_state", "match not in IN_PROGRESS state");
    }

    // serialize concurrent attempts on the try counter
    const [pins] = await tx
      .select()
      .from(matchPins)
      .where(eq(matchPins.matchId, matchId))
      .for("update");
    if (!pins || pins.issuedAt.getTime() < Date.now() - PIN_TTL_MS) {
      return { ok: false, error: "no_active_pin" };
    }
    if (pins.lockedUntil && pins.lockedUntil.getTime() > Date.now()) {
      return {
        ok: false,
        error: "locked",
        locked_for: Math.ceil((pins.lockedUntil.getTime() - Date.now()) / 1000),
      };
    }

    if (await bcrypt.compare(body.pin, pins.pinHash)) {
      await tx
        .update(matches)
        .set({ status: "COMPLETED", completedAt: sql`now()` })
        .where(eq(matches.id, matchId));
      await tx.update(gigs).set({ status: "COMPLETED" }).where(eq(gigs.id, match.gigId));
      await tx
        .update(profiles)
        .set({ jobsCompleted: sql`${profiles.jobsCompleted} + 1` })
        .where(eq(profiles.id, match.workerId));
      await tx.delete(matchPins).where(eq(matchPins.matchId, matchId));
      await audit(tx, "pin_verified_completed", {
        gigId: match.gigId,
        matchId,
        actorId: user.id,
      });
      completed = { gigId: match.gigId, employerId: match.employerId };
      return { ok: true };
    }

    if (pins.attempts + 1 >= 3) {
      await tx
        .update(matchPins)
        .set({ attempts: 0, lockedUntil: sql`now() + interval '60 seconds'` })
        .where(eq(matchPins.matchId, matchId));
      await audit(tx, "pin_locked", { matchId, actorId: user.id });
      return { ok: false, error: "locked", locked_for: 60 };
    }
    await tx
      .update(matchPins)
      .set({ attempts: sql`${matchPins.attempts} + 1` })
      .where(eq(matchPins.matchId, matchId));
    return { ok: false, error: "wrong_pin", attempts_left: 3 - (pins.attempts + 1) };
  });

  if (completed) {
    // the KPI funnel's conversion step — one event per side (see select route)
    const { gigId, employerId } = completed;
    defer(() =>
      Promise.all([
        track(user.id, "match_completed", { gigId, matchId, role: "worker" }),
        track(employerId, "match_completed", { gigId, matchId, role: "business" }),
      ]),
    );
  }

  return raw(result);
});
