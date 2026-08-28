import type { Metadata } from "next";
import { festivalFor } from "../guard";
import { FestivalHeader } from "../festival-header";
import { registrations } from "@/lib/festivals";

export const metadata: Metadata = { title: "Registrations", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ marker: string }> }) {
  const { marker } = await params;
  const { festival, access } = await festivalFor(marker);

  // Empty until the festival has a public page and somebody enrols. The
  // platform returns the person and their payment status and nothing else —
  // the registration answers stay behind the data wall, by its choice.
  const people = await registrations(festival);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="registrations" />

      <div className="mt-10">
        {!festival.thread_id ? (
          <p className="text-ink/70 max-w-xl leading-relaxed text-pretty">
            Nobody can register yet. This festival has no public page — that
            happens when it is published.
          </p>
        ) : people.length === 0 ? (
          <p className="text-ink/70 max-w-xl leading-relaxed text-pretty">
            No registrations yet. They will appear here as they come in.
          </p>
        ) : (
          <>
            <p className="text-ink/60 text-sm">
              {people.length} {people.length === 1 ? "person" : "people"}
            </p>
            <ul className="divide-ink/10 border-ink/10 mt-4 divide-y border-y">
              {people.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-6 py-4">
                  <span className="font-mono text-sm">{r.person_id}</span>
                  <span className="text-ink/60 text-sm">{r.payment_status}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
