import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseServer } from "@/lib/supabase/server";

import { ApiError } from "./errors";

let verifier: SupabaseClient | undefined;

/** Stateless anon-key client — GoTrue is the authority on token validity. */
function tokenVerifier() {
  verifier ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return verifier;
}

/**
 * Resolve the caller: Bearer token first (mobile), cookie session as the
 * fallback (web). Throws 401 if neither yields a user.
 */
export async function requireUser(req: Request): Promise<{ id: string }> {
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (token) {
    const { data, error } = await tokenVerifier().auth.getUser(token);
    if (error || !data.user) throw new ApiError(401, "unauthorized", "sign in required");
    return { id: data.user.id };
  }
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new ApiError(401, "unauthorized", "sign in required");
  return { id: data.user.id };
}
