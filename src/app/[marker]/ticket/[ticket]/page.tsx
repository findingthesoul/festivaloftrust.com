import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { festivalByMarker, registrations } from "@/lib/festivals";
import { bookSupabase } from "@/lib/supabase/service";

/**
 * A guest's ticket: their name, the festival, and The Thread's own QR — one
 * ticket system for every guest, whether they registered here or through
 * the platform, so the door speaks a single language. The address is the
 * secret — an unguessable id shown once, right after registering; the QR
 * image comes straight from the platform, drawn around its check-in code.
 */

export const metadata: Metadata = { title: "Your ticket", robots: { index: false } };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FIBRE_BASE = process.env.FIBRE_API_URL ?? "https://thefibre-api.fly.dev";

export default async function Page({
  params,
}: {
  params: Promise<{ marker: string; ticket: string }>;
}) {
  const { marker, ticket } = await params;
  if (!UUID.test(ticket)) notFound();

  const festival = await festivalByMarker(marker);
  if (!festival) notFound();

  const admin = await bookSupabase();
  if (!admin) notFound();
  const { data } = await admin
    .from("festival_attendee")
    .select("id, name, email, arrived_at")
    .eq("id", ticket)
    .eq("festival_id", festival.id)
    .maybeSingle();
  const guest = data as {
    id: string;
    name: string;
    email: string;
    arrived_at: string | null;
  } | null;
  if (!guest) notFound();

  // The platform enrolment behind this registration carries the check-in
  // code the QR is drawn around. Matched by email — the registration went
  // to the platform under the same address moments earlier.
  let code: string | null = null;
  try {
    const rows = await registrations(festival);
    code =
      rows.find(
        (e) => (e.email ?? "").toLowerCase() === guest.email.toLowerCase(),
      )?.checkin_code ?? null;
  } catch {
    code = null;
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-16 text-center">
      <p className="text-green text-sm font-bold tracking-[0.12em] uppercase">
        {festival.name}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em]">{guest.name}</h1>
      {code ? (
        <div className="border-ink/15 mt-8 w-full max-w-xs rounded-2xl border bg-white p-5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${FIBRE_BASE}/api/v1/thread/public/checkin/${code}/qr.png`}
            alt="Your check-in QR code"
            className="h-auto w-full"
          />
        </div>
      ) : (
        <p className="border-ink/15 text-ink/60 mt-8 max-w-xs rounded-2xl border bg-white p-6 text-sm leading-relaxed">
          Your QR code is still being prepared — give it a minute and reload,
          or simply give your name at the door.
        </p>
      )}
      <p className="text-ink/60 mt-6 max-w-xs text-sm leading-relaxed">
        {guest.arrived_at
          ? "Checked in — welcome!"
          : "Show this at the door. A screenshot works just as well."}
      </p>
      {festival.place && (
        <p className="text-ink/50 mt-2 text-sm">{festival.place}</p>
      )}
    </main>
  );
}
