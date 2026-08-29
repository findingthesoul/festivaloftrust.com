"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Full-screen coloured sheets, and one white form for the whole page.
 *
 * The form does not travel: it stands in one place on the screen while the
 * sheets scroll past behind it, and at each card boundary it becomes the
 * next of the nine forms — a crossfade, so the white stays and only the
 * shape changes. Scroll-driven and opacity-only: stop scrolling and
 * everything stands still.
 *
 * Colour per sheet is set by hand, for rhythm — no two neighbours alike.
 */

export type CardTone =
  | "yellow"
  | "orange"
  | "magenta"
  | "indigo"
  | "ink"
  | "blush";

export type Sheet = {
  tone: CardTone;
  kicker?: string;
  title: string;
  body: React.ReactNode;
  ctas?: { href: string; label: string; secondary?: boolean }[];
};

// The brief's palette: the three phase colours, the wordmark's indigo, and
// the two supporting tones. Dark text on the light panels, light on the
// deep ones.
const TONES: Record<CardTone, { bg: string; text: string }> = {
  yellow: { bg: "#E9C60F", text: "#141414" },
  orange: { bg: "#F0921E", text: "#141414" },
  magenta: { bg: "#E6197F", text: "#FEECD2" },
  indigo: { bg: "#3B3F8F", text: "#FEECD2" },
  ink: { bg: "#141414", text: "#FEECD2" },
  blush: { bg: "#F9D6E3", text: "#141414" },
};

// The nine forms in the grid's own order, one per sheet, cycling if a page
// carries more than nine.
const FORM_ORDER = [
  "forms-01",
  "forms-02",
  "forms-03",
  "forms-05",
  "forms-06",
  "forms-04",
  "forms-09",
  "forms-07",
  "forms-08",
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function CardSheets({ sheets }: { sheets: Sheet[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const formRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const box = boxRef.current;
    if (!wrap || !box) return;
    const forms = formRefs.current;

    let raf = 0;
    const frame = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      if (!vh) return;

      // Off the sheets entirely (intro above, footer below): the form stays
      // on its pages, not over them.
      if (rect.top > vh * 0.6 || rect.bottom < vh * 0.5) {
        box.style.opacity = "0";
        return;
      }
      box.style.opacity = "1";

      // How far the sheets have scrolled, in cards. Each form is full while
      // its own sheet fills the screen and crossfades into the next around
      // the boundary — the white stays, the shape changes.
      const t = Math.min(sheets.length - 1, Math.max(0, -rect.top / vh));
      forms.forEach((el, k) => {
        if (!el) return;
        el.style.opacity = String(clamp01(1 - Math.abs(t - k) * 1.6));
      });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sheets]);

  return (
    <div ref={wrapRef} className="relative">
      {/* The one white form, standing still while the sheets pass. Behind
          the copy, above the colour. */}
      <div
        ref={boxRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 right-[5vw] z-[5] aspect-square h-[38vh] -translate-y-1/2 opacity-0 sm:h-[60vh]"
      >
        {sheets.map((sheet, k) => (
          <div
            key={sheet.title}
            ref={(el) => {
              formRefs.current[k] = el;
            }}
            className="absolute inset-0 bg-white"
            style={{
              opacity: 0,
              maskImage: `url(/brand/shapes/${FORM_ORDER[k % FORM_ORDER.length]}.svg)`,
              maskSize: "100% 100%",
              WebkitMaskImage: `url(/brand/shapes/${FORM_ORDER[k % FORM_ORDER.length]}.svg)`,
              WebkitMaskSize: "100% 100%",
            }}
          />
        ))}
      </div>

      {sheets.map((sheet) => {
        const { bg, text } = TONES[sheet.tone];
        return (
          <section
            key={sheet.title}
            className="relative flex min-h-dvh w-full items-center"
            style={{ backgroundColor: bg, color: text }}
          >
            <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-20 sm:px-10 sm:py-24">
              {sheet.kicker && (
                <p className="text-sm font-bold tracking-[0.18em] uppercase opacity-70">
                  {sheet.kicker}
                </p>
              )}
              <h2 className="mt-2 max-w-3xl text-[clamp(1.9rem,4.5vw,3.25rem)] leading-[1.08] font-bold tracking-[-0.02em] text-balance">
                {sheet.title}
              </h2>
              <div className="mt-7 max-w-2xl space-y-4 text-[clamp(1.02rem,1.5vw,1.2rem)] leading-relaxed text-pretty">
                {sheet.body}
              </div>
              {sheet.ctas && (
                <div className="mt-9 flex flex-wrap gap-4">
                  {sheet.ctas.map((cta) => {
                    const style = cta.secondary
                      ? { borderColor: text, color: text }
                      : { backgroundColor: text, color: bg };
                    const cls = `inline-block rounded-lg px-7 py-3.5 font-bold transition-opacity hover:opacity-85 ${
                      cta.secondary ? "border-2" : ""
                    }`;
                    return cta.href.startsWith("/") ? (
                      <Link key={cta.href} href={cta.href} className={cls} style={style}>
                        {cta.label}
                      </Link>
                    ) : (
                      <a key={cta.href} href={cta.href} className={cls} style={style}>
                        {cta.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
