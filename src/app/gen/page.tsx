import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { standing } from "@/lib/organiser";
import { Generator } from "./generator";

export const metadata: Metadata = {
  title: "Shape generator",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  // Workspace people only. Not a redirect: someone who is not an approved
  // organiser should not learn that this tool exists.
  const s = await standing();
  if (s.state !== "approved") notFound();
  return (
    <main className="w-full flex-1">
      <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-6 sm:px-10">
        <h1 className="text-2xl font-bold tracking-[-0.02em]">Shape generator</h1>
        <p className="mt-2 max-w-2xl text-sm text-black/60">
          Compositions in the logo&apos;s grammar: a connected cluster, one
          anchor, a trailing tail. Click a tile to open and edit it, tick to
          pick, then export as SVG.
        </p>
      </section>
      <Generator />
    </main>
  );
}
