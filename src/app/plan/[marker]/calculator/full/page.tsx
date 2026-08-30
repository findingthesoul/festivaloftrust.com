import type { Metadata } from "next";
import Link from "next/link";
import { festivalFor } from "../../guard";
import { CalculatorFrame } from "../calculator-frame";
import { loadCurrencyContext } from "../actions";

export const metadata: Metadata = { title: "Calculator", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * The same calculator, the whole viewport: this festival's figures, its
 * currency and its autosave — not the blank standalone tool the old
 * full-screen link opened.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;
  const { festival } = await festivalFor(marker, { moneyOnly: true });
  const money = await loadCurrencyContext(marker);

  return (
    <main className="mx-auto flex w-full max-w-none flex-1 flex-col px-4 py-4 sm:px-6">
      <Link
        href={`/plan/${marker}/calculator`}
        className="text-ink/60 hover:text-ink self-start text-sm underline decoration-2 underline-offset-4 transition-colors"
      >
        ← Back to the planner
      </Link>
      <CalculatorFrame
        marker={marker}
        tall
        prefill={{
          fName: festival.name,
          fDate: festival.starts_on ?? "",
          oPlace: festival.place ?? "",
        }}
        currencies={money?.currencies ?? []}
        current={money?.current ?? "EUR"}
        isAdmin={money?.isAdmin ?? false}
        prices={money?.prices ?? {}}
      />
    </main>
  );
}
