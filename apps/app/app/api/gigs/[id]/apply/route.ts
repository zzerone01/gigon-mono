import { eq } from "drizzle-orm";
import { z } from "zod";

import { track } from "@/lib/server/analytics";
import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, ok, withErrors } from "@/lib/server/errors";
import { sendPushTo } from "@/lib/server/push";
import { applications, gigs, profiles } from "@/lib/server/schema";

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const gigId = z.uuid().parse((await ctx.params).id);

  const result = await db.transaction(async (tx) => {
    const [gig] = await tx.select().from(gigs).where(eq(gigs.id, gigId));
    if (!gig || gig.status !== "POSTED" || gig.expiresAt.getTime() <= Date.now()) {
      throw new ApiError(409, "invalid_state", "gig is not open");
    }
    if (gig.employerId === user.id) {
      throw new ApiError(403, "forbidden", "cannot apply to your own gig");
    }

    const [application] = await tx
      .insert(applications)
      .values({ gigId, workerId: user.id })
      .onConflictDoUpdate({
        target: [applications.gigId, applications.workerId],
        set: { status: "APPLIED" },
      })
      .returning({ id: applications.id });

    const [worker] = await tx
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, user.id));

    await audit(tx, "applied", { gigId, actorId: user.id });
    return {
      id: application!.id,
      employerId: gig.employerId,
      gigTitle: gig.title,
      workerName: worker?.fullName ?? "A worker",
    };
  });

  defer(() =>
    sendPushTo([result.employerId], {
      title: "New applicant",
      body: `${result.workerName} applied to “${result.gigTitle}”`,
      data: { type: "applied", gigId },
    }),
  );
  defer(() => track(user.id, "gig_applied", { gigId, applicationId: result.id }));

  return ok({ id: result.id });
});
