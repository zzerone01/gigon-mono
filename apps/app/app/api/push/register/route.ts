import { sql } from "drizzle-orm";
import { z } from "zod";

import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ok, readJson, withErrors } from "@/lib/server/errors";
import { pushTokens } from "@/lib/server/schema";

const body = z.object({
  token: z.string().min(1).max(200),
  platform: z.enum(["ios", "android"]).default("android"),
});

/** Upsert this device's Expo push token for the signed-in user. */
export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  const { token, platform } = body.parse(await readJson(req));

  await db
    .insert(pushTokens)
    .values({ token, userId: user.id, platform })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId: user.id, platform, updatedAt: sql`now()` },
    });

  return ok({});
});
