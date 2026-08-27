import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";

/**
 * Where sign-in lands.
 *
 * Two arrival paths, as in The Fibre's apps: a PKCE `code` from clicking the
 * emailed link, or an already-established session when the organiser typed the
 * code instead and verifyOtp ran in the browser.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  // Only same-site paths: an open redirect here would let a crafted link bounce
  // someone off our domain carrying their session.
  const requested = url.searchParams.get("next") ?? "/festivals";
  const next = requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/festivals";

  const supabase = await serverSupabase();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/sign-in?error=link_expired", url.origin));
    }
  } else {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      return NextResponse.redirect(new URL("/sign-in?error=no_session", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
