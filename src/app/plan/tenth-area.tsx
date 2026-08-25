import Link from "next/link";

/**
 * The tenth area — the business model.
 *
 * It sits alongside the nine rather than among them: the nine are the method
 * and run on Flow, this is the money and does not. Keeping it visually apart
 * is the point, so it is not mistaken for a tenth step of the work.
 */
export function TenthArea() {
  return (
    <section className="mt-14 border-t border-ink/15 pt-10">
      <p className="text-ink/50 text-xs tracking-[0.15em] uppercase">Tenth area</p>
      <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em]">The business model</h2>
      <p className="text-ink/70 mt-2 max-w-2xl leading-relaxed text-pretty">
        What the festival costs and who carries it: visitors and setting, the
        hours across the nine steps, location, food, artists, travel, funding,
        and the contribution left per visitor.
      </p>
      <Link
        href="/planner"
        className="bg-ink text-cream mt-6 inline-block px-6 py-3 font-medium transition-opacity hover:opacity-85"
      >
        Open the business model
      </Link>
    </section>
  );
}
