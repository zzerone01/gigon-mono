import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Browser-side Supabase client (Next.js client components).
 * The mobile app builds its own client with AsyncStorage; both share the
 * generated `Database` types from `@repo/supabase/types`.
 */
export function createSupabaseBrowserClient(url: string, anonKey: string) {
  return createBrowserClient<Database>(url, anonKey);
}

export type SupabaseBrowserClient = ReturnType<typeof createSupabaseBrowserClient>;
