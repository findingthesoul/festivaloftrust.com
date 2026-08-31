/**
 * The service-role client: the book's writer and the ticket page's reader.
 * Not a "use server" module — this must never be a callable endpoint, only
 * an import for server code that has already proven its caller.
 */
export async function bookSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}
