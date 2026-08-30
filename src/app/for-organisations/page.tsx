import type { Metadata } from "next";
import closeUp from "@/assets/close-up.jpg";
import { CardSheets } from "@/components/CardSheets";
import { PageHero } from "@/components/PageHero";
import { NineSteps } from "@/components/NineSteps";

export const metadata: Metadata = { title: "For organisations" };

export default function Page() {
  return (
    <main className="w-full flex-1">
      {/* Placeholder photo until the page's own picture arrives — one
          import to swap. */}
      <PageHero photo={closeUp} title="For organisations" intro="How an organisation hosts a Festival of Trust inside its own walls, to grow trust among its own people." />

      <CardSheets
        sheets={[
          {
            tone: "indigo",
            kicker: "Organisations",
            title: "Inside your own walls",
            body: (
              <>
                <p>
                  An organisation hosts a Festival of Trust inside its own
                  walls, to grow trust among its own people. One method, two
                  entry points: communities and organisations share the same
                  nine steps, the same movements, the same visual system —
                  what changes is who initiates, and where the day takes
                  place.
                </p>
                <p>
                  A Festival of Trust is a one-day (or multi-part) gathering
                  that helps your people notice the trust they already hold
                  and grow it — organised by your own people, not delivered
                  from outside.
                </p>
              </>
            ),
          },
          {
            tone: "yellow",
            kicker: "The concept",
            title: "Start from the tension, then turn",
            body: (
              <>
                <p>
                  We do not claim trust is fine. We hold both truths. Trust
                  seems to be disappearing: rivalry at work, distance between
                  teams, decisions nobody quite stands behind. But look
                  closer, and trust still quietly holds: a promise kept
                  between colleagues, someone who shows up unasked, work
                  handed over without a second thought.
                </p>
                <p>
                  An organisation cannot run without trust. Where it exists,
                  it deserves celebration. Where it is missing, it must be
                  built. Not from above — from where each person stands.
                </p>
                <p className="font-bold">
                  Trust grows by doing, not by saying so.
                </p>
              </>
            ),
          },
          {
            tone: "blush",
            kicker: "The stance",
            title: "The festival walks alongside. It does not instruct.",
            body: (
              <>
                <p>
                  The organiser is an accompanier, not an expert. Three
                  commitments run through every festival:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Notice before building.</li>
                  <li>Invite, never instruct.</li>
                  <li>Measure by what continues after people go back to work.</li>
                </ul>
              </>
            ),
          },
          {
            tone: "ink",
            kicker: "The method",
            title: "Nine steps, three phases",
            body: (
              <>
                <p>
                  The process moves in one direction: purpose, then
                  relationships, then design, then action, then learning. The
                  planner walks them with you.
                </p>
                <NineSteps />
              </>
            ),
          },
          {
            tone: "magenta",
            kicker: "The start",
            title: "Bring it inside",
            body: (
              <p>
                Different starting point, same principle: trust grows by
                doing. A web of pockets holds weight — inside an organisation
                as much as on a street.
              </p>
            ),
            ctas: [
              { href: "/join", label: "Host a festival" },
              { href: "/contact", label: "Talk to us first", secondary: true },
            ],
          },
        ]}
      />
    </main>
  );
}
