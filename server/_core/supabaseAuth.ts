/**
 * Supabase JWT verification for backend authentication.
 * Verifies the Supabase access token and returns the user's sub (UUID).
 */
import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!_supabase) {
    _supabase = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return _supabase;
}

/**
 * Verify a Supabase access token and return the user's UUID (sub), email and name.
 * The name is read from user_metadata (set during signup via data.full_name or data.name).
 * Returns null if the token is invalid or expired.
 */
export async function verifySupabaseToken(accessToken: string): Promise<{
  id: string;
  email: string | undefined;
  name: string | undefined;
} | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) return null;

    // Extract name from user_metadata — Supabase stores it under various keys
    const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const name: string | undefined =
      (meta.full_name as string | undefined) ||
      (meta.name as string | undefined) ||
      (meta.display_name as string | undefined) ||
      (meta.first_name && meta.last_name
        ? `${meta.first_name} ${meta.last_name}`
        : undefined) ||
      (meta.first_name as string | undefined) ||
      undefined;

    return {
      id: data.user.id,
      email: data.user.email,
      name,
    };
  } catch {
    return null;
  }
}
