import type { Metadata } from "next";
import Link from "next/link";
import { FestivalCard } from "@/components/FestivalCard";
import { NineSteps } from "@/components/NineSteps";

export const metadata: Metadata = { title: "For organisations" };

// Full-screen sheets, one colour each, hand-set for rhythm: no two
// neighbours share a colour, and the ink sheet never sits against the ink
// footer.
export default function Page() {
  return (
    <main className="w-full flex-1">
      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:px-10 sm:py-20">
        <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
          For organisations
        </h1>
        <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
          How an organisation hosts a Festival of Trust inside its own walls,
          to grow trust among its own people.
        </p>
      </section>

      <FestivalCard tone="indigo" kicker="Organisations" title="Inside your own walls">
        <p>
          An organisation hosts a Festival of Trust inside its own walls, to
          grow trust among its own people. One method, two entry points:
          communities and organisations share the same nine steps, the same
          movements, the same visual system — what changes is who initiates,
          and where the day takes place.
        </p>
        <p>
          A Festival of Trust is a one-day (or multi-part) gathering that
          helps your people notice the trust they already hold and grow it —
          organised by your own people, not delivered from outside.
        </p>
      </FestivalCard>

      <FestivalCard tone="yellow" kicker="The concept" title="Start from the tension, then turn">
        <p>
          We do not claim trust is fine. We hold both truths. Trust seems to
          be disappearing: rivalry at work, distance between teams, decisions
          nobody quite stands behind. But look closer, and trust still
          quietly holds: a promise kept between colleagues, someone who shows
          up unasked, work handed over without a second thought.
        </p>
        <p>
          An organisation cannot run without trust. Where it exists, it
          deserves celebration. Where it is missing, it must be built. Not
          from above — from where each person stands.
        </p>
        <p className="font-bold">Trust grows by doing, not by saying so.</p>
      </FestivalCard>

      <FestivalCard tone="blush" kicker="The stance" title="The festival walks alongside. It does not instruct.">
        <p>
          The organiser is an accompanier, not an expert. Three commitments
          run through every festival:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Notice before building.</li>
          <li>Invite, never instruct.</li>
          <li>Measure by what continues after people go back to work.</li>
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

      <FestivalCard tone="magenta" kicker="The start" title="Bring it inside">
        <p>
          Different starting point, same principle: trust grows by doing. A
          web of pockets holds weight — inside an organisation as much as on
          a street.
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
