import { ShapeGrid } from "@/components/ShapeGrid";
import { Wordmark } from "@/components/Wordmark";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-12 px-6 py-8 sm:px-10 sm:py-12">
      {/* Masthead, as on the poster */}
      <h1 className="text-green text-center text-[clamp(1.35rem,4.5vw,3.25rem)] font-bold tracking-[-0.01em] text-balance">
        CAPE TOWN <span className="font-normal">|</span> 25.09.2026
      </h1>

      {/* Horizontal lockup: shape mark and wordmark share a height, as in the
          official artwork. The wordmark is 2:1, so it sets the overall width. */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-7 sm:flex-row sm:gap-9">
          <ShapeGrid className="h-32 w-32 shrink-0 sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-52 lg:w-52" />
          <Wordmark className="h-24 w-auto sm:h-36 md:h-44 lg:h-52" />
        </div>
      </div>

      <footer className="flex flex-col gap-3 border-t border-ink/15 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-pretty">
          A gathering about trust — how we build it, lose it, and rebuild it
          together.
        </p>
        {/* Displays the festival address but routes to Sjoerd's inbox: the
            hello@ mailbox does not exist yet. Deliberate, not a typo. */}
        <a
          href="mailto:s@soul.com"
          className="text-green font-medium underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
        >
          hello@festivaloftrust.com
        </a>
      </footer>
    </main>
  );
}
