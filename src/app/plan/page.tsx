import type { Metadata } from "next";
import Link from "next/link";
import { Sequence } from "./sequence";

export const metadata: Metadata = {
  title: "The planner",
  description:
    "Plan a Festival of Trust through the nine domains of the work.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10 sm:py-24">
      <h1 className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">
        The planner
      </h1>
      <p className="mt-6 text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-pretty">
        A festival is built in nine domains. Set the shape below and the work
        sizes itself; the full planner then takes it down to the last line.
      </p>

      {/* The gate is not built yet. Saying so in the page beats a fake lock
          that suggests protection which does not exist. */}
      <aside className="border-yellow bg-yellow/10 mt-10 border-l-4 p-4 text-sm">
        <p className="font-bold">Not yet gated</p>
        <p className="mt-1 leading-relaxed text-pretty">
          Approval and payment come before this page in the intended flow, but
          neither is wired up — so this is currently open to anyone with the
          link. Start at{" "}
          <Link href="/join" className="text-green underline underline-offset-4">
            request access
          </Link>{" "}
          to exercise the part that is real.
        </p>
      </aside>

      <Sequence />
    </main>
  );
}
