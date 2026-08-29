import type { Metadata } from "next";
import { FestivalCard } from "@/components/FestivalCard";
import { NineSteps } from "@/components/NineSteps";

export const metadata: Metadata = { title: "About" };

// Full-screen sheets, one colour each, hand-set for rhythm: no two
// neighbours share a colour, and the ink sheet never sits against the ink
// footer.
export default function Page() {
  return (
    <main className="w-full flex-1">
      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10 sm:py-20">
        <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
          About
        </h1>
        <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
          Festival of Trust is a grassroots movement: finding trust where it
          already lives, and building it where it is missing.
        </p>
      </section>

      <FestivalCard tone="yellow" kicker="The movement" title="Grow trust, one pocket at a time">
        <p>
          An independent format, with soul inside: a grassroots movement,
          created and carried by Tahirih and Sjoerd, and brought to the world
          by Solidarity Lab.
        </p>
        <p>
          A Festival of Trust is a one-day (or multi-part) gathering that
          helps a community notice the trust it already holds and grow it.
          Each festival is named for its place — Festival of Trust Cape Town
          — and organised by the people it is for.
        </p>
      </FestivalCard>

      <FestivalCard tone="magenta" kicker="The concept" title="Start from the tension, then turn">
        <p>
          We do not claim trust is fine. We hold both truths. Trust seems to
          be disappearing: rivalry at work, tension between neighbours,
          unsafe streets. But look closer, and trust still quietly holds: a
          promise kept between relatives, a neighbour who shows up unasked, a
          stranger who returns a wallet with the cash still inside.
        </p>
        <p>
          Society cannot run without trust. Where it exists, it deserves
          celebration. Where it is missing, it must be built. Not from above
          — from where each of us stands. Pocket by pocket, connected, the
          world starts to look less trustless than the story suggests.
        </p>
        <p className="font-bold">Trust grows by doing, not by saying so.</p>
      </FestivalCard>

      <FestivalCard tone="indigo" kicker="Pockets and the web" title="A single pocket is fragile. A web of pockets holds weight.">
        <p>
          Trust already lives in small pockets: a friendship, a neighbour, a
          trusted teacher. The festival helps people notice those pockets and
          draw them closer, so scattered points connect into threads, and
          threads into a web.
        </p>
        <p>
          Each festival adds pockets and threads; the festivals themselves
          connect into a wider web, community by community.
        </p>
      </FestivalCard>

      <FestivalCard tone="blush" kicker="Two ways" title="One method, two entry points">
        <p>
          <strong>Communities</strong> host a Festival of Trust in their own
          place, with the backing of a funder who believes trust is worth
          investing in and wants to see it grow at ground level.
        </p>
        <p>
          <strong>Organisations</strong> host one inside their own walls, to
          grow trust among their own people.
        </p>
        <p>
          Both share the same nine steps, the same movements, the same visual
          system — and the same stance: notice before building, invite never
          instruct, measure by what continues after people go home.
        </p>
      </FestivalCard>

      <FestivalCard tone="ink" kicker="The method made visible" title="Nine steps, nine marks, one grid">
        <p>
          Each step carries its own mark, built from three primitives —
          circle, triangle, square — by cutting, rotating and combining.
          Colour marks the phase, not the step. The marks live on a grid of
          nine cells, three rows of three, one row per phase: separate
          pieces, drawn into a composition, on a grid that holds them
          together. The brand&rsquo;s own logic, and the festival&rsquo;s.
        </p>
        <NineSteps />
      </FestivalCard>

      <FestivalCard tone="orange" kicker="The organisation" title="Solidarity Lab, partner of soul.com">
        <p>
          Festival of Trust is an initiative of Solidarity Lab B.V.
          (Rotterdam, the Netherlands), partner of{" "}
          <a
            href="https://soul.com"
            className="font-bold underline decoration-2 underline-offset-4"
          >
            soul.com
          </a>
          .
        </p>
        <p>
          Write to{" "}
          <a
            href="mailto:hello@festivaloftrust.com"
            className="font-bold underline decoration-2 underline-offset-4"
          >
            hello@festivaloftrust.com
          </a>
          .
        </p>
      </FestivalCard>
    </main>
  );
}
