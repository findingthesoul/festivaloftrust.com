import type { Metadata } from "next";
import { connectionStatus, findRun } from "../actions";
import { ConnectionBanner } from "../connection-banner";
import { FibrePlanner } from "../fibre-planner";
import { FestivalHeader } from "./festival-header";
import { festivalFor } from "./guard";

export const metadata: Metadata = {
  title: "The planner",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ marker: string }>;
}) {
  const { marker } = await params;
  const { festival, access } = await festivalFor(marker);

  const connection = await connectionStatus();
  // The run is found by the festival's own id, never by its marker — the marker
  // can change, the identity cannot.
  const run = await findRun(festival.id);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <FestivalHeader festival={festival} access={access} active="planner" />

      <div className="mt-8">
        {run ? (
          <FibrePlanner run={run} />
        ) : (
          <p className="text-ink/70 max-w-xl leading-relaxed text-pretty">
            This festival has no plan behind it yet. That happens when the
            platform could not be reached at the moment it was created.
          </p>
        )}
      </div>

      <ConnectionBanner connection={connection} hasRun={!!run} />
    </main>
  );
}
