import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { standing } from "@/lib/organiser";
import Link from "next/link";
import { FestivalButtons, HomePhotoButtons, OrganiserButtons } from "./review-buttons";

export const metadata: Metadata = { title: "Review", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ organiser?: string; tab?: string }>;
}) {
  const { organiser: pickedOrganiser, tab } = await searchParams;
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
  const [
    { data: allOrganisers },
    { data: everyFestivalRaw },
    { data: memberships },
    { data: homePhotoRows },
  ] = await Promise.all([
    supabase
      .from("organiser")
      .select("id, email, full_name, organisation")
      .eq("status", "approved")
      .order("full_name", { ascending: true, nullsFirst: false }),
    // No embed: festival.owner_id and organiser.id both point at auth.users,
    // and there is no foreign key BETWEEN them for PostgREST to follow. Joined
    // by hand below rather than adding one for a listing.
    supabase
      .from("festival")
      .select("id, name, marker, place, status, starts_on, owner_id")
      .order("created_at", { ascending: false }),
    supabase.from("festival_member").select("user_id"),
    // The home page's wardrobe: every photo festivals have offered. Fails
    // soft to an empty list where the photo table is not migrated yet.
    supabase
      .from("photo")
      .select("id, url, credit, festival_id")
      .eq("home", true)
      .order("created_at"),
  ]);

  const organisers = allOrganisers ?? [];
  const byOwner = new Map(organisers.map((o) => [o.id, o]));
  const everyFestival = (everyFestivalRaw ?? []).filter(
    (f) => !pickedOrganiser || f.owner_id === pickedOrganiser,
  );
  const pickedName = pickedOrganiser
    ? (byOwner.get(pickedOrganiser)?.full_name ?? byOwner.get(pickedOrganiser)?.email ?? "them")
    : null;

  // Inactive: approved, but on no festival at all — neither owning one nor
  // helping on one. The accounts that said yes and then never began.
  const activeIds = new Set([
    ...(everyFestivalRaw ?? []).map((f) => f.owner_id),
    ...((memberships ?? []) as { user_id: string }[]).map((m) => m.user_id),
  ]);
  const inactive = organisers.filter((o) => !activeIds.has(o.id));

  const festivalName = new Map(
    (everyFestivalRaw ?? []).map((f) => [f.id, f.name as string]),
  );
  const homePhotos = ((homePhotoRows ?? []) as {
    id: string;
    url: string;
    credit: string | null;
    festival_id: string;
  }[]).map((p) => ({ ...p, festival: festivalName.get(p.festival_id) ?? "a festival" }));

  const pendingPeople = people ?? [];
  const pendingFestivals = festivals ?? [];
  const live = liveFestivals ?? [];

  // Links, not client-side tabs: each one is an address, so a reviewer can
  // bookmark "everything by this organiser" and land back on it. It also keeps
  // the organiser filter below working without a second mechanism — both are
  // just the query string.
  //
  // The counts are the point of the row as much as the labels are: what a
  // reviewer wants first is whether anything is waiting at all.
  const TABS = [
    { key: "organisers", label: "Organisers", count: pendingPeople.length },
    { key: "submitted", label: "To publish", count: pendingFestivals.length },
    { key: "live", label: "Live", count: live.length },
    { key: "all", label: "Every festival", count: everyFestival.length },
    { key: "inactive", label: "Inactive", count: inactive.length },
    { key: "home", label: "Home photos", count: homePhotos.length },
  ] as const;

  // Default to whatever needs a person first — somebody waiting to be let in,
  // then a festival waiting to go out — rather than always the same tab.
  const active =
    TABS.some((t) => t.key === tab) && tab
      ? tab
      : pendingPeople.length > 0
        ? "organisers"
        : pendingFestivals.length > 0
          ? "submitted"
          : "all";

  const href = (key: string) =>
    key === "all" && pickedOrganiser
      ? `/admin?tab=all&organiser=${encodeURIComponent(pickedOrganiser)}`
      : `/admin?tab=${key}`;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <h1 className="text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.02em]">
        Review
      </h1>

      <nav
        aria-label="Review"
        className="border-ink/10 mt-6 flex gap-1 overflow-x-auto border-b"
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={href(t.key)}
            aria-current={t.key === active ? "page" : undefined}
            className={
              t.key === active
                ? "border-green -mb-px border-b-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap"
                : "text-ink/60 hover:text-ink -mb-px border-b-2 border-transparent px-4 py-2.5 text-sm whitespace-nowrap transition-colors"
            }
          >
            {t.label}{" "}
            <span className={t.key === active ? "text-ink/50 font-normal" : "text-ink/40"}>
              ({t.count})
            </span>
          </Link>
        ))}
      </nav>

      {active === "home" && (
        <section className="mt-10">
          {homePhotos.length === 0 ? (
            <p className="text-ink/60">
              Nothing offered yet. Organisers offer photos on their
              festival&rsquo;s Webpage tab; everything offered rotates on the
              home page and is listed here.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {homePhotos.map((p) => (
                <li key={p.id} className="border-ink/15 border bg-white/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="aspect-[3/2] w-full border-b border-ink/10 object-cover"
                  />
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{p.festival}</p>
                      <p className="text-ink/60 mt-0.5 text-sm">
                        {p.credit ?? "no credit"}
                      </p>
                    </div>
                    <HomePhotoButtons id={p.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {active === "inactive" && (
        <section className="mt-10">
          {inactive.length === 0 ? (
            <p className="text-ink/60 mt-3 text-sm">
              Nobody idle — every approved account is on a festival.
            </p>
          ) : (
            <ul className="divide-ink/10 border-ink/10 mt-5 divide-y border-y">
              {inactive.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-6 py-4">
                  <div className="min-w-0">
                    <p className="font-bold">{o.full_name ?? o.email}</p>
                    <p className="text-ink/60 text-sm">{o.email}</p>
                  </div>
                  <span className="text-ink/50 text-sm">approved, no festival yet</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {active === "organisers" && (
      <section className="mt-10">
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

      )}

      {active === "submitted" && (
      <section className="mt-10">
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

      )}

      {active === "live" && (
      <section className="mt-10">
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
      )}

      {active === "all" && (
      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold">
            {pickedName ? `Festivals by ${pickedName}` : "Every festival"}
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
                      {owner?.organisation?.trim() ||
                        owner?.full_name ||
                        owner?.email ||
                        "owner no longer an approved organiser"}
                    </p>
                  </div>
                  <span className="text-ink/60 shrink-0 text-sm capitalize">{f.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      )}
    </main>
  );
}
