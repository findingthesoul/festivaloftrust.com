import type { Metadata } from "next";
import { festivalFor } from "../guard";
import { FestivalHeader } from "../festival-header";
import { PublishControls } from "./publish-controls";

export const metadata: Metadata = { title: "Publish", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ marker: string }> }) {
  const { marker } = await params;
  const { festival, access } = await festivalFor(marker, { organiserOnly: true });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="publish" />
      <PublishControls marker={marker} status={festival.status} />
    </main>
  );
}
