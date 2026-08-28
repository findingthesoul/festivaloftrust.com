import type { Metadata } from "next";
import { festivalFor } from "../guard";
import { FestivalHeader } from "../festival-header";
import { TenthArea } from "../../tenth-area";

export const metadata: Metadata = { title: "Calculator", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ marker: string }> }) {
  const { marker } = await params;
  // The money. A host runs the festival and does not see what it costs or
  // earns, so this is not merely a hidden tab — the page itself refuses.
  const { festival, access } = await festivalFor(marker, { moneyOnly: true });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="calculator" />
      <TenthArea />
    </main>
  );
}
