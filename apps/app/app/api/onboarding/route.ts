import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

import { onboardingBody } from "@repo/api/schemas";

import { track } from "@/lib/server/analytics";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ok, readJson, withErrors } from "@/lib/server/errors";
import { profiles } from "@/lib/server/schema";

export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  const body = onboardingBody.parse(await readJson(req));

  await db
    .update(profiles)
    .set({
      // empty/whitespace name keeps the existing value (old RPC semantics)
      fullName: sql`coalesce(nullif(trim(${body.name}), ''), ${profiles.fullName})`,
      activeRole: body.role,
      area: body.area,
      ...(body.lat != null ? { lat: body.lat } : {}),
      ...(body.lng != null ? { lng: body.lng } : {}),
      onboarded: true,
    })
    .where(eq(profiles.id, user.id));

  const name = body.name?.trim();
  defer(() =>
    track(user.id, "onboarding_completed", {
      role: body.role,
      area: body.area,
      $set: { active_role: body.role, area: body.area, ...(name ? { name } : {}) },
    }),
  );

  return ok({});
});
