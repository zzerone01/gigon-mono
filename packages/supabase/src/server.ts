import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Server-side Supabase client factory. Framework-agnostic: the caller passes
 * the cookie adapter (Next.js wires `next/headers` cookies through this).
 */
export function createSupabaseServerClient(
  url: string,
  anonKey: string,
  cookies: CookieMethodsServer,
) {
  return createServerClient<Database>(url, anonKey, { cookies });
}

export type SupabaseServerClient = ReturnType<typeof createSupabaseServerClient>;
