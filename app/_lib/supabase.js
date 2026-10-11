import "server-only";
import { createClient } from "@supabase/supabase-js";
let client;
export function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error(
      "Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.",
    );
  client ??= createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    },
  );
  return client;
}
