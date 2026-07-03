import { after } from "next/server";

/**
 * Schedule work for after the response is sent (Vercel keeps the instance
 * alive). Outside a Next request scope (vitest) `after` throws — fall back
 * to a detached promise so handlers behave identically in tests.
 */
export function defer(task: () => Promise<unknown> | unknown): void {
  try {
    after(task);
  } catch {
    void Promise.resolve().then(task);
  }
}
