import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "A decade for culture",
  description:
    "The UN declared 2027–2036 the International Decade of Culture for Sustainable Development. Festival of Trust did not wait for the resolution — trust grows in pockets, not policies.",
  alternates: { canonical: "/decade" },
};

/** The figures the story stands on, echoed as display. */
const FIGURES = [
  { n: "174 – 1", label: "the General Assembly vote" },
  { n: "3.39%", label: "of global GDP is cultural and creative work" },
  { n: "2027–36", label: "the Decade of Culture" },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2.2rem,6.5vw,4rem)] leading-[1.02] font-bold tracking-[-0.02em] text-balance">
        A decade for culture.
        <span className="text-green block">We already started.</span>
      </h1>

      <section className="mx-auto max-w-2xl space-y-6 pt-14 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty sm:pt-20">
        <p>
          In September 2026 the United Nations declared 2027 to 2036 the
          International Decade of Culture for Sustainable Development. The vote
          was 174 in favor, 1 against. UNESCO now leads the work of turning
          that ambition into policy and funding, across a hundred member
          states and counting.
        </p>
        <p>
          Festival of Trust did not wait for that resolution. Trust grows in
          pockets, not policies. A shared meal. A story told well. A moment
          where a stranger becomes someone you would vouch for. We build
          festivals around that fact.
        </p>
        <p>
          Social cohesion is one of the outcomes UNESCO names for this Decade,
          alongside education, climate action and peace. But cohesion is not
          something a policy produces on its own. It is what trust looks like
          once enough of it has grown in one place. A community with no
          pockets of trust does not become cohesive because a framework says
          it should. It becomes cohesive because people already know who they
          can rely on, and that knowledge spreads.
        </p>
      </section>

      <section className="border-ink/15 mt-16 grid gap-10 border-y py-12 sm:grid-cols-3 sm:py-14">
        {FIGURES.map((f) => (
          <div key={f.n}>
            <p className="text-green text-[clamp(2rem,5vw,3rem)] leading-none font-bold tracking-[-0.02em]">
              {f.n}
            </p>
            <p className="text-ink/60 mt-2 max-w-[22ch] text-sm leading-snug">
              {f.label}
            </p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-2xl space-y-6 pt-16 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty sm:pt-20">
        <p>
          But the timing is not nothing. UNESCO&rsquo;s own figures put
          cultural and creative industries at 3.39% of global GDP and 3.55% of
          jobs worldwide. The Pact for the Future and the Sevilla Commitment
          both name culture as something worth funding directly, not as
          decoration around other goals.
        </p>
        <p>
          If you are considering a Festival of Trust for your community or
          organisation, you are not backing something niche. You are backing
          the kind of work the entire UN General Assembly just agreed belongs
          at the center, for the next ten years.
        </p>
      </section>

      <section className="py-20 sm:py-28">
        <p className="text-green text-center text-[clamp(1.8rem,6vw,3.75rem)] leading-[1.08] font-bold tracking-[-0.02em] text-balance">
          Grow trust, one pocket at a time.
          <br />
          The world is finally calling it infrastructure.
        </p>
      </section>

      <section className="border-ink/15 flex flex-wrap items-center justify-center gap-6 border-t pt-12">
        <Link
          href="/join"
          className="bg-green text-cream px-7 py-3.5 text-lg font-medium transition-opacity hover:opacity-85"
        >
          Host a festival
        </Link>
        <a
          href="https://www.unesco.org/en/articles/culture-sustainable-development-new-un-decade-renewed-global-ambition"
          className="text-ink/70 hover:text-ink underline decoration-2 underline-offset-4 transition-colors"
        >
          Read the UNESCO announcement
        </a>
      </section>
    </main>
  );
}
