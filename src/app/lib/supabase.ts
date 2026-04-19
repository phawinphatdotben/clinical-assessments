import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local in the project root and restart the dev server (npm run dev)."
  );
}

/**
 * Reuse one browser client across Next.js dev HMR reloads so GoTrue does not
 * log "Multiple GoTrueClient instances" and fight over the same storage key.
 */
const globalForSupabase = globalThis as unknown as {
  __supabaseBrowserClient?: SupabaseClient;
};

export const supabase: SupabaseClient =
  globalForSupabase.__supabaseBrowserClient ??
  createClient(supabaseUrl, supabaseAnonKey);

if (typeof globalThis !== "undefined" && process.env.NODE_ENV !== "production") {
  globalForSupabase.__supabaseBrowserClient = supabase;
}