"use client";

import { createSupabaseBrowserClient } from "@repo/supabase/browser";

let client: ReturnType<typeof createSupabaseBrowserClient> | undefined;

export function supabaseBrowser() {
  client ??= createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}
