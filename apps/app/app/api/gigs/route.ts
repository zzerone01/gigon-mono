import { eq } from "drizzle-orm";

import { postGigBody } from "@repo/api/schemas";

import { track } from "@/lib/server/analytics";
import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, ok, readJson, withErrors } from "@/lib/server/errors";
import { gigs, profiles } from "@/lib/server/schema";

export const POST = withErrors(async (req) => {
  const user = await requireUser(req);
  const body = postGigBody.parse(await readJson(req));

  const id = await db.transaction(async (tx) => {
    const [profile] = await tx
      .select({ employerVerified: profiles.employerVerified })
      .from(profiles)
      .where(eq(profiles.id, user.id));
    if (!profile?.employerVerified) {
      throw new ApiError(403, "forbidden", "employer not invite-verified");
    }

    // status POSTED + expires_at now()+24h come from the DB defaults
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
