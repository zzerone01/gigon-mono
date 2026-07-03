import { PostHog } from "posthog-node";

let client: PostHog | null | undefined;

function posthog(): PostHog | null {
  if (client !== undefined) return client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  // No key (or the placeholder) → analytics off. Vitest runs stay off too,
  // so integration tests never touch the network.
  if (!key || key.startsWith("phc_REPLACE") || process.env.VITEST) {
    client = null;
  } else {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    });
  }
  return client;
}

/**
 * Server-side funnel event. The API is the only write path (web and mobile
 * both call it), so capturing here instruments every client at once — the
 * PRD §8 KPI funnel (공고→지원→매칭→도착→PIN완료) is built from these events.
 *
 * distinct_id is the Supabase user id — the web client identifies with the
 * same id, so pageviews and server events merge into one person.
 *
 * Call inside defer(): captureImmediate posts synchronously per event, which
 * a batching queue can't guarantee once the serverless instance freezes.
 */
export async function track(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const ph = posthog();
  if (!ph) return;
  try {
    await ph.captureImmediate({ distinctId, event, properties });
  } catch (e) {
    console.error("[analytics] capture failed", e);
  }
}
