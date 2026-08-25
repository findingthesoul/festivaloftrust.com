import type { Metadata } from "next";
import { connectionStatus } from "./actions";
import { ConnectionBanner } from "./connection-banner";
import { Planner } from "./planner";
import { TenthArea } from "./tenth-area";

export const metadata: Metadata = {
  title: "The planner",
  description: "Plan a Festival of Trust through the nine steps of the work.",
  robots: { index: false, follow: false },
};

// The connection is read per request: a key can be minted, or an app suspended,
// without this page being rebuilt.
export const dynamic = "force-dynamic";

export default async function Page() {
  const connection = await connectionStatus();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <Planner />
      <TenthArea />
      <ConnectionBanner connection={connection} />
    </main>
  );
}
