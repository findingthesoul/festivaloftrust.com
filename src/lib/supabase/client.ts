import { createBrowserClient } from "@supabase/ssr";

/** Supabase in the browser. Follows the pattern used across The Fibre's apps. */
export function browserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
