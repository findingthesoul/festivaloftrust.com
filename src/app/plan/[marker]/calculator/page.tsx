import type { Metadata } from "next";
import { festivalFor } from "../guard";
import { FestivalHeader } from "../festival-header";
import { CalculatorFrame } from "./calculator-frame";
import { loadCurrencyContext } from "./actions";

export const metadata: Metadata = { title: "Calculator", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ marker: string }> }) {
  const { marker } = await params;
  // The money. A host runs the festival and does not see what it costs or
  // earns, so this is not merely a hidden tab — the page itself refuses, and
  // so does the table behind it.
  const { festival, access } = await festivalFor(marker, { moneyOnly: true });
  const money = await loadCurrencyContext(marker);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="calculator" />
      <p className="text-ink/70 mt-6 max-w-2xl leading-relaxed text-pretty">
        The tenth area: what the festival costs and who carries it. It sits
        beside the nine rather than among them — the nine are the method and run
        on Flow, this is the money and does not.
      </p>
      <CalculatorFrame
        marker={marker}
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
