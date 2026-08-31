import Link from "next/link";
import { HeroPoster, type HeroSlide } from "@/components/HeroPoster";
import { homeSlides } from "@/lib/photos";

// The hero rotates through photos festivals offered — those come and go
// without a deploy.
export const dynamic = "force-dynamic";

/** The close-up the site opened with, first in every rotation. */
const BUILTIN: HeroSlide = { url: null, credit: "Cape Town 2026", logo: null };

const WAYS = [
  {
    accent: "bg-teal",
    title: "Communities",
    body: "Communities host a Festival of Trust with the backing of a funder, someone who believes trust is worth investing in, and wants to see it grow at ground level.",
  },
  {
    accent: "bg-yellow",
    title: "Organisations",
    body: "Organisations host a Festival of Trust inside their own walls, to grow trust among their own people.",
  },
];

export default async function Home() {
  // Never fatal: a home page that cannot reach the photo list still opens
  // with its own poster.
  const offered = await homeSlides().catch(() => []);
  return (
    <>
      <HeroPoster
        slides={[
          BUILTIN,
          ...offered.map((s) => ({
            url: s.url,
            credit: s.credit,
            logo: s.logo,
          })),
        ]}
      />

      {/* scroll-mt clears the fixed nav bar, which otherwise covers the top
          of the story when the Read on link jumps here. */}
      <main
        id="story"
        className="mx-auto w-full max-w-5xl scroll-mt-20 px-6 sm:px-10"
      >
        {/* Narrative */}
        <section className="mx-auto max-w-2xl space-y-6 border-t border-ink/15 py-20 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty sm:py-28">
          {/* Opening spread of the brochure: sets up the turn the rest of the
              page depends on, so it reads as display type, not body copy. */}
          <p className="text-[clamp(1.6rem,4.5vw,2.75rem)] leading-[1.15] font-bold tracking-[-0.02em] text-balance">
            Trust seems to be disappearing everywhere.
            <span className="text-green block">
              But look closer, and the picture is not that grim.
            </span>
          </p>

          <p>
            Somewhere, a promise gets kept between two relatives. A neighbour
            shows up without being asked. A stranger returns a wallet, cash
            still inside. Trust still quietly holds.
          </p>
          <p>
            And somewhere else, it really is gone. Competition between
            colleagues at work. Tension between neighbours. Unsafety on the
            streets. It seems there are many places where trust has dispersed.
          </p>
          <p>
            Society cannot run without it. So where it exists, it needs
            celebration. And where it is missing, it requires building. Not from
            above. From where each of us stands.
          </p>
          <p>
            Pocket by pocket, connected, and the world starts to look less
            trustless than the story suggests.
          </p>
        </section>

        {/* Tagline */}
        <section className="border-t border-ink/15 py-20 sm:py-28">
          <p className="text-green text-center text-[clamp(2rem,7vw,4.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
            Grow trust,
            <br />
            one pocket at a time.
          </p>
        </section>

        {/* What it is */}
        <section className="mx-auto max-w-2xl space-y-6 border-t border-ink/15 py-20 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty sm:py-28">
          <h2 className="sr-only">What the Festival of Trust is</h2>
          <p>
            Festival of Trust is a grassroots movement. It finds trust where it
            already lives, and celebrates it in the open. It gathers people who
            want to learn, together, how trust gets built where it is missing.
          </p>
          <p>
            Each festival is organised by the community itself, not delivered
            from outside. What starts as one pocket becomes part of something
            wider, community by community.
          </p>
        </section>

        {/* Two ways */}
        <section className="border-t border-ink/15 py-20 sm:py-28">
          <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold tracking-[-0.02em]">
            This happens in two ways.
          </h2>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-12">
            {WAYS.map((way) => (
              <div key={way.title}>
                <div className={`h-3 w-16 ${way.accent}`} />
                <h3 className="mt-5 text-xl font-bold sm:text-2xl">
                  {way.title}
                </h3>
                <p className="mt-3 leading-relaxed text-pretty">{way.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 max-w-2xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
            Different starting point, same principle: trust grows by doing, not
            by saying so.
          </p>

          <Link
            href="/join"
            className="bg-green text-cream mt-12 inline-block px-7 py-3.5 text-lg font-medium transition-opacity hover:opacity-85"
          >
            Host a festival
          </Link>
        </section>
      </main>
    </>
  );
}
