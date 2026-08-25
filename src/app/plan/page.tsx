import type { Metadata } from "next";
import { connectionStatus, findRun } from "./actions";
import { ConnectionBanner } from "./connection-banner";
import { FibrePlanner } from "./fibre-planner";
import { LocalPlanner } from "./local-planner";
import { TenthArea } from "./tenth-area";

export const metadata: Metadata = {
  title: "The planner",
  description: "Plan a Festival of Trust through the nine steps of the work.",
  robots: { index: false, follow: false },
};

// Read per request: a key can be minted, or a run started, without a rebuild.
export const dynamic = "force-dynamic";

export default async function Page() {
  const connection = await connectionStatus();
  // Read-only. A page load must never start a festival.
  const run = await findRun(process.env.FIBRE_FESTIVAL_ID);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      {run ? <FibrePlanner run={run} /> : <LocalPlanner />}
      <TenthArea />
      <ConnectionBanner connection={connection} hasRun={!!run} />
    </main>
  );
}
