import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { activateThread } from "@/lib/festivals";

export const dynamic = "force-dynamic";

/**
 * Open the festivals whose hour has come.
 *
 * "From Tuesday" has to be kept by something that runs on Tuesday. Doing it
 * when someone next loads the page would mean registration opens when a
 * stranger happens to visit, which is not a promise anybody made.
 *
 * Runs on the service role, not a signed-in session: at 09:00 there is nobody
 * signed in, and RLS is written for people. That is why this route checks its
 * own caller.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 500 });
  }
  // Vercel signs its cron calls with this header. Anything else is a stranger.
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase service credentials missing" }, { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("festival")
    .select("id, marker, thread_id")
    .eq("status", "live")
    .not("thread_id", "is", null)
    .not("registration_opens_at", "is", null)
    .lte("registration_opens_at", new Date().toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const due = (data ?? []) as { id: string; marker: string; thread_id: string }[];
  const opened: string[] = [];
  const failed: { marker: string; error: string }[] = [];

  for (const festival of due) {
    // Idempotent by nature: patching an already-active thread to active is a
    // no-op, so a re-run costs a request and changes nothing.
    const result = await activateThread(festival);
    if (result.error) failed.push({ marker: festival.marker, error: result.error });
    else opened.push(festival.marker);
  }

  return NextResponse.json({ checked: due.length, opened, failed });
}
