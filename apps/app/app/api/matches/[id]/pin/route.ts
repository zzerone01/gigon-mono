import { randomInt } from "node:crypto";

import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { track } from "@/lib/server/analytics";
import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, ok, withErrors } from "@/lib/server/errors";
import { matches, matchPins } from "@/lib/server/schema";

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);

  const pin = await db.transaction(async (tx) => {
    const [match] = await tx
      .select({ id: matches.id })
      .from(matches)
      .where(
        and(
          eq(matches.id, matchId),
          eq(matches.employerId, user.id),
          eq(matches.status, "IN_PROGRESS"),
        ),
      );
    if (!match) throw new ApiError(409, "invalid_state", "match not in IN_PROGRESS state");

    const newPin = randomInt(0, 10000).toString().padStart(4, "0");
    // bcryptjs emits $2a$ — compatible with hashes pgcrypto's crypt() issued
    const pinHash = await bcrypt.hash(newPin, 10);

    await tx
      .insert(matchPins)
      .values({ matchId, pinHash })
      .onConflictDoUpdate({
        target: matchPins.matchId,
        set: { pinHash, issuedAt: sql`now()`, attempts: 0, lockedUntil: null },
      });
    await tx.update(matches).set({ pinIssuedAt: sql`now()` }).where(eq(matches.id, matchId));

    await audit(tx, "pin_issued", { matchId, actorId: user.id });
    return newPin;
  });

  defer(() => track(user.id, "pin_issued", { matchId }));

  // the plaintext PIN exists only in this response — never stored or logged
  return ok({ pin });
});
