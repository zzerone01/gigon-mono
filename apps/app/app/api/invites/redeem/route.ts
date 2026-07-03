import { and, eq, gt, sql } from "drizzle-orm";

import { redeemInviteBody } from "@repo/api/schemas";

import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ok, readJson, withErrors } from "@/lib/server/errors";
import { inviteCodes, profiles } from "@/lib/server/schema";

export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  const body = redeemInviteBody.parse(await readJson(req));

  const result = await db.transaction(async (tx) => {
    const redeemed = await tx
      .update(inviteCodes)
      .set({ usesLeft: sql`${inviteCodes.usesLeft} - 1` })
      .where(
        and(
          eq(inviteCodes.code, body.code.trim().toUpperCase()),
          gt(inviteCodes.usesLeft, 0),
        ),
      )
      .returning({ code: inviteCodes.code });
    if (redeemed.length === 0) return { ok: false };

    const businessName = body.businessName?.trim();
    await tx
      .update(profiles)
      .set({
        employerVerified: true,
        activeRole: "employer",
        ...(businessName ? { businessName } : {}),
      })
      .where(eq(profiles.id, user.id));
    return { ok: true };
  });

  return ok(result);
});
