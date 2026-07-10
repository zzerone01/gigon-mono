import { eq } from "drizzle-orm";

import { updateProfileBody } from "@repo/api/schemas";

import { track } from "@/lib/server/analytics";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ok, readJson, withErrors } from "@/lib/server/errors";
import { profiles } from "@/lib/server/schema";

export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  const body = updateProfileBody.parse(await readJson(req));

  const patch: Partial<{
    skills: string[];
    avatarUrl: string | null;
    bio: string;
    languages: string[];
    availability: string;
  }> = {};
  if (body.skills) patch.skills = [...new Set(body.skills.map((s) => s.trim()).filter(Boolean))];
  if (body.avatarUrl !== undefined) patch.avatarUrl = body.avatarUrl ?? null;
  if (body.bio !== undefined) patch.bio = body.bio.trim();
  if (body.languages) patch.languages = [...new Set(body.languages)];
  if (body.availability !== undefined) patch.availability = body.availability.trim();
  if (Object.keys(patch).length === 0) return ok({});

  await db.update(profiles).set(patch).where(eq(profiles.id, user.id));

  defer(() =>
    track(user.id, "profile_updated", {
      ...(patch.skills ? { skills: patch.skills } : {}),
      ...(body.avatarUrl !== undefined ? { has_avatar: !!body.avatarUrl } : {}),
    }),
  );

  return ok({});
});
