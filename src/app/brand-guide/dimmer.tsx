"use client";

import { useState, type CSSProperties } from "react";
import { COLOUR_MARK, STEPS } from "./identity";
import s from "./guide.module.css";

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";

const LEVELS = [
  { n: 1, name: "Solid", note: "Black and white. Square. Nothing but the structure." },
  { n: 2, name: "Quiet", note: "Cream ground, ink mark, the steps as a list. Warm, still serious." },
  { n: 3, name: "Full", note: "The colour mark, whole and in order. The default public face." },
  { n: 4, name: "Free", note: "Forms leave their cells and change scale, but land on the 0.5x grid." },
  { n: 5, name: "Layered", note: "Photography underneath, forms in white on top, one in colour. The wordmark may step." },
];

const RULES = [
  ["White", "Ink only", "Whole mark, strict grid", "Ink, standard", "Partner logo walls, letters, certificates, stamps"],
  ["Cream or white", "Ink, one accent for text", "Whole mark, strict grid", "Ink, standard", "Funder decks, reports, organisational festivals, email"],
  ["Cream", "Full palette, each form its own colour", "Whole mark, strict grid", "Ink, standard", "Book cover, website, standard posters, merchandise"],
  ["Cream", "Full palette", "Forms separate, rescale, stay on 0.5x", "Ink, may grow large", "Campaign posters, social, festival dressing"],
  ["Photography", "White forms, one in colour", "Free, overlapping the image", "White, may step", "Event posters, book spreads, festival screens"],
];

/** A form at a position and size, in the 4 × 5 specimen's x units. */
function F({ id, x, y, w = 1, style }: { id: string; x: number; y: number; w?: number; style?: CSSProperties }) {
  return <use href={`#fot-${id}`} x={x} y={y} width={w} height={w} style={style} />;
}

function Specimen({ n }: { n: number }) {
  if (n === 1)
    return (
      <svg viewBox="0 0 4 5" aria-hidden="true">
        <rect width="4" height="5" fill="#fff" />
        <rect x=".01" y=".01" width="3.98" height="4.98" fill="none" stroke="#191818" strokeWidth=".02" strokeDasharray=".03 .04" />
        <g style={{ color: "#191818" }}>
          <use href="#fot-wordmark" x=".5" y=".5" width="1.3" height=".6" />
          <use href="#fot-mark" x=".5" y="1.5" width="3" height="3" />
        </g>
      </svg>
    );
  if (n === 2)
    return (
      <svg viewBox="0 0 4 5" aria-hidden="true">
        <rect width="4" height="5" fill="#fbecd2" />
        <g style={{ color: "#191818" }}>
          <use href="#fot-wordmark" x=".5" y=".5" width="1.1" height=".5" />
          <use href="#fot-mark" x=".5" y="2" width="2.2" height="2.2" />
        </g>
        <g fontFamily={FONT} fontWeight="500" fontSize=".13" fill="#191818">
          {STEPS.map((st, i) => (
            <text key={st.id} x="3" y={2.12 + i * 0.245}>
              {st.name}.
            </text>
          ))}
        </g>
      </svg>
    );
  if (n === 3)
    return (
      <svg viewBox="0 0 4 5" aria-hidden="true">
        <rect width="4" height="5" fill="#fbecd2" />
        <g fontFamily={FONT} fontSize=".25" fill="#348eac">
          <text x=".5" y=".78" fontWeight="700">grow trust,</text>
          <text x=".5" y="1.06" fontWeight="300">one pocket at a time.</text>
        </g>
        <use href="#fot-mark" x=".5" y="1.5" width="3" height="3" style={COLOUR_MARK} />
        <use href="#fot-wordmark" x="2.45" y="3.95" width="1.2" height=".55" style={{ color: "#191818" }} />
      </svg>
    );
  if (n === 4)
    return (
      <svg viewBox="0 0 4 5" aria-hidden="true" style={COLOUR_MARK}>
        <rect width="4" height="5" fill="#fbecd2" />
        <use href="#fot-wordmark" x=".5" y=".5" width="2" height=".92" style={{ color: "#191818" }} />
        <F id="listen" x={3} y={1.25} w={0.5} />
        <F id="host" x={3} y={1.75} w={0.5} />
        <F id="connect" x={0.5} y={2.25} w={0.5} />
        <F id="gather" x={1} y={2.25} w={0.5} />
        <F id="align" x={1.5} y={2.25} w={0.5} />
        <F id="design" x={2} y={2.25} w={0.5} />
        <F id="invite" x={2.5} y={2.25} w={0.5} />
        <F id="harvest" x={0.5} y={3} w={1.25} />
        <F id="grow" x={2} y={2.75} w={1.5} />
      </svg>
    );
  return (
    <svg viewBox="0 0 4 5" aria-hidden="true">
      <image href="/photos/cape-town-close-up.jpg" x="-1.5" y="0" width="7.5" height="5" preserveAspectRatio="xMidYMid slice" />
      <g style={{ color: "#fff" }}>
        <F id="listen" x={0.25} y={1.5} w={0.5} />
        <F id="gather" x={0.75} y={1} w={0.5} />
        <F id="align" x={1.25} y={1.25} w={0.5} />
        <F id="host" x={0.5} y={2.25} w={0.5} />
        <F id="harvest" x={1.75} y={1.75} w={0.25} />
        <F id="invite" x={1.75} y={2.1} w={0.25} />
        <use href="#fot-wordmark-step" x=".25" y="2.9" width="2.3" height="1.24" />
      </g>
      <F id="design" x={1} y={1.75} style={{ "--design": "#fbac0f" } as CSSProperties} />
      <g fontFamily={FONT} fontWeight="700" fontSize=".24" fill="#fff" transform="rotate(-90)">
        <text x="-4.75" y="3.45">25.09.2026</text>
        <text x="-4.75" y="3.72">CAPE TOWN</text>
      </g>
    </svg>
  );
}

export function Dimmer() {
  const [level, setLevel] = useState(3);
  const current = LEVELS[level - 1];
  return (
    <>
      <div className={s.knob}>
        <label htmlFor="dimmer" className={s.label}>
          Dimmer
        </label>
        <input
          id="dimmer"
          type="range"
          min={1}
          max={5}
          step={1}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
        />
        <span className={s.knobValue} aria-live="polite">
          {current.n} {current.name}
        </span>
      </div>

      <div className={s.scrollX}>
        <div className={s.strip}>
          {LEVELS.map((l) => (
            <button
              key={l.n}
              type="button"
              className={s.level}
              aria-pressed={l.n === level}
              onClick={() => setLevel(l.n)}
            >
              <Specimen n={l.n} />
              <b>
                <small>{l.n}</small>
                {l.name}
              </b>
              <span className={s.small}>{l.note}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={s.scrollX}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Setting</th>
              <th>Ground</th>
              <th>Colour</th>
              <th>Forms</th>
              <th>Wordmark</th>
              <th>Use it for</th>
            </tr>
          </thead>
          <tbody>
            {RULES.map((r, i) => (
              <tr key={i} data-on={i + 1 === level}>
                <td>
                  {i + 1} {LEVELS[i].name}
                </td>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
