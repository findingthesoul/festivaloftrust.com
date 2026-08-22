import type { Metadata } from "next";
import { Planner } from "./planner";

export const metadata: Metadata = {
  title: "The planner",
  description: "Plan a Festival of Trust through the nine steps of the work.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:px-10 sm:py-16">
      <Planner />

      {/* The gate is not built. Saying so beats a lock that implies
          protection which does not exist. */}
      <p className="text-ink/50 mt-16 border-t border-ink/15 pt-6 text-sm text-pretty">
        Work in progress. Approval and payment come before this page in the
        intended flow but are not wired up, and your plan is saved in this
        browser only — the platform entities it should write to do not exist
        yet.
      </p>
    </main>
  );
}
