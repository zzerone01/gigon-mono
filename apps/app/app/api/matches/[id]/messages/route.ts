import { eq } from "drizzle-orm";
import { z } from "zod";

import { sendMessageBody } from "@repo/api/schemas";

import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { ApiError, ok, readJson, withErrors } from "@/lib/server/errors";
import { matches, messages } from "@/lib/server/schema";

const CHAT_OPEN_STATUSES = new Set(["MATCHED", "IN_PROGRESS", "COMPLETED"]);

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);
  const body = sendMessageBody.parse(await readJson(req));

  const id = await db.transaction(async (tx) => {
    const [match] = await tx
      .select({
        workerId: matches.workerId,
        employerId: matches.employerId,
        status: matches.status,
      })
      .from(matches)
      .where(eq(matches.id, matchId));
    if (
      !match ||
      (match.workerId !== user.id && match.employerId !== user.id) ||
      !CHAT_OPEN_STATUSES.has(match.status)
    ) {
      throw new ApiError(403, "forbidden", "chat is only open on an active match");
    }

    // Realtime broadcasts this INSERT to both participants — client behavior
    // is unchanged; the response id also feeds the web optimistic append.
    const [message] = await tx
      .insert(messages)
      .values({ matchId, senderId: user.id, body: body.body })
      .returning({ id: messages.id });
    return message!.id;
  });

  return ok({ id });
});
