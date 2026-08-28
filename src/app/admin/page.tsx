import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { standing } from "@/lib/organiser";
import { FestivalButtons, OrganiserButtons } from "./review-buttons";

export const metadata: Metadata = { title: "Review", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await standing();
  // Not a redirect: someone who is not an admin should not learn that this
  // page exists.
  if (s.state !== "approved" || !s.organiser.is_admin) notFound();

  const supabase = await serverSupabase();
  const [{ data: people }, { data: festivals }] = await Promise.all([
    supabase
      .from("organiser")
      .select("id, email, full_name, organisation, reason, applied_at")
      .eq("status", "pending")
      .order("applied_at"),
    supabase
      .from("festival")
      .select("id, name, marker, place, submitted_at")
      .eq("status", "submitted")
      .order("submitted_at"),
  ]);

  const pendingPeople = people ?? [];
  const pendingFestivals = festivals ?? [];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <h1 className="text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.02em]">
        Review
      </h1>

      <section className="mt-12">
        <h2 className="text-xl font-bold">
          Organisers <span className="text-ink/50 font-normal">({pendingPeople.length})</span>
        </h2>
        {pendingPeople.length === 0 ? (
          <p className="text-ink/60 mt-3 text-sm">Nobody waiting.</p>
        ) : (
          <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
            {pendingPeople.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-6 py-5">
                <div className="min-w-0">
                  <p className="font-bold">{p.full_name ?? p.email}</p>
                  <p className="text-ink/60 text-sm">
                    {p.email}
                    {p.organisation ? ` · ${p.organisation}` : ""}
                  </p>
                  {p.reason && (
                    <p className="mt-2 max-w-xl leading-relaxed text-pretty">{p.reason}</p>
                  )}
                </div>
                <OrganiserButtons id={p.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-bold">
          Festivals to publish{" "}
          <span className="text-ink/50 font-normal">({pendingFestivals.length})</span>
        </h2>
        {pendingFestivals.length === 0 ? (
          <p className="text-ink/60 mt-3 text-sm">Nothing waiting.</p>
        ) : (
          <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
            {pendingFestivals.map((f) => (
              <li key={f.id} className="flex items-start justify-between gap-6 py-5">
                <div className="min-w-0">
                  <p className="font-bold">{f.name}</p>
                  <p className="text-ink/60 font-mono text-sm">
                    /{f.marker}
                    {f.place ? ` · ${f.place}` : ""}
                  </p>
                </div>
                <FestivalButtons id={f.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
