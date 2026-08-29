import type { Metadata } from "next";
import { FestivalCard } from "@/components/FestivalCard";

export const metadata: Metadata = { title: "About" };

// Colour order is hand-set for rhythm: no two neighbours share a colour, so
// scrolling reads as moving through the phases.
export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
        About
      </h1>
      <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
        Festival of Trust is a grassroots movement: finding trust where it
        already lives, and building it where it is missing.
      </p>

      <div className="mt-14 space-y-6">
        <FestivalCard tone="yellow" kicker="The movement" title="Grow trust, one pocket at a time">
          <p>
            Trust seems to be disappearing everywhere — but look closer, and
            the picture is not that grim. Where it exists, it needs
            celebration. Where it is missing, it requires building. Not from
            above; from where each of us stands. Pocket by pocket, connected.
          </p>
        </FestivalCard>

        <FestivalCard tone="ink" kicker="The marks" title="The nine shapes are the method made visible">
          <p>
            Listen, Gather, Align, Connect, Design, Invite, Host, Harvest,
            Grow — nine steps, each with its own mark, on a grid that holds
            them together. Separate pieces, drawn into a composition: the
            brand&rsquo;s own logic, and the festival&rsquo;s.
          </p>
        </FestivalCard>

        <FestivalCard tone="orange" kicker="The festivals" title="Organised by the community itself">
          <p>
            Each festival is planned by the people it is for — a community in
            its own place, or an organisation inside its own walls — walking
            the nine steps from the first listening to what grows afterwards.
          </p>
        </FestivalCard>

        <FestivalCard tone="indigo" kicker="The organisation" title="Solidarity Lab, partner of soul.com">
          <p>
            Festival of Trust is an initiative of Solidarity Lab B.V.
            (Rotterdam, the Netherlands), partner of{" "}
            <a
              href="https://soul.com"
              className="font-medium underline decoration-2 underline-offset-4"
            >
              soul.com
            </a>
            . Write to{" "}
            <a
              href="mailto:hello@festivaloftrust.com"
              className="font-medium underline decoration-2 underline-offset-4"
            >
              hello@festivaloftrust.com
            </a>
            .
          </p>
        </FestivalCard>
      </div>
    </main>
  );
}
