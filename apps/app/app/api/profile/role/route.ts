import { eq } from "drizzle-orm";

import { setRoleBody } from "@repo/api/schemas";

import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ok, readJson, withErrors } from "@/lib/server/errors";
import { profiles } from "@/lib/server/schema";

export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  const body = setRoleBody.parse(await readJson(req));

  await db.update(profiles).set({ activeRole: body.role }).where(eq(profiles.id, user.id));

  return ok({});
});
