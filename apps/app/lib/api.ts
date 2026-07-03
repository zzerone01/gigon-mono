"use client";

import { createApiClient } from "@repo/api/client";

import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Write-API client for the web app. Same-origin, so the session cookie rides
 * along anyway — the Bearer token keeps the code path identical to mobile.
 */
export const api = createApiClient({
  baseUrl: "",
  getToken: async () => {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? null;
  },
});
