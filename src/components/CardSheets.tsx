"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { POSTER_FORMS } from "./composition";

/**
 * Full-screen coloured sheets, and one constellation for the whole page.
 *
 * The nine forms are not painted per card: a single set travels with the
 * reader. Each sheet gives the constellation a seat — a place and a size —
 * and scrolling carries the forms from seat to seat, recolouring them to
 * each sheet's own quiet texture tone on the way. The movement is entirely
 * scroll-driven: stop scrolling and everything stands still.
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
// deep ones. The texture opacity differs with the pairing, so the forms
// whisper equally on every tone.
const TONES: Record<
  CardTone,
  { bg: string; text: string; textRgb: [number, number, number]; formOpacity: number }
> = {
  yellow: { bg: "#E9C60F", text: "#141414", textRgb: [20, 20, 20], formOpacity: 0.08 },
  orange: { bg: "#F0921E", text: "#141414", textRgb: [20, 20, 20], formOpacity: 0.08 },
  magenta: { bg: "#E6197F", text: "#FEECD2", textRgb: [254, 236, 210], formOpacity: 0.13 },
  indigo: { bg: "#3B3F8F", text: "#FEECD2", textRgb: [254, 236, 210], formOpacity: 0.13 },
  ink: { bg: "#141414", text: "#FEECD2", textRgb: [254, 236, 210], formOpacity: 0.13 },
  blush: { bg: "#F9D6E3", text: "#141414", textRgb: [20, 20, 20], formOpacity: 0.08 },
};

// The constellation's seat per sheet, cycled: top-left corner as fractions
// of the viewport, height as a fraction of the viewport's. Hand-set so the
// journey swings — right and large, left and small, centre and huge —
// rather than sliding on a rail.
const SEATS = [
  { x: 0.56, y: 0.06, h: 1.02 },
  { x: 0.03, y: 0.22, h: 0.72 },
  { x: 0.44, y: -0.08, h: 1.32 },
  { x: 0.63, y: 0.32, h: 0.62 },
  { x: 0.05, y: 0.0, h: 1.12 },
  { x: 0.5, y: 0.16, h: 0.88 },
];

const RATIO = 1290 / 1536;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export function CardSheets({ sheets }: { sheets: Sheet[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const formRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const box = boxRef.current;
    if (!wrap || !box) return;
    const forms = formRefs.current;
    const seatFor = (k: number) => SEATS[k % SEATS.length];
    const toneFor = (k: number) => TONES[sheets[Math.min(k, sheets.length - 1)].tone];
    // Reduced motion still gets the texture, without the journey: the
    // constellation snaps to the nearest sheet's seat instead of tweening.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const frame = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      if (!vh) return;

      // Off the sheets entirely (intro above, footer below): the
      // constellation stays on its pages, not over them.
      if (rect.top > vh || rect.bottom < 0) {
        box.style.opacity = "0";
        return;
      }
      box.style.opacity = "1";

      const t = Math.min(sheets.length - 1, Math.max(0, -rect.top / vh));
      const i = Math.floor(t);
      const j = Math.min(i + 1, sheets.length - 1);
      const f = reduced ? Math.round(t - i) : ease(clamp01(t - i));

      const a = seatFor(i);
      const b = seatFor(j);
      const h = lerp(a.h, b.h, f) * vh;
      box.style.transform = `translate3d(${lerp(a.x, b.x, f) * vw}px, ${
        lerp(a.y, b.y, f) * vh
      }px, 0)`;
      box.style.height = `${h}px`;
      box.style.width = `${h * RATIO}px`;

      const ta = toneFor(i);
      const tb = toneFor(j);
      const rgb = ta.textRgb.map((c, k) => Math.round(lerp(c, tb.textRgb[k], f)));
      const color = `rgb(${rgb.join(",")})`;
      const opacity = String(lerp(ta.formOpacity, tb.formOpacity, f));
      for (const el of forms) {
        if (!el) continue;
        el.style.backgroundColor = color;
        el.style.opacity = opacity;
      }
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
      {/* The one constellation, fixed to the viewport and driven by scroll.
          Behind every sheet's copy, above every sheet's colour. */}
      <div
        ref={boxRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[5] opacity-0"
      >
        {POSTER_FORMS.map((spec, i) => (
          <div
            key={spec.file}
            ref={(el) => {
              formRefs.current[i] = el;
            }}
            className="absolute aspect-square"
            style={{
              left: `${spec.x * 100}%`,
              top: `${spec.y * 100}%`,
              width: `${spec.w * 100}%`,
              maskImage: `url(/brand/shapes/${spec.file}.svg)`,
              maskSize: "100% 100%",
              WebkitMaskImage: `url(/brand/shapes/${spec.file}.svg)`,
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
