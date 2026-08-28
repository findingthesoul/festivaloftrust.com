import type { Metadata } from "next";
import { festivalFor } from "../guard";
import { FestivalHeader } from "../festival-header";

export const metadata: Metadata = { title: "Calculator", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ marker: string }> }) {
  const { marker } = await params;
  // The money. A host runs the festival and does not see what it costs or
  // earns, so this is not merely a hidden tab — the page itself refuses.
  const { festival, access } = await festivalFor(marker, { moneyOnly: true });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="calculator" />

      <div className="mt-6 flex items-baseline justify-between gap-4">
        <p className="text-ink/70 max-w-2xl leading-relaxed text-pretty">
          The tenth area: what the festival costs and who carries it. It sits
          beside the nine rather than among them — the nine are the method and
          run on Flow, this is the money and does not.
        </p>
        <a
          href="/planner"
          target="_blank"
          rel="noreferrer"
          className="text-ink/60 hover:text-ink shrink-0 text-sm underline decoration-2 underline-offset-4 transition-colors"
        >
          Full screen ↗
        </a>
      </div>

      {/*
        The calculator is an exported standalone document with its own styles
        and script, dropped in whole at src/assets/planner.fragment.html so a
        new export replaces it without re-patching. A frame is what keeps that
        true: rendering it inline would mean porting it, and every future
        export would have to be ported again.

        It computes and does not save. Nothing typed here survives a reload —
        see docs/planner-persistence.md for what storing it would take.
      */}
      <iframe
        src="/planner"
        title="The business model"
        className="border-ink/15 mt-6 h-[calc(100vh-22rem)] min-h-[40rem] w-full border bg-white"
      />
    </main>
  );
}
