import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { festivalByMarker } from "@/lib/festivals";
import { bookSupabase } from "@/lib/supabase/service";

/**
 * A guest's ticket: their name, the festival, and a QR code the door scans.
 * The address is the secret — an unguessable id, reachable only by the
 * person who registered (it is shown once, right after registering). The
 * book itself is not readable by the public, so the row is fetched with the
 * server's own key after the id proves the bearer knows it.
 */

export const metadata: Metadata = { title: "Your ticket", robots: { index: false } };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    .select("id, name, arrived_at, festival_id")
    .eq("id", ticket)
    .eq("festival_id", festival.id)
    .maybeSingle();
  const guest = data as { id: string; name: string; arrived_at: string | null } | null;
  if (!guest) notFound();

  const url = `https://www.festivaloftrust.com/${marker}/ticket/${guest.id}`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 480,
    color: { dark: "#181717", light: "#ffffff" },
  });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 py-16 text-center">
      <p className="text-green text-sm font-bold tracking-[0.12em] uppercase">
        {festival.name}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em]">{guest.name}</h1>
      <div
        className="border-ink/15 mt-8 w-full max-w-xs rounded-2xl border bg-white p-5 shadow-sm [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
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
