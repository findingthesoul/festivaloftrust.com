"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Full-screen coloured sheets, and one composition of the nine forms that
 * rearranges itself as the reader scrolls — like the logo on the home page.
 *
 * The two arrangements come from the designer's cluster SVGs (their
 * fot-form metadata, verbatim): every form has a seat in each, and scroll
 * carries each form from its seat in one to its seat in the other —
 * position, size and rotation tweening together, alternating arrangement
 * per card. White forms, the star in its yellow, on every sheet colour.
 * Scroll-driven only: stop scrolling and the composition stands still.
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

// One grid unit of the cluster SVGs, in their own pixels. Form id N is
// forms-0(N+1); x/y are grid seats offset by 1.5 units of margin.
const UNIT = 226.8;

type ClusterItem = { id: number; x: number; y: number; size: number; rot: number };

// The designer's two arrangements, exactly as their SVG metadata records
// them (fot-cluster-1 and fot-cluster-72, "amazingness" collection).
const CLUSTERS: { w: number; h: number; items: ClusterItem[] }[] = [
  {
    w: 1398.778,
    h: 1171.978,
    items: [
      { id: 3, x: 5.1674516600406095, y: 3, size: 1, rot: 0 },
      { id: 2, x: 4.1674516600406095, y: 3, size: 1, rot: 0 },
      { id: 1, x: 5.1674516600406095, y: 2, size: 1, rot: 0 },
      { id: 5, x: 6.1674516600406095, y: 3, size: 1, rot: 0 },
      { id: 6, x: 4.1674516600406095, y: 2, size: 1, rot: 0 },
      { id: 4, x: 4.1674516600406095, y: 4, size: 1, rot: 0 },
      { id: 0, x: 6.1674516600406095, y: 2, size: 1, rot: 0 },
      { id: 7, x: 2.1674516600406095, y: 4, size: 2, rot: 0 },
      { id: 8, x: 2, y: 5.547451660040609, size: 0.62, rot: 0 },
    ],
  },
  {
    w: 1676.748,
    h: 854.929,
    items: [
      { id: 3, x: 3.3666291475765133, y: 3, size: 1, rot: 0 },
      { id: 8, x: 2.8666291475765133, y: 3.43, size: 0.5, rot: 0 },
      { id: 6, x: 2, y: 3.7695263207177243, size: 1, rot: 0 },
      { id: 0, x: 2.3666291475765133, y: 2, size: 1, rot: 0 },
      { id: 2, x: 3.3666291475765133, y: 2, size: 1, rot: 0 },
      { id: 1, x: 4.366629147576513, y: 3, size: 1, rot: 0 },
      { id: 5, x: 5.366629147576513, y: 2, size: 2, rot: 0 },
      { id: 4, x: 7.366629147576513, y: 2.43, size: 0.62, rot: 0 },
      { id: 7, x: 7.943068124971089, y: 2.028953273393069, size: 0.45, rot: 270 },
    ],
  },
];

// The star keeps its accent in both arrangements.
const STAR_ID = 5;
const STAR_YELLOW = "#F3B33C";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/** A cluster fitted into a screen box: per form id, its rect and rotation. */
function fit(cluster: (typeof CLUSTERS)[number], fw: number, fh: number) {
  const k = Math.min(fw / cluster.w, fh / cluster.h);
  const ox = (fw - k * cluster.w) / 2;
  const oy = (fh - k * cluster.h) / 2;
  const out: Record<number, { x: number; y: number; w: number; rot: number }> = {};
  for (const it of cluster.items) {
    out[it.id] = {
      x: ox + k * (it.x - 1.5) * UNIT,
      y: oy + k * (it.y - 1.5) * UNIT,
      w: k * it.size * UNIT,
      rot: it.rot,
    };
  }
  return out;
}

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
      const vw = window.innerWidth;
      if (!vh) return;

      // Off the sheets entirely (intro above, footer below): the
      // composition stays on its pages, not over them.
      if (rect.top > vh * 0.6 || rect.bottom < vh * 0.5) {
        box.style.opacity = "0";
        return;
      }

      // The frame the composition lives in: the right side on a wide
      // screen, solid; narrower screens get it fainter, since the copy may
      // pass over it there.
      const wide = vw >= 1024;
      const fw = wide ? vw * 0.42 : vw * 0.7;
      const fh = vh * 0.68;
      box.style.opacity = wide ? "0.92" : "0.22";
      box.style.transform = `translate3d(${vw - fw - vw * 0.03}px, ${(vh - fh) / 2}px, 0)`;
      box.style.width = `${fw}px`;
      box.style.height = `${fh}px`;

      // Card k holds arrangement k mod 2; between cards, every form travels
      // from its seat in one to its seat in the other — like the logo on
      // the home page, but between the designer's two clusters.
      const t = Math.min(sheets.length - 1, Math.max(0, -rect.top / vh));
      const i = Math.floor(t);
      const f = ease(clamp01(t - i));
      const mix = i % 2 === 0 ? f : 1 - f;

      const A = fit(CLUSTERS[0], fw, fh);
      const B = fit(CLUSTERS[1], fw, fh);
      forms.forEach((el, id) => {
        if (!el) return;
        const a = A[id];
        const b = B[id];
        const w = lerp(a.w, b.w, mix);
        el.style.width = `${w}px`;
        el.style.height = `${w}px`;
        el.style.transform = `translate3d(${lerp(a.x, b.x, mix)}px, ${lerp(
          a.y,
          b.y,
          mix,
        )}px, 0) rotate(${lerp(a.rot, b.rot, mix)}deg)`;
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
      {/* The composition, fixed to the viewport while the sheets pass.
          Behind the copy, above the colour. */}
      <div
        ref={boxRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[5] opacity-0"
      >
        {Array.from({ length: 9 }, (_, id) => (
          <div
            key={id}
            ref={(el) => {
              formRefs.current[id] = el;
            }}
            className="absolute top-0 left-0"
            style={{
              backgroundColor: id === STAR_ID ? STAR_YELLOW : "#FFFFFF",
              maskImage: `url(/brand/shapes/forms-0${id + 1}.svg)`,
              maskSize: "100% 100%",
              WebkitMaskImage: `url(/brand/shapes/forms-0${id + 1}.svg)`,
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
