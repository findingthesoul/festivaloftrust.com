import { ShapeGrid } from "@/components/ShapeGrid";
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
    <main className="mx-auto w-full max-w-5xl px-6 sm:px-10">
      {/* Hero */}
      <section className="flex min-h-dvh flex-col gap-12 py-8 sm:py-12">
        <h1 className="text-green text-center text-[clamp(1.35rem,4.5vw,3.25rem)] font-bold tracking-[-0.01em] text-balance">
          CAPE TOWN <span className="font-normal">|</span> 25.09.2026
        </h1>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-7 sm:flex-row sm:gap-9">
            <ShapeGrid className="h-32 w-32 shrink-0 sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-52 lg:w-52" />
            <Wordmark className="h-24 w-auto sm:h-36 md:h-44 lg:h-52" />
          </div>
        </div>

        <p className="text-center text-[clamp(1rem,2vw,1.35rem)] text-balance">
          A gathering about trust — how we build it, lose it, and rebuild it
          together.
        </p>
      </section>

      {/* Narrative */}
      <section className="mx-auto max-w-2xl space-y-6 border-t border-ink/15 py-20 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty sm:py-28">
        <p>
          Somewhere, a promise gets kept between two relatives. A neighbour
          shows up without being asked. A stranger returns a wallet, cash still
          inside. Trust still quietly holds.
        </p>
        <p>
          And somewhere else, it really is gone. Competition between colleagues
          at work. Tension between neighbours. Unsafety on the streets. It seems
          there are many places where trust has dispersed.
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
          Each festival is organised by the community itself, not delivered from
          outside. What starts as one pocket becomes part of something wider,
          community by community.
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
          Different starting point, same principle: trust grows by doing, not by
          saying so.
        </p>
      </section>

      <footer className="flex flex-col gap-3 border-t border-ink/15 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>Cape Town, 25 September 2026</p>
        {/* Displays the festival address but routes to Sjoerd's inbox: the
            hello@ mailbox does not exist yet. Deliberate, not a typo. */}
        <a
          href="mailto:s@soul.com"
          className="text-green font-medium underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
        >
          hello@festivaloftrust.com
        </a>
      </footer>
    </main>
  );
}
