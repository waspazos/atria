import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/**
 * Service-role client for server-side buyer access. Returns null when
 * Supabase isn't configured so the app can run on fixture data locally.
 */
export function serviceClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached =
    url && key
      ? createClient(url, key, { auth: { persistSession: false } })
      : null;
  return cached;
}
