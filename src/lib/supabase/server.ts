import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Supabase on the server, reading the session from cookies.
 *
 * No cookie domain is set: unlike The Fibre's apps, which share a session
 * across meet./thread./flow.thefibre.app, this is one site on one host.
 */
export async function serverSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          try {
            for (const { name, value, options } of toSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Read-only Server Component context; ignore. The refresh happens
            // in /auth/callback, which is a Route Handler and may write.
          }
        },
      },
    },
  );
}

/** The signed-in organiser, or null. */
export async function currentUser() {
  const supabase = await serverSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
