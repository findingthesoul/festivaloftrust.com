import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { standing } from "@/lib/organiser";
import { FestivalButtons, OrganiserButtons } from "./review-buttons";

export const metadata: Metadata = { title: "Review", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ organiser?: string }>;
}) {
  const { organiser: pickedOrganiser } = await searchParams;
  const s = await standing();
  // Not a redirect: someone who is not an admin should not learn that this
  // page exists.
  if (s.state !== "approved" || !s.organiser.is_admin) notFound();

  const supabase = await serverSupabase();
  const [{ data: people }, { data: festivals }, { data: liveFestivals }] = await Promise.all([
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
    // Live festivals are listed here for one reason: this is the only screen
    // that can take one back down, and until it showed them there was no way
    // to undo a publish at all.
    supabase
      .from("festival")
      .select("id, name, marker, place, thread_id, approved_at")
      .eq("status", "live")
      .order("approved_at", { ascending: false }),
  ]);

  // Every festival, whoever owns it, so a reviewer can answer "what has this
  // organiser got on?" — which the three queues above cannot, each being a
  // slice of one moment rather than a directory.
  //
  // Deliberately NOT folded into "Your festivals": that list is what you own or
  // work on, and an admin seeing everybody's there would make the word "your"
  // a lie. Two questions, two screens.
  const [{ data: allOrganisers }, { data: everyFestivalRaw }] = await Promise.all([
    supabase
      .from("organiser")
      .select("id, email, full_name")
      .eq("status", "approved")
      .order("full_name", { ascending: true, nullsFirst: false }),
    // No embed: festival.owner_id and organiser.id both point at auth.users,
    // and there is no foreign key BETWEEN them for PostgREST to follow. Joined
    // by hand below rather than adding one for a listing.
    supabase
      .from("festival")
      .select("id, name, marker, place, status, starts_on, owner_id")
      .order("created_at", { ascending: false }),
  ]);

  const organisers = allOrganisers ?? [];
  const byOwner = new Map(organisers.map((o) => [o.id, o]));
  const everyFestival = (everyFestivalRaw ?? []).filter(
    (f) => !pickedOrganiser || f.owner_id === pickedOrganiser,
  );
  const pickedName = pickedOrganiser
    ? (byOwner.get(pickedOrganiser)?.full_name ?? byOwner.get(pickedOrganiser)?.email ?? "them")
    : null;

  const pendingPeople = people ?? [];
  const pendingFestivals = festivals ?? [];
  const live = liveFestivals ?? [];

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

      <section className="mt-14">
        <h2 className="text-xl font-bold">
          Live <span className="text-ink/50 font-normal">({live.length})</span>
        </h2>
        {live.length === 0 ? (
          <p className="text-ink/60 mt-3 text-sm">Nothing published yet.</p>
        ) : (
          <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
            {live.map((f) => (
              <li key={f.id} className="flex items-start justify-between gap-6 py-5">
                <div className="min-w-0">
                  <p className="font-bold">{f.name}</p>
                  <p className="text-ink/60 font-mono text-sm">
                    /{f.marker}
                    {f.place ? ` \u00b7 ${f.place}` : ""}
                  </p>
                  {!f.thread_id && (
                    <p className="mt-1 text-sm text-red-700">
                      No page in The Thread yet.
                    </p>
                  )}
                </div>
                <FestivalButtons id={f.id} live needsPage={!f.thread_id} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">
            {pickedName ? `Festivals by ${pickedName}` : "Every festival"}{" "}
            <span className="text-ink/50 font-normal">({everyFestival.length})</span>
          </h2>

          {/* A plain GET form: the choice is in the address, so it survives a
              reload and can be linked to. No client JavaScript for a filter. */}
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="organiser" className="text-ink/60 text-sm">
              Organiser
            </label>
            <select
              id="organiser"
              name="organiser"
              defaultValue={pickedOrganiser ?? ""}
              className="border-ink/20 rounded-md border bg-white px-2 py-1 text-sm"
            >
              <option value="">Everyone</option>
              {organisers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name ?? o.email}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="border-ink/20 rounded-md border px-3 py-1 text-sm font-medium"
            >
              Show
            </button>
          </form>
        </div>

        {everyFestival.length === 0 ? (
          <p className="text-ink/60 mt-3 text-sm">
            {pickedOrganiser ? "Nothing by them yet." : "No festivals yet."}
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
            {everyFestival.map((f) => {
              const owner = byOwner.get(f.owner_id);
              return (
                <li key={f.id} className="flex items-start justify-between gap-6 py-5">
                  <div className="min-w-0">
                    <p className="font-bold">{f.name}</p>
                    <p className="text-ink/60 font-mono text-sm">
                      /{f.marker}
                      {f.place ? ` \u00b7 ${f.place}` : ""}
                      {f.starts_on ? ` \u00b7 ${f.starts_on}` : ""}
                    </p>
                    {/* Whose it is, since this is the one list that mixes
                        owners — and an unknown owner is said out loud rather
                        than left blank, because blank reads as nobody's. */}
                    <p className="text-ink/50 mt-1 text-sm">
                      {owner?.full_name ?? owner?.email ?? "owner no longer an approved organiser"}
                    </p>
                  </div>
                  <span className="text-ink/60 shrink-0 text-sm capitalize">{f.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
