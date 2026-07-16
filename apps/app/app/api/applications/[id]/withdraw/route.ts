import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { track } from "@/lib/server/analytics";
import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, ok, withErrors } from "@/lib/server/errors";
import { applications } from "@/lib/server/schema";

/**
 * Worker takes back an application the business hasn't answered yet.
 * Only APPLIED → WITHDRAWN; once selected, the worker must cancel the match
 * instead (that path carries a cancel_count penalty, this one does not).
 */
export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const applicationId = z.uuid().parse((await ctx.params).id);

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ workerId: applications.workerId, gigId: applications.gigId })
      .from(applications)
      .where(eq(applications.id, applicationId));
    if (!row) throw new ApiError(404, "not_found", "application not found");
    if (row.workerId !== user.id) throw new ApiError(403, "forbidden", "not your application");

    // Race guard: if the business selected this worker a moment ago the status
    // is no longer APPLIED, and withdrawing must not unpick a live match.
    const withdrawn = await tx
      .update(applications)
      .set({ status: "WITHDRAWN" })
      .where(and(eq(applications.id, applicationId), eq(applications.status, "APPLIED")))
      .returning({ id: applications.id });
    if (withdrawn.length === 0) {
      throw new ApiError(409, "invalid_state", "this application can no longer be withdrawn");
    }

    await audit(tx, "application_withdrawn", { gigId: row.gigId, actorId: user.id });
    return { gigId: row.gigId };
  });

  defer(() =>
    track(user.id, "application_withdrawn", { gigId: result.gigId, applicationId }),
  );

  return ok({ id: applicationId });
});
