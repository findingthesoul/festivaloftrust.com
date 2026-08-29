import type { Metadata } from "next";
import Link from "next/link";
import { FestivalCard } from "@/components/FestivalCard";
import { NineSteps } from "@/components/NineSteps";

export const metadata: Metadata = { title: "For society" };

// Full-screen sheets, one colour each, hand-set for rhythm: no two
// neighbours share a colour, and the ink sheet never sits against the ink
// footer.
export default function Page() {
  return (
    <main className="w-full flex-1">
      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10 sm:py-20">
        <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
          For society
        </h1>
        <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
          How a community hosts a Festival of Trust in its own place, with the
          backing of a funder.
        </p>
      </section>

      <FestivalCard tone="yellow" kicker="Communities" title="Hosted by the community, backed by a funder">
        <p>
          A community hosts a Festival of Trust with the backing of a funder —
          someone who believes trust is worth investing in, and wants to see
          it grow at ground level.
        </p>
        <p>
          A Festival of Trust is a one-day (or multi-part) gathering that
          helps a community notice the trust it already holds and grow it. It
          is organised by the community itself, not delivered from outside:
          the same streets, the same faces, one day that belongs to them.
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

      <FestivalCard tone="blush" kicker="The stance" title="The festival walks alongside. It does not instruct.">
        <p>
          The organiser is an accompanier, not an expert. Three commitments
          run through every festival:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Notice before building.</li>
          <li>Invite, never instruct.</li>
          <li>Measure by what continues after people go home.</li>
        </ul>
      </FestivalCard>

      <FestivalCard tone="ink" kicker="The method" title="Nine steps, three phases">
        <p>
          The process moves in one direction: purpose, then relationships,
          then design, then action, then learning. The planner walks them
          with you.
        </p>
        <NineSteps />
      </FestivalCard>

      <FestivalCard tone="orange" kicker="The start" title="It begins with someone deciding to host">
        <p>
          Every festival is named for its place — Festival of Trust Cape
          Town, Festival of Trust Rotterdam Zuid. What starts as one pocket
          becomes part of something wider, community by community.
        </p>
        <p>
          <Link
            href="/join"
            className="font-bold underline decoration-2 underline-offset-4"
          >
            Host a festival
          </Link>
        </p>
      </FestivalCard>
    </main>
  );
}
