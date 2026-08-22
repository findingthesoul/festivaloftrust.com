import { ShapeGrid } from "@/components/ShapeGrid";
import { Wordmark } from "@/components/Wordmark";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-10 px-6 py-8 sm:px-10 sm:py-12">
      {/* Masthead, as on the poster */}
      <h1 className="text-green text-center text-[clamp(1.35rem,4.5vw,3.5rem)] font-bold tracking-[-0.02em] text-balance">
        CAPE TOWN <span className="font-normal">|</span> 25.09.2026
      </h1>

      {/* Horizontal lockup: shape mark beside the wordmark */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-full flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-10">
          <ShapeGrid className="w-48 shrink-0 sm:w-56 md:w-72" />
          <Wordmark className="text-[clamp(3rem,12vw,7rem)] sm:text-[clamp(3rem,9vw,7rem)]" />
        </div>
      </div>

      <footer className="flex flex-col gap-3 border-t border-ink/15 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-pretty">
          A gathering about trust — how we build it, lose it, and rebuild it
          together.
        </p>
        <a
          href="mailto:hello@festivaloftrust.com"
          className="text-green font-medium underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
        >
          hello@festivaloftrust.com
        </a>
      </footer>
    </main>
  );
}
