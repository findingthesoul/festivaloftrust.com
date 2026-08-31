import type { Metadata } from "next";
import { festivalFor } from "../guard";
import { FestivalHeader } from "../festival-header";
import { attendeesFor, registrations } from "@/lib/festivals";
import { CheckinList, type DoorGuest } from "./checkin-list";
import { card } from "@/components/ui";

/**
 * The door. The same merged guest list as Registrations, but built for a
 * phone at the entrance: search, one big check-in tap per guest, and a
 * camera that reads the QR on a guest's ticket. Hosts included — they are
 * exactly who stands at the door.
 */

export const metadata: Metadata = { title: "Check-in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;
  const { festival, access } = await festivalFor(marker);

  const [people, attendees] = await Promise.all([
    registrations(festival),
    attendeesFor(festival.id),
  ]);
  const bookByEmail = new Map(
    attendees.map((a) => [a.email.toLowerCase(), a] as const),
  );
  const seen = new Set<string>();
  const guests: DoorGuest[] = [];
  for (const e of people) {
    if (e.awaiting_approval) continue;
    const email = (e.email ?? "").toLowerCase();
    const book = email ? bookByEmail.get(email) : undefined;
    if (book) seen.add(book.id);
    guests.push({
      key: e.id,
      name: e.full_name?.trim() || book?.name || "Guest",
      email: e.email ?? book?.email ?? null,
      attendeeId: book?.id ?? null,
      arrived: !!book?.arrived_at,
    });
  }
  for (const a of attendees) {
    if (seen.has(a.id)) continue;
    guests.push({
      key: a.id,
      name: a.name,
      email: a.email,
      attendeeId: a.id,
      arrived: !!a.arrived_at,
    });
  }
  guests.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="registrations" />
      <section className={`${card} mt-8 p-5 sm:p-7`}>
        <CheckinList marker={marker} guests={guests} />
      </section>
    </main>
  );
}
