import { eq } from "drizzle-orm";
import { z } from "zod";

import { audit } from "@/lib/server/audit";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ApiError, ok, withErrors } from "@/lib/server/errors";
import { applications, gigs } from "@/lib/server/schema";

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const gigId = z.uuid().parse((await ctx.params).id);

  const id = await db.transaction(async (tx) => {
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

    await audit(tx, "applied", { gigId, actorId: user.id });
    return application!.id;
  });

  return ok({ id });
});
