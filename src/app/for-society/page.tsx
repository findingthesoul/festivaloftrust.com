import type { Metadata } from "next";
import Link from "next/link";
import { FestivalCard } from "@/components/FestivalCard";

export const metadata: Metadata = { title: "For society" };

// Colour order is hand-set for rhythm: no two neighbours share a colour, so
// scrolling reads as moving through the phases.
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
        For society
      </h1>
      <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
        How a community hosts a Festival of Trust in its own place, with the
        backing of a funder.
      </p>

      <div className="mt-14 space-y-6">
        <FestivalCard tone="yellow" kicker="The idea" title="A festival, hosted by the neighbourhood">
          <p>
            A Festival of Trust is not delivered from outside. The community
            organises it itself — with the backing of a funder, someone who
            believes trust is worth investing in and wants to see it grow at
            ground level.
          </p>
        </FestivalCard>

        <FestivalCard tone="magenta" kicker="The reason" title="Trust still quietly holds">
          <p>
            Somewhere in every neighbourhood a promise gets kept, a neighbour
            shows up unasked, a wallet comes back with the cash still inside.
            The festival finds that trust and celebrates it in the open — and
            gathers people to learn, together, how trust gets built where it
            is missing.
          </p>
        </FestivalCard>

        <FestivalCard tone="blush" kicker="The method" title="Nine steps, three phases">
          <p>
            Listen, Gather, Align. Connect, Design, Invite. Host, Harvest,
            Grow. Every festival walks the same nine steps — first to hear
            the place, then to build the day, then to keep what it made. The
            planner walks them with you.
          </p>
        </FestivalCard>

        <FestivalCard tone="indigo" kicker="The start" title="It begins with someone deciding to host">
          <p>
            One pocket becomes part of something wider, community by
            community.{" "}
            <Link
              href="/join"
              className="font-medium underline decoration-2 underline-offset-4"
            >
              Host a festival
            </Link>
            .
          </p>
        </FestivalCard>
      </div>
    </main>
  );
}
