"use client";

import { useEffect, useRef, useState } from "react";
import { POSTER_FORMS, POSTER_RATIO } from "./composition";

/**
 * A coloured panel from the visual system. The nine step-forms sit behind
 * the copy as quiet texture, on the identity composition the home page's
 * logo uses, and drift into place when the card scrolls into view — the
 * logo assembling itself, once, then holding still. Transform and opacity
 * only, and prefers-reduced-motion shows the settled arrangement directly.
 *
 * Colour is set by hand per card, for rhythm across the page — no two
 * adjacent cards should share one.
 */

export type CardTone =
  | "yellow"
  | "orange"
  | "magenta"
  | "indigo"
  | "ink"
  | "blush";

// The brief's palette: the three phase colours, the wordmark's indigo, and
// the two supporting tones. Dark text on the light panels, light on the deep
// ones — contrast confirmed per pair.
const TONES: Record<CardTone, { bg: string; text: string; darkText: boolean }> =
  {
    yellow: { bg: "#E9C60F", text: "#141414", darkText: true },
    orange: { bg: "#F0921E", text: "#141414", darkText: true },
    magenta: { bg: "#E6197F", text: "#FEECD2", darkText: false },
    indigo: { bg: "#3B3F8F", text: "#FEECD2", darkText: false },
    ink: { bg: "#141414", text: "#FEECD2", darkText: false },
    blush: { bg: "#F9D6E3", text: "#141414", darkText: true },
  };

// Where each form drifts in from: a hand-set nudge per grid seat, so the
// assembly reads as festive scatter rather than a synchronised snap. Small
// on purpose — a greeting, not a journey.
const DRIFT = [
  { dx: -22, dy: 14 },
  { dx: 12, dy: -18 },
  { dx: 24, dy: 8 },
  { dx: -14, dy: -10 },
  { dx: 0, dy: 22 },
  { dx: 18, dy: -14 },
  { dx: -20, dy: -8 },
  { dx: 16, dy: 16 },
  { dx: 26, dy: -6 },
];

export function FestivalCard({
  tone,
  kicker,
  title,
  children,
}: {
  tone: CardTone;
  kicker?: string;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Settles the moment the card is properly in view, and only once. For
    // reduced motion the same trigger applies with transitions off — the
    // settled arrangement appears directly, no drift.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSettled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { bg, text, darkText } = TONES[tone];

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-xl p-7 sm:p-9"
      style={{ backgroundColor: bg, color: text }}
    >
      {/* The nine forms, as texture behind the copy: the card's own text
          colour at whisper opacity, so the copy stays first on every tone. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-[-6%] h-[135%] -translate-y-1/2"
        style={{ aspectRatio: POSTER_RATIO }}
      >
        {POSTER_FORMS.map((spec, i) => (
          <div
            key={spec.file}
            className="motion-reduce:transition-none absolute aspect-square transition-[transform,opacity] duration-700 ease-out"
            style={{
              left: `${spec.x * 100}%`,
              top: `${spec.y * 100}%`,
              width: `${spec.w * 100}%`,
              backgroundColor: text,
              opacity: settled ? (darkText ? 0.08 : 0.14) : 0,
              transform: settled
                ? "translate3d(0,0,0) scale(1)"
                : `translate3d(${DRIFT[i].dx}px, ${DRIFT[i].dy}px, 0) scale(0.82)`,
              transitionDelay: `${i * 65}ms`,
              maskImage: `url(/brand/shapes/${spec.file}.svg)`,
              maskSize: "100% 100%",
              WebkitMaskImage: `url(/brand/shapes/${spec.file}.svg)`,
              WebkitMaskSize: "100% 100%",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-xl">
        {kicker && (
          <p className="text-xs font-bold tracking-[0.18em] uppercase opacity-70">
            {kicker}
          </p>
        )}
        <h2 className="mt-1.5 text-2xl font-bold tracking-[-0.01em] text-balance sm:text-3xl">
          {title}
        </h2>
        <div className="mt-4 space-y-3 leading-relaxed text-pretty">
          {children}
        </div>
      </div>
    </div>
  );
}
