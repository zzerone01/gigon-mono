import { eq } from "drizzle-orm";
import { z } from "zod";

import { sendMessageBody } from "@repo/api/schemas";

import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { defer } from "@/lib/server/defer";
import { ApiError, ok, readJson, withErrors } from "@/lib/server/errors";
import { sendPushTo } from "@/lib/server/push";
import { matches, messages, profiles } from "@/lib/server/schema";

const CHAT_OPEN_STATUSES = new Set(["MATCHED", "IN_PROGRESS", "COMPLETED"]);

export const POST = withErrors(async (req, ctx) => {
  const user = await requireUser(req);
  const matchId = z.uuid().parse((await ctx.params).id);
  const body = sendMessageBody.parse(await readJson(req));

  const result = await db.transaction(async (tx) => {
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

    const [sender] = await tx
      .select({ fullName: profiles.fullName, businessName: profiles.businessName })
      .from(profiles)
      .where(eq(profiles.id, user.id));
    return {
      id: message!.id,
      recipientId: match.workerId === user.id ? match.employerId : match.workerId,
      senderName:
        (match.employerId === user.id ? sender?.businessName : null) ??
        sender?.fullName ??
        "New message",
    };
  });

  defer(() =>
    sendPushTo([result.recipientId], {
      title: result.senderName,
      body: body.body.length > 120 ? `${body.body.slice(0, 119)}…` : body.body,
      data: { type: "message", matchId },
    }),
  );

  return ok({ id: result.id });
});
