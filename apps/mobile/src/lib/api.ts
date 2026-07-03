import { createApiClient } from "@repo/api/client";

import { supabase } from "./supabase";

/**
 * Write-API client. Mobile talks to the same Next.js route handlers as the
 * web app — plain HTTPS with a Bearer token, so no CORS and no cookies.
 * Point EXPO_PUBLIC_API_URL at http://<mac-ip>:3001 to test a local server.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://app.gigon.io";

export const api = createApiClient({
  baseUrl: API_URL,
  getToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
});
