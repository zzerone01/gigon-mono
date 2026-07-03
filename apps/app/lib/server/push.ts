import { inArray } from "drizzle-orm";

import { db } from "./db";
import { pushTokens } from "./schema";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/**
 * Send a push to every registered device of the given users via the Expo
 * Push API. Never throws — a failed push must not fail the request that
 * triggered it. Call from route handlers via next/server `after()`.
 */
export async function sendPushTo(userIds: string[], message: PushMessage): Promise<void> {
  try {
    if (process.env.PUSH_DISABLED === "1") return; // tests / ops kill-switch
    if (userIds.length === 0) return;
    const rows = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(inArray(pushTokens.userId, userIds));
    if (rows.length === 0) return;

    const stale: string[] = [];
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          chunk.map((r) => ({
            to: r.token,
            sound: "default",
            title: message.title,
            body: message.body,
            data: message.data ?? {},
          })),
        ),
      });
      const json = (await res.json().catch(() => null)) as {
        data?: Array<{ status: string; details?: { error?: string } }>;
      } | null;
      json?.data?.forEach((ticket, idx) => {
        if (ticket.details?.error === "DeviceNotRegistered") {
          stale.push(chunk[idx]!.token);
        }
      });
    }
    if (stale.length > 0) {
      await db.delete(pushTokens).where(inArray(pushTokens.token, stale));
    }
  } catch (e) {
    console.error("[push] send failed", e);
  }
}
