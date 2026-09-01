import type { Metadata } from "next";
import { festivalFor } from "../guard";
import { FestivalHeader } from "../festival-header";
import { attendeesFor, registrationFor, registrationOpensAt, registrations } from "@/lib/festivals";
import { RegistrationList, type GuestRow } from "./registration-list";
import { card } from "@/components/ui";
import { OpenToggle } from "./open-toggle";
import { RegistrationControls } from "../publish/registration-controls";

export const metadata: Metadata = { title: "Registrations", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ marker: string }> }) {
  const { marker } = await params;
  const { festival, access } = await festivalFor(marker);

  // Empty until the festival has a public page and somebody enrols. The
  // platform returns the person and their payment status and nothing else —
  // the registration answers stay behind the data wall, by its choice.
  // Four independent questions, one round trip's wait instead of four.
  const [people, registration, attendees, opensAt] = await Promise.all([
    registrations(festival),
    registrationFor(festival),
    attendeesFor(festival.id),
    festival.status === "live"
      ? registrationOpensAt(festival.id)
      : Promise.resolve(null),
  ]);

  // One list from two books: the platform now names its rows and says who
  // still waits for a decision; the site's own book adds the phone. Matched
  // by email; either side alone still makes a row.
  const bookByEmail = new Map(
    attendees.map((a) => [a.email.toLowerCase(), a] as const),
  );
  const seen = new Set<string>();
  const admittedOrWaiting = people.filter(
    (e) => e.status !== "declined" && e.status !== "cancelled",
  );
  const rows: GuestRow[] = admittedOrWaiting.map((e) => {
    const email = (e.email ?? "").toLowerCase();
    const book = email ? bookByEmail.get(email) : undefined;
    if (book) seen.add(book.id);
    return {
      id: e.id,
      name: e.full_name ?? book?.name ?? e.person_id,
      email: e.email ?? book?.email ?? "",
      phone: book?.phone ?? null,
      awaiting: !!e.awaiting_approval,
      enrolmentRowId: e.id,
      attendeeId: book?.id ?? null,
    };
  });
  for (const a of attendees) {
    if (!seen.has(a.id)) {
      rows.push({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        awaiting: false,
        enrolmentRowId: null,
        attendeeId: a.id,
      });
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <div className="print:hidden">
        <FestivalHeader festival={festival} access={access} active="registrations" />
        <p className="mt-6">
          <a
            href={`/plan/${marker}/checkin`}
            className="bg-green text-cream inline-block rounded-lg px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-85"
          >
            Door check-in →
          </a>
          <span className="text-ink/55 ml-3 text-sm">
            The guest list for a phone at the entrance, with a QR scanner.
          </span>
        </p>
      </div>

      {/* The doors, where the guest list is watched. Only once there is a
          public page — enrolment cannot open onto nothing. */}
      {festival.thread_id && registration && (
        <section className={`${card} mt-8 p-5 print:hidden sm:p-6`}>
          <OpenToggle marker={festival.marker} open={registration.open} />
          <div className="border-ink/10 mt-5 border-t pt-5">
            <RegistrationControls
              festival={festival}
              opensAtIso={opensAt}
              open={opensAt !== null && new Date(opensAt) <= new Date()}
            />
          </div>
        </section>
      )}

      <div className="mt-10">
        {!festival.thread_id ? (
          <p className="text-ink/70 max-w-xl leading-relaxed text-pretty">
            Nobody can register yet. This festival has no public page — that
            happens when it is published.
          </p>
        ) : rows.length === 0 ? (
          <p className="text-ink/70 max-w-xl leading-relaxed text-pretty">
            No registrations yet. They will appear here as they come in.
          </p>
        ) : (
          <RegistrationList
            marker={festival.marker}
            rows={rows}
            festivalName={festival.name}
            canReview={access?.role === "organiser"}
          />
        )}
      </div>
    </main>
  );
}
