import { and, eq } from "drizzle-orm";
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

    // Idempotent: a second tap on an already-APPLIED gig must not notify the
    // employer or fire the funnel event again. Re-applying after WITHDRAWN is a
    // real application, so that path still counts.
    const [inserted] = await tx
      .insert(applications)
      .values({ gigId, workerId: user.id })
      .onConflictDoNothing({ target: [applications.gigId, applications.workerId] })
      .returning({ id: applications.id });

    let applicationId = inserted?.id;
    let isNewApplication = !!inserted;

    if (!inserted) {
      const [existing] = await tx
        .select({ id: applications.id, status: applications.status })
        .from(applications)
        .where(and(eq(applications.gigId, gigId), eq(applications.workerId, user.id)));
      applicationId = existing!.id;
      if (existing!.status !== "APPLIED") {
        await tx
          .update(applications)
          .set({ status: "APPLIED" })
          .where(eq(applications.id, existing!.id));
        isNewApplication = true;
      }
    }

    if (!isNewApplication) return { id: applicationId!, isNewApplication: false as const };

    const [worker] = await tx
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, user.id));

    await audit(tx, "applied", { gigId, actorId: user.id });
    return {
      id: applicationId!,
      isNewApplication: true as const,
      employerId: gig.employerId,
      gigTitle: gig.title,
      workerName: worker?.fullName ?? "A worker",
    };
  });

  if (result.isNewApplication) {
    defer(() =>
      sendPushTo([result.employerId], {
        title: "New applicant",
        body: `${result.workerName} applied to “${result.gigTitle}”`,
        data: { type: "applied", gigId },
      }),
    );
    defer(() => track(user.id, "gig_applied", { gigId, applicationId: result.id }));
  }

  return ok({ id: result.id });
});
