import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Funding",
  description:
    "Three ways to fund a Festival of Trust: host your own, back a local community's festival, or fund a series — like six festivals across South Africa in 2027.",
  alternates: { canonical: "/funding" },
};

/** The three doors a funder can walk through, in the home page's card manner. */
const WAYS = [
  {
    accent: "bg-yellow",
    title: "Fund your own",
    body: "Your organisation hosts a Festival of Trust inside its own walls, to grow trust among your own people. You carry it, you keep it — the nine steps run with your teams, guided by a facilitator.",
    cta: { href: "/for-organisations", label: "How organisations host" },
  },
  {
    accent: "bg-teal",
    title: "Back a local festival",
    body: "A community near you wants to host — a neighbourhood, a school, a village. Every festival is free for its visitors, so someone has to believe in it first. Your funding covers the kit, the facilitation and the organising; the community does the rest, and your name stands with theirs.",
    cta: { href: "/for-society", label: "How communities host" },
  },
  {
    accent: "bg-indigo",
    title: "Fund a series",
    body: "One festival grows a pocket; a sequence connects them. Funding partners can carry a whole run of festivals — like the national building days in South Africa in 2027, where the local soul.com team will organise six Festivals of Trust across different zones. One partner, six pockets of trust, one movement.",
    cta: { href: "/contact", label: "Talk to us" },
  },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2.2rem,6.5vw,4rem)] leading-[1.02] font-bold tracking-[-0.02em] text-balance">
        Funding
        <span className="text-green block">Trust is worth investing in.</span>
      </h1>

      <section className="mx-auto max-w-2xl space-y-6 pt-14 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty sm:pt-20">
        <p>
          Every Festival of Trust is free for the people who come — that is
          part of how it works. Which means every festival is carried by
          someone who wants to see trust grow at ground level: an
          organisation, a sponsor, a fund. The money is modest and concrete —
          a kit, a facilitator, the hours of organising — and the{" "}
          <Link
            href="/decade"
            className="text-green underline decoration-2 underline-offset-4 hover:opacity-70"
          >
            world has just declared a decade
          </Link>{" "}
          for exactly this kind of work.
        </p>
        <p>There are three ways in.</p>
      </section>

      <section className="mt-14 grid gap-10 sm:mt-16 sm:grid-cols-3 sm:gap-12">
        {WAYS.map((way) => (
          <div key={way.title} className="flex flex-col">
            <div className={`h-3 w-16 ${way.accent}`} />
            <h2 className="mt-5 text-xl font-bold sm:text-2xl">{way.title}</h2>
            <p className="mt-3 leading-relaxed text-pretty">{way.body}</p>
            {way.cta && (
              <Link
                href={way.cta.href}
                className="text-green mt-4 font-medium underline decoration-2 underline-offset-4 hover:opacity-70"
              >
                {way.cta.label} →
              </Link>
            )}
          </div>
        ))}
      </section>

      <section className="border-ink/15 mt-20 border-t py-16 text-center sm:py-20">
        <h2 className="text-[clamp(1.6rem,4.5vw,2.5rem)] font-bold tracking-[-0.02em] text-balance">
          Talk to us about funding a festival.
        </h2>
        <p className="text-ink/70 mx-auto mt-4 max-w-xl leading-relaxed text-pretty">
          One festival or a series, your own people or a community you
          believe in — tell us what you have in mind and we will bring the
          numbers, the method and the people who make it real.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <Link
            href="/contact"
            className="bg-green text-cream px-7 py-3.5 text-lg font-medium transition-opacity hover:opacity-85"
          >
            Start the conversation
          </Link>
          <a
            href="mailto:hello@festivaloftrust.com"
            className="text-ink/70 hover:text-ink underline decoration-2 underline-offset-4 transition-colors"
          >
            hello@festivaloftrust.com
          </a>
        </div>
      </section>
    </main>
  );
}
