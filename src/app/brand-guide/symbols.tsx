import type { CSSProperties, ReactNode } from "react";
import { STEPS, type StepId } from "./identity";
import { GLYPHS, WORDMARK, WORDMARK_STEP } from "./wordmark-glyphs";

/**
 * The identity as reusable SVG symbols, defined once per page and drawn
 * anywhere with <use href="#fot-…">. Each of the nine forms sits in its own
 * 1×1 cell and fills with its step's custom property, falling back to
 * currentColor — so the same symbol is the colour mark or the solid mark
 * depending on what the parent sets.
 */

const FORMS: Record<StepId, ReactNode> = {
  listen: (
    <>
      <circle cx=".25" cy=".25" r=".25" />
      <circle cx=".75" cy=".25" r=".25" />
      <circle cx=".25" cy=".75" r=".25" />
      <circle cx=".75" cy=".75" r=".25" />
    </>
  ),
  gather: (
    <>
      <path d="M0 0H.5A.5 .5 0 0 1 0 .5Z" />
      <path d="M0 1V.5A.5 .5 0 0 1 .5 1Z" />
      <path d="M1 0V1A.5 .5 0 0 1 1 0Z" />
    </>
  ),
  align: (
    <>
      <path d="M0 0H1A.5 .5 0 0 1 0 0Z" />
      <path d="M0 1A.5 .5 0 0 1 1 1Z" />
    </>
  ),
  connect: (
    <>
      <path d="M0 0V1L.5 .5Z" />
      <path d="M1 0V1L.5 .5Z" />
    </>
  ),
  design: <path d="M0 .5A.5 .5 0 0 1 .5 1A.5 .5 0 0 1 1 .5A.5 .5 0 0 1 .5 0A.5 .5 0 0 1 0 .5Z" />,
  invite: <path d="M.5 0L1 .5L.5 1L0 .5Z" />,
  host: <rect width="1" height="1" />,
  harvest: <circle cx=".5" cy=".5" r=".5" />,
  // Grow's pentagon, measured off the artwork: it touches all four cell edges.
  grow: <path d="M0 .716L.098 .098L.716 0L1 .557L.557 1Z" />,
};

export const WORDMARK_BOX = { w: 372.75, h: 171.75 };
export const LOCKUP_BOX = { w: 631.33, h: 226.77 };

function placements(list: typeof WORDMARK) {
  return list.map(([g, [sx, sy, x, y]], i) => (
    <use key={i} href={`#fot-g${g}`} transform={`matrix(${sx},0,0,${sy},${x},${y})`} />
  ));
}

export function BrandSymbols() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        {Object.entries(GLYPHS).map(([g, d]) => (
          <path key={g} id={`fot-g${g}`} d={d} />
        ))}
        {STEPS.map((s) => (
          <symbol
            key={s.id}
            id={`fot-${s.id}`}
            viewBox="0 0 1 1"
            style={{ fill: `var(--${s.id}, currentColor)` }}
          >
            {FORMS[s.id]}
          </symbol>
        ))}
        <symbol id="fot-mark" viewBox="0 0 3 3">
          {STEPS.map((s, i) => (
            <use
              key={s.id}
              href={`#fot-${s.id}`}
              x={i % 3}
              y={Math.floor(i / 3)}
              width="1"
              height="1"
            />
          ))}
        </symbol>
        <symbol id="fot-wordmark" viewBox="292.75 85.25 372.75 171.75">
          <g fill="currentColor">{placements(WORDMARK)}</g>
        </symbol>
        <symbol id="fot-wordmark-step" viewBox="196 150 472 254">
          <g fill="currentColor">{placements(WORDMARK_STEP)}</g>
        </symbol>
        {/* Horizontal lockup, proportions from the artboard: the mark, a
            0.42x gap, the wordmark set on the mark's base. */}
        <symbol id="fot-lockup" viewBox="34.17 34.17 631.33 226.77">
          <use href="#fot-mark" x="34.17" y="34.17" width="226.77" height="226.77" />
          <use href="#fot-wordmark" x="292.75" y="85.25" width="372.75" height="171.75" />
        </symbol>
      </defs>
    </svg>
  );
}

/** Draws one symbol at its own aspect ratio. */
export function Sym({
  id,
  w = 1,
  h = 1,
  label,
  className,
  style,
}: {
  id: string;
  w?: number;
  h?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <use href={`#fot-${id}`} width={w} height={h} />
    </svg>
  );
}
