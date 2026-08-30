import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { allLogos, fallbackLogoSvg, logoSvg } from "@/lib/logos";
import { upcomingFestivals } from "@/lib/festivals";

export const metadata: Metadata = { title: "Upcoming" };

// The calendar moves without a deploy: a festival publishes, a date passes.
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function Page() {
  const festivals = await upcomingFestivals();
  // Posters without a photo wear the festival's own composition instead.
  const logos = await allLogos().catch(() => []);
  const logoOf = new Map(
    logos.filter((l) => l.claimed_by).map((l) => [l.claimed_by, l.form]),
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
        Upcoming
      </h1>
      <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
        Festivals being planned and hosted, community by community.
      </p>

      {festivals.length === 0 ? (
        <p className="text-ink/60 mt-14">
          No festivals published yet — the next one starts with someone
          deciding to{" "}
          <Link
            href="/join"
            className="text-green font-medium underline decoration-2 underline-offset-4 hover:opacity-70"
          >
            host it
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2">
          {festivals.map((festival) => (
            <li key={festival.id}>
              <Link href={`/${festival.marker}`} className="group block">
                {/* The card is the event's poster in miniature: title on the
                    picture, place and date beneath it, nothing more. */}
                <div className="border-ink/10 relative aspect-[3/2] w-full overflow-hidden border">
                  {festival.cover_url ? (
                    <Image
                      src={festival.cover_url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 448px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="bg-cream flex h-full items-center justify-center p-8">
                      <div
                        className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            const form = logoOf.get(festival.id);
                            return form
                              ? logoSvg(form, `up${festival.id.slice(0, 8)}`)
                              : fallbackLogoSvg(festival.marker);
                          })(),
                        }}
                      />
                    </div>
                  )}
                  <div
                    aria-hidden="true"
                    className="from-ink/60 pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent"
                  />
                  <h2 className="text-cream absolute inset-x-4 bottom-3 text-xl leading-tight font-bold tracking-[-0.01em] text-balance uppercase sm:text-2xl">
                    {festival.name}
                  </h2>
                </div>
                <p className="text-green mt-3 text-sm font-bold tracking-[-0.01em] uppercase">
                  {festival.place ?? "Festival of Trust"}
                  {festival.starts_on && (
                    <>
                      {" "}
                      <span className="font-normal">|</span>{" "}
                      {dateFormat.format(new Date(festival.starts_on))}
                    </>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
