import type { Metadata } from "next";
import Link from "next/link";
import { FestivalCard } from "@/components/FestivalCard";

export const metadata: Metadata = { title: "For organisations" };

// Colour order is hand-set for rhythm: no two neighbours share a colour, so
// scrolling reads as moving through the phases.
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
        For organisations
      </h1>
      <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
        How an organisation hosts a Festival of Trust inside its own walls, to
        grow trust among its own people.
      </p>

      <div className="mt-14 space-y-6">
        <FestivalCard tone="indigo" kicker="The idea" title="Inside your own walls">
          <p>
            Competition between colleagues, distance between teams — trust
            disperses inside organisations the way it does on streets. An
            organisation hosts a Festival of Trust for its own people, and
            builds it the same way a neighbourhood does: not from above, but
            from where each person stands.
          </p>
        </FestivalCard>

        <FestivalCard tone="orange" kicker="The principle" title="Trust grows by doing">
          <p>
            Not by saying so. The festival is a day of practising trust —
            celebrating where it already holds between people, and working
            openly on the places where it is missing.
          </p>
        </FestivalCard>

        <FestivalCard tone="blush" kicker="The method" title="The same nine steps">
          <p>
            Listen, Gather, Align. Connect, Design, Invite. Host, Harvest,
            Grow. The method is the same wherever trust is grown — the
            organisers are your own people, and the planner walks the steps
            with them.
          </p>
        </FestivalCard>

        <FestivalCard tone="magenta" kicker="The start" title="Bring it inside">
          <p>
            Different starting point, same principle.{" "}
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
