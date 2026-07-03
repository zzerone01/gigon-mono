"use client";

import * as React from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "@posthog/react";

import { supabaseBrowser } from "@/lib/supabase/client";

const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    // No key configured (or still the placeholder) → don't initialise, so the
    // app stays clean in local dev and never ships broken requests.
    if (!key || key.startsWith("phc_REPLACE")) return;

    posthog.init(key, {
      // Send through the Next.js reverse proxy (see next.config.js) to dodge
      // tracking blockers. "/ingest" is rewritten to PostHog's ingestion host.
      api_host: "/ingest",
      // App host (no `i.`) — used by the toolbar and session-replay deep links.
      ui_host: POSTHOG_HOST.replace(".i.posthog.com", ".posthog.com"),
      // Modern defaults: SPA pageviews via the History API, pageleave, autocapture.
      defaults: "2025-05-24",
    });

    // Identify with the Supabase user id — the same distinct_id the API layer
    // uses for server-side funnel events, so both merge into one person.
    // INITIAL_SESSION fires immediately with the current session.
    const { data: sub } = supabaseBrowser().auth.onAuthStateChange((event, session) => {
      if (session?.user) posthog.identify(session.user.id);
      else if (event === "SIGNED_OUT") posthog.reset();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
