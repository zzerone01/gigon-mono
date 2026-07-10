import { eq } from "drizzle-orm";

import { postGigBody } from "@repo/api/schemas";

import { track } from "@/lib/server/analytics";
import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, ok, readJson, withErrors } from "@/lib/server/errors";
import { gigs, profiles } from "@/lib/server/schema";

/** Calendar date in the Philippines (UTC+8, no DST), days from today. */
function phDate(daysFromToday = 0): string {
  return new Date(Date.now() + (8 * 3600 + daysFromToday * 86400) * 1000)
    .toISOString()
    .slice(0, 10);
}

export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  const body = postGigBody.parse(await readJson(req));

  const startsOn = body.startsOn ?? phDate();
  if (startsOn < phDate() || startsOn > phDate(7)) {
    throw new ApiError(422, "invalid_input", "start date must be within the next 7 days");
  }
  // Live until the end of the chosen day (PH time) — but at least 6 h, so a
  // late-night "Today" post survives into the morning.
  const expiresAt = new Date(
    Math.max(new Date(`${startsOn}T23:59:59+08:00`).getTime(), Date.now() + 6 * 3600 * 1000),
  );

  const id = await db.transaction(async (tx) => {
    const [profile] = await tx
      .select({ employerVerified: profiles.employerVerified })
      .from(profiles)
      .where(eq(profiles.id, user.id));
    if (!profile?.employerVerified) {
      throw new ApiError(403, "forbidden", "employer not invite-verified");
    }

    const [gig] = await tx
      .insert(gigs)
      .values({
        employerId: user.id,
        title: body.title,
        type: body.type,
        description: body.description ?? "",
        pay: body.pay,
        duration: body.duration,
        whenLabel: body.whenLabel,
        startsOn,
        expiresAt,
        area: body.area,
        lat: body.lat,
        lng: body.lng,
        slots: body.slots,
      })
      .returning({ id: gigs.id });

    await audit(tx, "gig_posted", {
      gigId: gig!.id,
      actorId: user.id,
      payload: { pay: body.pay },
    });
    return gig!.id;
  });

  defer(() =>
    track(user.id, "gig_posted", {
      gigId: id,
      type: body.type,
      pay: body.pay,
      slots: body.slots,
      area: body.area,
    }),
  );

  return ok({ id });
});
