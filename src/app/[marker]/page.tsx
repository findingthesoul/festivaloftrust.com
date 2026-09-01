import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BrandLockup } from "@/components/BrandLockup";
import { ShapeGrid } from "@/components/ShapeGrid";
import {
  agendaFor,
  attendeesFor,
  publicFestival,
  registrationFor,
  registrations,
} from "@/lib/festivals";
import { EnrolPopup, RegisterForm } from "./register-form";
import { RichText } from "@/components/RichText";

export const dynamic = "force-dynamic";

/**
 * The summary speaks the site's few marks; a meta description or a piece of
 * structured data wants plain words. Strip the marks, tighten the space,
 * keep it a sentence-or-three long.
 */
function plainSummary(text: string | null): string | undefined {
  if (!text) return undefined;
  const plain = text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain ? plain.slice(0, 300) : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ marker: string }>;
}): Promise<Metadata> {
  const { marker } = await params;
  const found = await publicFestival(marker);
  if (!found) return { title: "Not found" };
  const { festival, preview } = found;
  return {
    title: preview ? `Draft — ${festival.name}` : festival.name,
    // A draft is visible to its own people and to nobody else. Keeping it out
    // of search results is the other half of that.
    robots: preview ? { index: false, follow: false } : undefined,
    description: plainSummary(festival.summary),
    alternates: preview ? undefined : { canonical: `/${marker}` },
    openGraph: {
      title: festival.name,
      description: plainSummary(festival.summary),
      images: festival.cover_url ? [festival.cover_url] : undefined,
    },
  };
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;
  // A draft is not "forbidden", it is nothing — to anyone but its own
  // organiser and hosts, who are previewing what they are about to publish.
  const found = await publicFestival(marker);
  if (!found) notFound();
  const { festival, preview } = found;
  const registration = await registrationFor(festival);
  const agenda = festival.show_public_agenda ? await agendaFor(festival.id) : [];

  // Who is coming — names only, and only when the organiser switched it on.
  // Admitted guests from the platform plus the site's own book; nobody still
  // waiting for a decision, and never a technical id in place of a name.
  let guests: string[] = [];
  if (festival.share_participants_public) {
    try {
      const [people, attendees] = await Promise.all([
        registrations(festival),
        attendeesFor(festival.id),
      ]);
      const bookByEmail = new Map(
        attendees.map((a) => [a.email.toLowerCase(), a] as const),
      );
      const seen = new Set<string>();
      for (const e of people) {
        if (e.awaiting_approval) continue;
    if (e.status === "declined" || e.status === "cancelled") continue;
        const email = (e.email ?? "").toLowerCase();
        const book = email ? bookByEmail.get(email) : undefined;
        if (book) seen.add(book.id);
        const name = e.full_name?.trim() || book?.name;
        if (name) guests.push(name);
      }
      for (const a of attendees) {
        if (!seen.has(a.id)) guests.push(a.name);
      }
    } catch {
      // The page still opens; the list simply stays empty this visit.
      guests = [];
    }
  }

  return (
    <main className="flex-1">
      {/* Structured data: the event as search engines read one. Drafts are
          noindexed, so they carry none. */}
      {!preview && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              name: festival.name,
              ...(festival.starts_on
                ? { startDate: festival.starts_on, endDate: festival.starts_on }
                : {}),
              eventAttendanceMode:
                "https://schema.org/OfflineEventAttendanceMode",
              ...(festival.place
                ? {
                    location: {
                      "@type": "Place",
                      name: festival.place,
                      address: festival.place,
                    },
                  }
                : {}),
              ...(festival.cover_url ? { image: [festival.cover_url] } : {}),
              ...(plainSummary(festival.summary)
                ? { description: plainSummary(festival.summary) }
                : {}),
              organizer: {
                "@type": "Organization",
                name: "Festival of Trust",
                url: "https://www.festivaloftrust.com",
              },
              url: `https://www.festivaloftrust.com/${festival.marker}`,
            }),
          }}
        />
      )}
      {preview && (
        <p className="bg-ink text-cream px-6 py-2.5 text-center text-sm">
          Draft — only the people working on this festival can see this page.
        </p>
      )}
      {/* The event's own poster, cut like the home page's: the photo takes
          the whole screen with the cream nav floating over it — but here the
          title is the largest thing on the sheet, and the logo sits quietly
          as the nine-form block beside the name, bottom right. */}
      <section className="relative h-dvh w-full">
        {festival.cover_url ? (
          <Image
            src={festival.cover_url}
            alt=""
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          // No cover yet: ink instead of a photo, so the cream nav and title
          // stay legible and the coloured mark carries the sheet.
          <div className="bg-ink absolute inset-0 flex items-center justify-center">
            <ShapeGrid className="w-[min(60vw,24rem)]" loading="eager" />
          </div>
        )}

        {/* Soft fades where type sits on the photograph. */}
        <div
          aria-hidden="true"
          className="from-ink/40 pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b to-transparent"
        />
        <div
          aria-hidden="true"
          className="from-ink/50 pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t to-transparent"
        />

        <h1 className="text-cream absolute top-10 left-1/2 z-10 w-[94%] -translate-x-1/2 text-center text-[clamp(2.4rem,7.5vw,5.75rem)] uppercase leading-[1.05] font-bold tracking-[-0.02em] text-balance">
          {festival.name}
        </h1>

        <BrandLockup className="absolute right-[6%] bottom-[8%] z-10 h-12 sm:h-14" />
      </section>

      {/* Content on the left, the registration desk on the right — the whole
          visit, including registering, happens on this page. */}
      <section className="mx-auto grid w-full max-w-5xl gap-x-14 gap-y-12 px-6 py-16 sm:px-10 sm:py-24 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
        <p className="text-green text-[clamp(1.1rem,3.5vw,2rem)] font-bold tracking-[-0.01em] text-balance uppercase">
          {festival.place ?? "Festival of Trust"}
          {festival.starts_on && (
            <>
              {" "}
              <span className="font-normal">|</span>{" "}
              {dateFormat.format(new Date(festival.starts_on))}
            </>
          )}
        </p>

        {festival.summary && (
          <div className="mt-6 max-w-2xl space-y-4 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
            <RichText text={festival.summary} />
          </div>
        )}

        {/* Every festival page says what a Festival of Trust is — the page
            must stand even before its organisers have written a word. */}
        <p className="text-ink/70 mt-6 max-w-2xl leading-relaxed text-pretty">
          A Festival of Trust is a one-day gathering that helps a community
          notice the trust it already holds and grow it — organised by the
          community itself, not delivered from outside. Where trust exists,
          it deserves celebration; where it is missing, it gets built. Not
          from above — from where each of us stands.
        </p>

        {/* The day, when the organiser has chosen to show it. An empty agenda
            with the switch on shows nothing rather than an empty heading. */}
        {agenda.length > 0 && (
          <div className="border-ink/15 mt-14 border-t pt-8">
            <h2 className="text-2xl font-bold tracking-[-0.01em] sm:text-3xl">
              Agenda
            </h2>
            <ul className="divide-ink/10 mt-6 max-w-2xl divide-y">
              {agenda.map((item) => (
                <li key={item.id} className="py-5 first:pt-0">
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  {item.description && (
                    <div className="mt-1.5 space-y-2 leading-relaxed text-pretty">
                      <RichText text={item.description} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        </div>

        {/* The registration desk. When the doors are not open, saying so is
            better than a form that does nothing. */}
        <aside className="self-start lg:sticky lg:top-8">
          <div className="border-ink/15 rounded-xl border bg-white/50 p-6 sm:p-7">
            {registration?.open ? (
              festival.public_interaction === "popup" ? (
                <EnrolPopup
                  marker={festival.marker}
                  requiresApproval={festival.requires_approval}
                />
              ) : (
                <RegisterForm
                  marker={festival.marker}
                  requiresApproval={festival.requires_approval}
                />
              )
            ) : (
              <>
                <h2 className="text-xl font-bold">Register</h2>
                <p className="text-ink/60 mt-3 text-sm leading-relaxed">
                  Registration opens closer to the day.
                </p>
              </>
            )}
          </div>

          {/* Who invites you, in their own words — written in settings. */}
          {festival.organiser_note && (
            <div className="border-ink/15 mt-6 rounded-xl border bg-white/50 p-6 sm:p-7">
              <h2 className="text-xl font-bold">The organisers</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-pretty">
                <RichText text={festival.organiser_note} />
              </div>
            </div>
          )}

          {/* The guests, by name, when the organiser shares them. */}
          {festival.share_participants_public && guests.length > 0 && (
            <div className="border-ink/15 mt-6 rounded-xl border bg-white/50 p-6 sm:p-7">
              <h2 className="text-xl font-bold">Who is coming</h2>
              <p className="text-ink/60 mt-1 text-xs">
                {guests.length} {guests.length === 1 ? "person" : "people"} so far
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-1.5 gap-y-1 text-sm leading-relaxed">
                {guests.map((name, i) => (
                  <li key={i}>
                    {name}
                    {i < guests.length - 1 && <span className="text-ink/40">,</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Where to be and what to bring — written in settings. */}
          {festival.practical_info && (
            <div className="border-ink/15 mt-6 rounded-xl border bg-white/50 p-6 sm:p-7">
              <h2 className="text-xl font-bold">Practical information</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-pretty">
                <RichText text={festival.practical_info} />
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
