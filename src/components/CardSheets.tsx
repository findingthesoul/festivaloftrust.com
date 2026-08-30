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
  /** Which column the copy takes; the composition takes the other. */
  text?: "left" | "right";
  /** Where the composition sits in its column. */
  shapes?: "top" | "bottom";
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

// The star keeps its accent in the cluster arrangements.
const STAR_ID = 5;
const STAR_YELLOW = [243, 179, 60];
const WHITE = [255, 255, 255];

// Each form's own colour from the poster artwork (festival-plan's step
// colours, keyed here by form id) — worn on the photo, where the grid
// stands as itself.
const ORIGINAL_RGB: Record<number, number[]> = {
  0: [248, 179, 167],
  1: [51, 143, 173],
  2: [251, 172, 24],
  3: [110, 88, 137],
  4: [251, 172, 24],
  5: [7, 124, 76],
  6: [238, 54, 79],
  7: [248, 179, 167],
  8: [78, 76, 155],
};

// Which tile of the footer lockup's 3x3 each form docks into — the grid's
// own order, by form id.
const TILE_BY_ID: Record<number, number> = { 0: 0, 1: 1, 2: 2, 4: 3, 5: 4, 3: 5, 8: 6, 6: 7, 7: 8 };

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

export function CardSheets({
  hero,
  sheets,
}: {
  /** The opening photo sheet; the base grid stands on it, like home. */
  hero?: React.ReactNode;
  sheets: Sheet[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const formRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Magnetic cards: while a sheet page is open, the document snaps so a
  // card never rests half in view — scrolling always completes the arrival,
  // and the composition's journey completes with it.
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.scrollSnapType;
    root.style.scrollSnapType = "y mandatory";
    return () => {
      root.style.scrollSnapType = prev;
    };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const box = boxRef.current;
    if (!wrap || !box) return;
    const forms = formRefs.current;

    const frame = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      if (!vh) return;

      // Above the sheets (the photo hero): the composition waits.
      if (rect.top > vh * 0.6) {
        box.style.opacity = "0";
        return;
      }

      // Towards the footer, the forms fly home: as the foot rises, every
      // form travels to its own tile in the lockup's 3x3 and settles there —
      // the same arrival the home page's logo makes, at the other end.
      const footerGrid = document.querySelector<HTMLElement>(
        "footer [data-lockup-grid]",
      );
      const footerEl = footerGrid?.closest("footer");
      const dockE = footerEl
        ? ease(
            clamp01((vh - rect.bottom) / Math.max(1, footerEl.offsetHeight)),
          )
        : 0;
      const gRect = footerGrid?.getBoundingClientRect();

      // Each card says which column its copy takes and whether the
      // composition sits at the top or the bottom of the other one; the
      // frame glides from seat to seat as the arrangement morphs. Only a
      // phone is too narrow for two columns — a halved laptop window is not
      // — and where one column is all there is, the composition stays
      // legible rather than ghostly.
      const wide = vw >= 768;
      const fw = wide ? vw * 0.44 : vw * 0.7;
      const fh = Math.min(vh * 0.58, fw * 0.9);
      const seat = (k: number) => {
        if (hero && k === 0) {
          // On the photo: the half-size grid stands just above the title,
          // aligned to the same left edge as the hero's own text.
          const gs = Math.min(fw, fh) * 0.45;
          const gx = Math.max((vw - 1024) / 2, 0) + (vw >= 640 ? 40 : 24);
          const gy = vh - 230 - gs - 24;
          return { x: gx - (fw - gs) / 2, y: gy - (fh - gs) / 2 };
        }
        const sheet =
          sheets[Math.min(k - (hero ? 1 : 0), sheets.length - 1)];
        const x = wide
          ? (sheet.text ?? "left") === "left"
            ? vw * 0.53
            : vw * 0.03
          : vw * 0.15;
        const y =
          (sheet.shapes ?? "top") === "top" ? vh * 0.1 : vh - fh - vh * 0.08;
        return { x, y };
      };
      box.style.opacity = String(lerp(wide ? 0.92 : 0.4, 1, dockE));
      box.style.width = `${fw}px`;
      box.style.height = `${fh}px`;

      // The photo holds the base grid — the nine forms in their own
      // three-by-three, the logo at rest on the picture, like home. From
      // the first coloured card on, the designer's clusters alternate.
      // Between cards, every form travels from its seat in one arrangement
      // to its seat in the next, while the whole frame glides to the next
      // card's column.
      const count = sheets.length + (hero ? 1 : 0);
      const t = Math.min(count - 1, Math.max(0, -rect.top / vh));
      const i = Math.floor(t);
      const j = Math.min(i + 1, count - 1);
      const f = ease(clamp01(t - i));

      const sa = seat(i);
      const sb = seat(j);
      const bx = lerp(sa.x, sb.x, f);
      const by = lerp(sa.y, sb.y, f);
      box.style.transform = `translate3d(${bx}px, ${by}px, 0)`;

      type Layout = Record<
        number,
        { x: number; y: number; w: number; rot: number; c: number[] }
      >;
      const layoutFor = (k: number): Layout => {
        if (k === 0 && hero) {
          // Half size, in the artwork's own colours: the poster's grid.
          const gs = Math.min(fw, fh) * 0.45;
          const tile = gs / 3;
          const ox = (fw - gs) / 2;
          const oy = (fh - gs) / 2;
          const out: Layout = {};
          for (const [id, tIdx] of Object.entries(TILE_BY_ID)) {
            out[+id] = {
              x: ox + (tIdx % 3) * tile,
              y: oy + Math.floor(tIdx / 3) * tile,
              w: tile,
              rot: 0,
              c: ORIGINAL_RGB[+id],
            };
          }
          return out;
        }
        const base = fit(CLUSTERS[(k - (hero ? 1 : 0)) % CLUSTERS.length], fw, fh);
        const out: Layout = {};
        for (const [id, r] of Object.entries(base)) {
          out[+id] = { ...r, c: +id === STAR_ID ? STAR_YELLOW : WHITE };
        }
        return out;
      };
      const A = layoutFor(i);
      const B = layoutFor(j);
      forms.forEach((el, id) => {
        if (!el) return;
        const a = A[id];
        const b = B[id];
        let w = lerp(a.w, b.w, f);
        let x = lerp(a.x, b.x, f);
        let y = lerp(a.y, b.y, f);
        let rot = lerp(a.rot, b.rot, f);
        let c = a.c.map((v, ci) => lerp(v, b.c[ci], f));
        if (dockE > 0 && gRect) {
          // Tile targets live in viewport space; the forms live in the
          // box's — bridge with the box position, so the flight is exact.
          const ts = gRect.width / 3;
          const tIdx = TILE_BY_ID[id];
          const tx = gRect.left + (tIdx % 3) * ts;
          const ty = gRect.top + Math.floor(tIdx / 3) * ts;
          x = lerp(x, tx - bx, dockE);
          y = lerp(y, ty - by, dockE);
          w = lerp(w, ts, dockE);
          rot = rot * (1 - dockE);
          // Every colour lands white, the lockup's own.
          c = c.map((v) => lerp(v, 255, dockE));
        }
        el.style.width = `${w}px`;
        el.style.height = `${w}px`;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
        el.style.backgroundColor = `rgb(${c.map(Math.round).join(",")})`;
      });
    };

    // Straight from the scroll event, no animation-frame indirection:
    // browsers already deliver scroll at most once per frame, and a queued
    // frame in a throttled tab would freeze the composition until it fired.
    frame();
    window.addEventListener("scroll", frame, { passive: true });
    window.addEventListener("resize", frame);
    return () => {
      window.removeEventListener("scroll", frame);
      window.removeEventListener("resize", frame);
    };
  }, [sheets]);

  return (
    <div ref={wrapRef} className="relative">
      {/* The composition, pinned to the viewport while the sheets pass —
          sticky rather than fixed, because Safari mislays fixed elements
          inside a scroll-snapping page. Behind the copy, above the colour. */}
      <div className="sticky top-0 z-[5] h-0">
        <div
          ref={boxRef}
          data-composition
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 opacity-0"
        >
        {Array.from({ length: 9 }, (_, id) => (
          <div
            key={id}
            ref={(el) => {
              formRefs.current[id] = el;
            }}
            className="absolute top-0 left-0"
            style={{
              backgroundColor: `rgb(${ORIGINAL_RGB[id].join(",")})`,
              maskImage: `url(/brand/shapes/forms-0${id + 1}.svg)`,
              maskSize: "100% 100%",
              WebkitMaskImage: `url(/brand/shapes/forms-0${id + 1}.svg)`,
              WebkitMaskSize: "100% 100%",
            }}
          />
        ))}
        </div>
      </div>

      {hero}

      {sheets.map((sheet) => {
        const { bg, text } = TONES[sheet.tone];
        return (
          <section
            key={sheet.title}
            className="relative flex min-h-dvh w-full snap-start items-center"
            style={{ backgroundColor: bg, color: text }}
          >
            <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 sm:py-24 md:grid md:grid-cols-2 md:gap-16">
              <div className={sheet.text === "right" ? "md:col-start-2" : ""}>
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
            </div>
          </section>
        );
      })}
    </div>
  );
}
