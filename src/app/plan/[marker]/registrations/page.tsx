import type { Metadata } from "next";
import { festivalFor } from "../guard";
import { FestivalHeader } from "../festival-header";
import { attendeesFor, registrationFor, registrations } from "@/lib/festivals";
import { RegistrationList } from "./registration-list";
import { card } from "@/components/ui";
import { OpenToggle } from "./open-toggle";

export const metadata: Metadata = { title: "Registrations", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ marker: string }> }) {
  const { marker } = await params;
  const { festival, access } = await festivalFor(marker);

  // Empty until the festival has a public page and somebody enrols. The
  // platform returns the person and their payment status and nothing else —
  // the registration answers stay behind the data wall, by its choice.
  const people = await registrations(festival);
  const registration = await registrationFor(festival);
  const attendees = await attendeesFor(festival.id);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <div className="print:hidden">
        <FestivalHeader festival={festival} access={access} active="registrations" />
      </div>

      {/* The doors, where the guest list is watched. Only once there is a
          public page — enrolment cannot open onto nothing. */}
      {festival.thread_id && registration && (
        <section className={`${card} mt-8 p-5 print:hidden sm:p-6`}>
          <OpenToggle marker={festival.marker} open={registration.open} />
        </section>
      )}

      <div className="mt-10">
        {!festival.thread_id ? (
          <p className="text-ink/70 max-w-xl leading-relaxed text-pretty">
            Nobody can register yet. This festival has no public page — that
            happens when it is published.
          </p>
        ) : attendees.length === 0 && people.length === 0 ? (
          <p className="text-ink/70 max-w-xl leading-relaxed text-pretty">
            No registrations yet. They will appear here as they come in.
          </p>
        ) : (
          <RegistrationList
            attendees={attendees}
            festivalName={festival.name}
            platformCount={people.length}
          />
        )}
      </div>
    </main>
  );
}
