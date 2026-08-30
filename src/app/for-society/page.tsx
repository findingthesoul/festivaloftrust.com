import type { Metadata } from "next";
import photo from "@/assets/society.jpg";
import { CardSheets } from "@/components/CardSheets";
import { PageHero } from "@/components/PageHero";
import { NineSteps } from "@/components/NineSteps";

export const metadata: Metadata = { title: "For society" };

export default function Page() {
  return (
    <main className="w-full flex-1">

      <CardSheets
        hero={<PageHero photo={photo} photoAlt="A community celebrating under bunting, dressed in white, laughing." title="For society" intro="How a community hosts a Festival of Trust in its own place, with the backing of a funder." />}
        sheets={[
          {
            tone: "yellow",
            text: "left",
            shapes: "top",
            kicker: "Communities",
            title: "Hosted by the community, backed by a funder",
            body: (
              <>
                <p>
                  A community hosts a Festival of Trust with the backing of a
                  funder — someone who believes trust is worth investing in,
                  and wants to see it grow at ground level.
                </p>
                <p>
                  A Festival of Trust is a one-day (or multi-part) gathering
                  that helps a community notice the trust it already holds and
                  grow it. It is organised by the community itself, not
                  delivered from outside: the same streets, the same faces,
                  one day that belongs to them.
                </p>
              </>
            ),
          },
          {
            tone: "magenta",
            text: "right",
            shapes: "bottom",
            kicker: "The concept",
            title: "Start from the tension, then turn",
            body: (
              <>
                <p>
                  We do not claim trust is fine. We hold both truths. Trust
                  seems to be disappearing: rivalry at work, tension between
                  neighbours, unsafe streets. But look closer, and trust still
                  quietly holds: a promise kept between relatives, a neighbour
                  who shows up unasked, a stranger who returns a wallet with
                  the cash still inside.
                </p>
                <p>
                  Society cannot run without trust. Where it exists, it
                  deserves celebration. Where it is missing, it must be built.
                  Not from above — from where each of us stands. Pocket by
                  pocket, connected, the world starts to look less trustless
                  than the story suggests.
                </p>
                <p className="font-bold">
                  Trust grows by doing, not by saying so.
                </p>
              </>
            ),
          },
          {
            tone: "indigo",
            text: "left",
            shapes: "bottom",
            kicker: "Pockets and the web",
            title: "A single pocket is fragile. A web of pockets holds weight.",
            body: (
              <>
                <p>
                  Trust already lives in small pockets: a friendship, a
                  neighbour, a trusted teacher. The festival helps people
                  notice those pockets and draw them closer, so scattered
                  points connect into threads, and threads into a web.
                </p>
                <p>
                  Each festival adds pockets and threads; the festivals
                  themselves connect into a wider web, community by community.
                </p>
              </>
            ),
          },
          {
            tone: "blush",
            text: "right",
            shapes: "top",
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
                  <li>Measure by what continues after people go home.</li>
                </ul>
              </>
            ),
          },
          {
            tone: "ink",
            text: "left",
            shapes: "top",
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
            tone: "orange",
            text: "right",
            shapes: "bottom",
            kicker: "The start",
            title: "It begins with someone deciding to host",
            body: (
              <p>
                Every festival is named for its place — Festival of Trust Cape
                Town, Festival of Trust Rotterdam Zuid. What starts as one
                pocket becomes part of something wider, community by
                community.
              </p>
            ),
            ctas: [
              { href: "/join", label: "Host a festival" },
              { href: "/upcoming", label: "See upcoming festivals", secondary: true },
            ],
          },
        ]}
      />
    </main>
  );
}
