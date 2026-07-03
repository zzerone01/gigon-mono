import { eq } from "drizzle-orm";

import { setRoleBody } from "@repo/api/schemas";

import { track } from "@/lib/server/analytics";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ok, readJson, withErrors } from "@/lib/server/errors";
import { profiles } from "@/lib/server/schema";

export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  const body = setRoleBody.parse(await readJson(req));

  await db.update(profiles).set({ activeRole: body.role }).where(eq(profiles.id, user.id));

  defer(() =>
    track(user.id, "role_switched", { role: body.role, $set: { active_role: body.role } }),
  );

  return ok({});
});
