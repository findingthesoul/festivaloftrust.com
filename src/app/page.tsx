import Image from "next/image";
import Link from "next/link";
import closeUp from "@/assets/close-up.jpg";
import { Wordmark } from "@/components/Wordmark";

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

export default function Home() {
  return (
    <>
      {/* The close-up poster, read in the order it is read on paper: the title
          across the top, then the photograph running the full width of the
          sheet with nothing in the margins beside it. */}
      <section className="w-full">
        <div className="mx-auto flex w-full max-w-5xl justify-center px-6 pt-2 pb-10 sm:px-10 sm:pt-6 sm:pb-14">
          <h1>
            <Wordmark className="w-[min(72vw,17rem)] sm:w-[24rem] md:w-[30rem]" />
          </h1>
        </div>

        {/* Full bleed without 100vw. This div is a child of the body rather
            than of the max-w-5xl container, so its width is already the page
            minus the scrollbar — 100vw would count the scrollbar in and give
            the body a sideways scroll on every desktop browser that reserves
            one.

            The ratios step from the poster's portrait close-up on a phone,
            through the photograph's own 3:2 on a tablet, to a band on a wide
            screen — so the two crops that do happen cut the axis with the most
            to spare. Capped at one screenful because a hero taller than the
            window hides that there is a page under it. */}
        <div className="relative aspect-[4/5] max-h-dvh w-full sm:aspect-[3/2] lg:aspect-[2/1]">
          <Image
            src={closeUp}
            alt="A child in bright pink sunglasses, standing close among others at a festival."
            fill
            preload
            sizes="100vw"
            // Held above centre: the faces sit in the top third of the frame,
            // and a plain centre crop takes the tops of their heads off.
            className="object-[center_30%] object-cover"
          />
        </div>

        <div className="flex justify-center py-10">
          <a
            href="#story"
            aria-label="Scroll down to read more"
            className="group text-green inline-flex flex-col items-center gap-1"
          >
            <span className="text-xs tracking-[0.15em] uppercase">Read on</span>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-6 w-6 animate-bounce motion-reduce:animate-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
        </div>
      </section>

      <main
        id="story"
        className="mx-auto w-full max-w-5xl scroll-mt-4 px-6 sm:px-10"
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
