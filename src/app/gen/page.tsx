import type { Metadata } from "next";
import { Generator } from "./generator";

export const metadata: Metadata = {
  title: "Shape generator",
  robots: { index: false },
};

export default function Page() {
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
