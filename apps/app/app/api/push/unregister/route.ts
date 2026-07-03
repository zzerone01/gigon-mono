import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ok, readJson, withErrors } from "@/lib/server/errors";
import { pushTokens } from "@/lib/server/schema";

const body = z.object({ token: z.string().min(1).max(200) });

/** Drop this device's token (sign-out). Only the owner can remove it. */
export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  const { token } = body.parse(await readJson(req));

  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.token, token), eq(pushTokens.userId, user.id)));

  return ok({});
});
