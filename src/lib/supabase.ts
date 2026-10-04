import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase configuration must come from the Vite environment.
 *
 * Required:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */
export const isConfigured =
  Boolean(
    supabaseUrl &&
      supabaseAnonKey,
  );

/**
 * Fail early with a useful error instead of allowing
 * Supabase to fail later with an obscure configuration error.
 */
if (!isConfigured) {
  console.error(
    "[Supabase] Missing required environment variables. " +
      "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

if (!supabaseUrl) {
  throw new Error(
    "Missing VITE_SUPABASE_URL environment variable.",
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_ANON_KEY environment variable.",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },

    global: {
      headers: {
        "x-application-name": "smdb",
      },
    },
  },
);