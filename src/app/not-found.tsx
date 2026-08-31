import Link from "next/link";
import { fallbackLogoSvg } from "@/lib/logos";

/**
 * The page that is not there, wearing the identity anyway: a composition
 * grown from the word that brought people here, in the original colours —
 * so even a dead end says whose door it is.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div
        aria-hidden="true"
        className="w-56 [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: fallbackLogoSvg("four-oh-four") }}
      />
      <h1 className="mt-10 text-[clamp(2.2rem,7vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.02em]">
        This page is not here.
      </h1>
      <p className="text-ink/60 mt-4 max-w-md leading-relaxed text-pretty">
        Maybe it moved, maybe the address lost a letter, maybe the festival it
        belonged to has come and gone.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="bg-green text-cream px-6 py-3 font-medium transition-opacity hover:opacity-85"
        >
          To the front door
        </Link>
        <Link
          href="/upcoming"
          className="text-ink/70 hover:text-ink underline decoration-2 underline-offset-4 transition-colors"
        >
          Upcoming festivals
        </Link>
      </div>
    </main>
  );
}
