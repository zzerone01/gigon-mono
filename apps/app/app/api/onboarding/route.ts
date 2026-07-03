import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";

import { onboardingBody } from "@repo/api/schemas";

import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
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

  return ok({});
});
