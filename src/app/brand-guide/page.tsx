import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Generator } from "../gen/generator";
import { Dimmer } from "./dimmer";
import { COLOUR_MARK, STEPS } from "./identity";
import { BrandSymbols, LOCKUP_BOX, Sym, WORDMARK_BOX } from "./symbols";
import s from "./guide.module.css";

export const metadata: Metadata = {
  title: "Brand guide",
  description:
    "The Festival of Trust identity: three primitives, nine forms, one grid, one wordmark, one palette, and a dimmer from solid black and white to full colour over photography.",
  alternates: { canonical: "/brand-guide" },
};

const CHAPTERS = [
  ["primitives", "Primitives"],
  ["steps", "Nine steps"],
  ["mark", "Mark"],
  ["wordmark", "Wordmark"],
  ["colour", "Colour"],
  ["type", "Typography"],
  ["grid", "Grid"],
  ["dimmer", "Dimmer"],
  ["in-use", "In use"],
  ["generator", "Generator"],
] as const;

const PALETTE = [
  { name: "Blush", hex: "#FBB4A8", rgb: "251 180 168", use: "Listen · Grow" },
  { name: "Marigold", hex: "#FBAC0F", rgb: "251 172 15", use: "Align · Connect" },
  { name: "Signal", hex: "#FB2F4A", rgb: "251 47 74", use: "Harvest" },
  { name: "Plum", hex: "#6D5687", rgb: "109 86 135", use: "Invite" },
  { name: "Indigo", hex: "#4E4C9F", rgb: "78 76 159", use: "Host" },
  { name: "Lagoon", hex: "#348EAC", rgb: "52 142 172", use: "Gather · tagline" },
  { name: "Forest", hex: "#0C7B4B", rgb: "12 123 75", use: "Design · dates" },
];

const BLENDS = [
  ["#FBB4A8", "#FBAC0F"],
  ["#FBAC0F", "#FB2F4A"],
  ["#FB2F4A", "#6D5687"],
  ["#6D5687", "#4E4C9F"],
  ["#348EAC", "#4E4C9F"],
  ["#348EAC", "#0C7B4B"],
];

const IN_USE = [
  {
    level: "2 Quiet",
    items: [{ src: "poster-quiet", alt: "Poster: the solid mark in ink on cream, with the nine steps listed beside it.", note: "Ink mark on cream, steps as a list." }],
  },
  {
    level: "3 Full",
    items: [
      { src: "poster-cape-town-full", alt: "Cape Town poster: the colour mark on cream under the place and date in green.", note: "Cape Town. The colour mark, place and date in Forest." },
      { src: "poster-cape-town-free", alt: "Cape Town poster, landscape: wordmark top left, colour mark, place and date set vertically.", note: "Landscape. Date and place turn vertical." },
      { src: "poster-grow-trust-lines", alt: "Poster: 'Grow trust, one pocket at a time.' above the colour mark, with dashed lines connecting the forms.", note: "Dashed lines connect the forms: a web of trust." },
    ],
  },
  {
    level: "4 Free",
    items: [
      { src: "poster-soul-inside", alt: "Poster: large wordmark on cream with forms stacked and scattered at different sizes, a large blush pentagon.", note: "Forms break out and change scale." },
      { src: "poster-steps-free", alt: "Sheet: forms in blue tones cluster around a marigold star above a stepped wordmark, the nine steps listed on the right.", note: "One colour family, stepped wordmark." },
    ],
  },
  {
    level: "5 Layered",
    items: [
      { src: "poster-cape-town-photo", alt: "Cape Town poster: a child in pink sunglasses, white forms and a marigold star over the photo, stepped wordmark.", note: "White forms over the photo, one star in colour." },
      { src: "poster-cape-town-landscape", alt: "Cape Town poster, landscape: the same photo with white forms, stepped wordmark and the date set vertically.", note: "Landscape version." },
      { src: "poster-voorburg", alt: "Voorburg poster: a crowd at a street festival, white wordmark over the trees, translucent coloured forms over the people.", note: "Voorburg. Translucent forms over the crowd." },
    ],
  },
];

const PLAYBOOK = [
  { src: "orientation", alt: "Playbook spread: 'Orientation' in huge black type on yellow, Listen, Gather and Align forms overlapping in translucent orange and green.", note: "Phase opener · Orientation. Forms overlap, translucent." },
  { src: "listen", alt: "Playbook spread: the Listen form and a huge '01' in blush on cream, with the step title and its opening text.", note: "Step opener · the number set huge in the form's colour." },
  { src: "doing", alt: "Playbook spread: 'Doing' in huge type on orange with the Connect, Design and Invite forms overlapping.", note: "Phase opener · Doing." },
  { src: "dimmer-room", alt: "Playbook spread on dark indigo: 'The dimmer room', four sliders topped by forms for Trust, Participation, Art and Festivity, and the settings Candle, Lantern, Bonfire, Fireworks.", note: "The dimmer room · forms as dial heads." },
  { src: "design-toolkit", alt: "Playbook spread on forest green: 'The design toolkit' with a single white Design star.", note: "Section opener · one white form on a full colour field." },
  { src: "culmination", alt: "Playbook spread: 'Culmination' in huge type on pink with the Host, Harvest and Grow forms overlapping.", note: "Phase opener · Culmination." },
  { src: "grow", alt: "Playbook spread: the Grow pentagon and a huge '09', with the step's text.", note: "Step opener · Grow." },
  { src: "lantern", alt: "Playbook spread: the nine forms scattered in colour, facing 'Now go and light the first lantern.'", note: "Closing · the forms set loose." },
];

function Chapter({
  id,
  n,
  title,
  aside,
  children,
}: {
  id: string;
  n: string;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={s.ch} id={id}>
      <div className={s.side}>
        <span className={s.num}>{n}</span>
        <h2 style={{ fontSize: 18 }}>{title}</h2>
        {aside && <p className={s.small}>{aside}</p>}
      </div>
      <div className={s.body}>{children}</div>
    </section>
  );
}

const Proposal = () => <span className={s.chip}>proposal</span>;

export default function Page() {
  return (
    <main className={`w-full flex-1 ${s.guide}`}>
      <BrandSymbols />

      <header className={s.cover}>
        <div className={s.coverInner}>
          <div className={s.meta}>
            <h1 className={s.label}>Brand guide · The fixed identity</h1>
            <span className={s.small} style={{ color: "var(--ink)" }}>
              Working edition · October 2026
            </span>
          </div>
          <div>
            <p className={s.tag}>
              <b>grow trust,</b>
              <br />
              <span>one pocket at a time.</span>
            </p>
            <Sym id="wordmark" w={WORDMARK_BOX.w} h={WORDMARK_BOX.h} className={s.coverWordmark} label="festival of trust" />
          </div>
          <Sym
            id="mark"
            w={3}
            h={3}
            className={s.bigmark}
            style={COLOUR_MARK}
            label="The Festival of Trust mark: nine forms in a three by three grid"
          />
          <div className={s.coverIntro}>
            <p>
              <b>An identity is built like a house.</b> There is a fixed structure that never
              moves: three primitives, nine forms, one grid, one wordmark, one palette. This
              guide sets that structure down.
            </p>
            <p>
              <b>On top of it sits a dimmer.</b> The same structure can be shown solid and black
              and white, or full colour, or layered over photography. Every setting stays on the
              same grid.
            </p>
            <p>
              <b>Use this guide as the floor.</b> Anything made for a festival, a funder or a
              partner starts here. Items marked <Proposal /> are new and still need sign-off.
            </p>
          </div>
          <nav className={s.toc} aria-label="Chapters">
            {CHAPTERS.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className={s.wrap}>
        <Chapter id="primitives" n="01" title="Primitives">
          <p className={s.lede}>
            The system rests on three primitives: <b>circle, triangle, square.</b> Each of the
            nine steps is built by cutting, rotating, or combining them. Transformation carries
            the meaning. Decoration does not.
          </p>
          <div className={s.prims}>
            <figure>
              <svg viewBox="0 0 1 1" aria-hidden="true"><circle cx=".5" cy=".5" r=".5" /></svg>
              <figcaption><b>Circle</b><br /><span className={s.small}>Cut into halves and quarters.</span></figcaption>
            </figure>
            <figure>
              <svg viewBox="0 0 1 1" aria-hidden="true"><path d="M0 0V1L1 .5Z" /></svg>
              <figcaption><b>Triangle</b><br /><span className={s.small}>Mirrored and rotated.</span></figcaption>
            </figure>
            <figure>
              <svg viewBox="0 0 1 1" aria-hidden="true"><rect width="1" height="1" /></svg>
              <figcaption><b>Square</b><br /><span className={s.small}>Whole, turned, or carved away.</span></figcaption>
            </figure>
            <figure>
              <Sym id="grow" style={{ color: "var(--blush)" }} />
              <figcaption>
                <b>Pentagon, the exception</b>
                <br />
                <span className={s.small}>
                  Marks Grow only. It sits outside the three primitives, since Grow is the step
                  where the language exceeds itself.
                </span>
              </figcaption>
            </figure>
          </div>
        </Chapter>

        <Chapter id="steps" n="02" title="The nine steps" aside="One form per step of the festival journey. The forms always keep this order.">
          <div>
            <div className={s.steps}>
              {STEPS.map((st) => (
                <div key={st.id} className={s.step}>
                  <Sym id={st.id} />
                  <div>
                    <div className={s.stepName}>{st.name}.</div>
                    <div className={s.small}>{st.line}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className={s.phase}>
              <div>Row 1 · Orientation</div>
              <div>Row 2 · Doing</div>
              <div>Row 3 · Culmination</div>
            </div>
          </div>
          <div className={s.cols}>
            <div><h3>Read across, then down</h3><p className={s.small}>The mark is the nine steps in reading order. Each row of the grid is one phase of three steps.</p></div>
            <div><h3>Step names end with a full stop</h3><p className={s.small}>Listen. Gather. Align. The full stop makes each step a complete act. Set them in Medium.</p></div>
            <div><h3>A form stands for its step</h3><p className={s.small}>Use a single form on its own to mark a step in a programme, a slide or a signpost.</p></div>
          </div>
        </Chapter>

        <Chapter id="mark" n="03" title="The mark" aside="Nine forms on a 3 × 3 grid. It exists in two fixed versions.">
          <div className={s.plates}>
            <div className={s.plate}>
              <div className={`${s.art} ${s.onCream}`}><Sym id="mark" w={3} h={3} style={COLOUR_MARK} /></div>
              <b>Colour mark</b>
              <span className={s.small}>On cream. The default for anything public.</span>
            </div>
            <div className={s.plate}>
              <div className={`${s.art} ${s.onWhite}`}><Sym id="mark" w={3} h={3} /></div>
              <b>Solid mark</b>
              <span className={s.small}>One colour, ink or white. For stamps, small sizes, single-colour print and partner logo walls.</span>
            </div>
          </div>
          <div className={s.figure}>
            <svg viewBox="-0.6 -0.6 4.2 4.2" role="img" aria-label="Construction of the mark on a three by three grid, cell size x">
              <use href="#fot-mark" width="3" height="3" style={{ color: "#d9cdb6" }} />
              <g fill="none" stroke="#191818" strokeWidth=".012" strokeDasharray=".02 .03">
                <path d="M0 -.4V3.4M1 -.4V3.4M2 -.4V3.4M3 -.4V3.4M-.4 0H3.4M-.4 1H3.4M-.4 2H3.4M-.4 3H3.4" />
                <path d="M0 .5H3M0 1.5H3M0 2.5H3M.5 0V3M1.5 0V3M2.5 0V3" strokeOpacity=".35" />
                <rect x="-.5" y="-.5" width="4" height="4" stroke="#fb2f4a" strokeDasharray="none" strokeWidth=".015" />
              </g>
              <g fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontSize=".16" fontWeight="500" fill="#191818" textAnchor="middle">
                <text x=".5" y="-.2">1x</text>
                <text x="1.5" y="-.2">1x</text>
                <text x="2.5" y="-.2">1x</text>
                <text x="3.35" y="3.42" fill="#fb2f4a" fontSize=".13">0.5x</text>
              </g>
            </svg>
            <div className={`${s.cols} ${s.oneCol}`}>
              <div><h3>One cell is x</h3><p className={s.small}>Every measurement in the identity is a multiple of x: the size of one cell of the mark. Half-cells (0.5x) are the smallest step.</p></div>
              <div><h3>Forms meet edge to edge</h3><p className={s.small}>Arcs have a radius of 0.5x or 1x and are centred on cell corners or edge midpoints. No gaps between cells, no overlaps.</p></div>
              <div><h3>Clear space: 0.5x <Proposal /></h3><p className={s.small}>Keep half a cell free on all sides, shown in red. This follows the 0.5x margins already used on the posters.</p></div>
              <div><h3>Minimum size <Proposal /></h3><p className={s.small}>Colour mark 24 mm / 96 px wide. Below that, use the solid mark, down to 10 mm / 40 px.</p></div>
            </div>
          </div>
        </Chapter>

        <Chapter id="wordmark" n="04" title="Wordmark and lockups" aside={<>Lowercase, Helvetica Neue Bold. &ldquo;trust&rdquo; is set at twice the size of &ldquo;festival of&rdquo;.</>}>
          <div className={s.plates}>
            <div className={s.plate}>
              <div className={`${s.art} ${s.wide} ${s.onCream}`} style={{ padding: "14% 12%" }}><Sym id="wordmark" w={WORDMARK_BOX.w} h={WORDMARK_BOX.h} /></div>
              <b>Wordmark</b>
              <span className={s.small}>The primary sign-off. Stands alone when the mark is already on the page.</span>
            </div>
            <div className={s.plate}>
              <div className={`${s.art} ${s.wide} ${s.onCream}`}><Sym id="lockup" w={LOCKUP_BOX.w} h={LOCKUP_BOX.h} /></div>
              <b>Horizontal lockup</b>
              <span className={s.small}>Solid mark plus wordmark. The mark&apos;s height matches the wordmark block; the gap is 0.42x.</span>
            </div>
          </div>
          <div className={s.plates}>
            <div className={s.plate}>
              <div className={`${s.art} ${s.wide} ${s.onWhite}`}><Sym id="lockup" w={LOCKUP_BOX.w} h={LOCKUP_BOX.h} /></div>
              <span className={s.small}>Ink on white</span>
            </div>
            <div className={s.plate}>
              <div className={`${s.art} ${s.wide} ${s.onInk}`}><Sym id="lockup" w={LOCKUP_BOX.w} h={LOCKUP_BOX.h} /></div>
              <span className={s.small}>White on ink</span>
            </div>
            <div className={s.plate}>
              <div className={`${s.art} ${s.wide} ${s.onPhoto}`}><Sym id="wordmark" w={WORDMARK_BOX.w} h={WORDMARK_BOX.h} /></div>
              <span className={s.small}>White on photography</span>
            </div>
          </div>
          <div className={s.cols}>
            <div><h3>Always lowercase</h3><p className={s.small}>&ldquo;festival of trust&rdquo; is never capitalised inside the wordmark. In running text, write Festival of Trust.</p></div>
            <div><h3>Ink, white, or nothing</h3><p className={s.small}>The wordmark is ink #191818 or white. It does not take a palette colour.</p></div>
            <div><h3>Use the artwork</h3><p className={s.small}>Never retype the wordmark. Spacing and the 1:2 size step are drawn, not typed.</p></div>
          </div>
        </Chapter>

        <Chapter id="colour" n="05" title="Colour" aside="Each of the nine forms carries its own colour in the mark. Seven colours, on cream or white, with ink for words.">
          <div className={s.base}>
            <div className={s.sw}><div className={s.chipc} style={{ background: "var(--cream)" }} /><span className={s.swName}>Cream</span><span className={s.swVal}>#FBECD2 · RGB 251 236 210<br />Ground for the colour identity</span></div>
            <div className={s.sw}><div className={s.chipc} style={{ background: "var(--ink)" }} /><span className={s.swName}>Ink</span><span className={s.swVal}>#191818 · RGB 25 24 24<br />Wordmark, text, solid mark</span></div>
            <div className={s.sw}><div className={`${s.chipc} ${s.onWhite}`} /><span className={s.swName}>White</span><span className={s.swVal}>#FFFFFF<br />Calm ground, reversed type</span></div>
          </div>
          <div className={s.swatches}>
            {PALETTE.map((c) => (
              <div key={c.name} className={s.sw}>
                <div className={s.chipc} style={{ background: c.hex }} />
                <span className={s.swName}>{c.name}</span>
                <span className={s.swVal}>{c.hex}<br />RGB {c.rgb}<br />{c.use}</span>
              </div>
            ))}
          </div>
          <p className={s.small}>
            Colour names are working names <Proposal />. Hex values are taken from the identity
            artwork. CMYK and Pantone references still need to be set with the printer.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            <h3>The spectrum and its blends</h3>
            <div className={s.spectrum}>
              {PALETTE.map((c) => <div key={c.name} style={{ background: c.hex }} />)}
            </div>
            <div className={s.blends}>
              {BLENDS.map(([a, b]) => <div key={a + b} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />)}
            </div>
            <p className={s.small}>
              The seven colours form one warm-to-cool spectrum. A blend only runs between
              neighbours, and only on a flat field or a photograph, never inside one of the nine
              forms.
            </p>
          </div>
        </Chapter>

        <Chapter id="type" n="06" title="Typography" aside="One family: Helvetica Neue. Hierarchy comes from weight and size, never from a second typeface.">
          <div className={s.spec}>
            <div className={s.weights}>
              <span style={{ fontWeight: 300 }}>Light</span>
              <span>Regular</span>
              <span style={{ fontWeight: 500 }}>Medium</span>
              <b>Bold</b>
            </div>
            <div className={s.row}>
              <div><b>Wordmark logic</b><br /><span className={s.small}>Bold · 1 : 2 · leading 0.86</span></div>
              <div className={s.wordspec}><span>festival of</span><span>trust</span></div>
            </div>
            <div className={s.row}>
              <div><b>Tagline</b><br /><span className={s.small}>Bold + Light · Lagoon on cream</span></div>
              <div className={s.tag} style={{ fontSize: "clamp(26px, 3.6vw, 40px)" }}><b>grow trust,</b><br /><span>one pocket at a time.</span></div>
            </div>
            <div className={s.row}>
              <div><b>Headline</b><br /><span className={s.small}>Bold · tight · sentence case</span></div>
              <div style={{ fontSize: "clamp(30px, 4.4vw, 52px)", lineHeight: 1, fontWeight: 700, letterSpacing: "-0.025em" }}>
                But look closer,<br /><span style={{ fontWeight: 300 }}>and the picture is not that grim.</span>
              </div>
            </div>
            <div className={s.row}>
              <div><b>Steps</b><br /><span className={s.small}>Medium · full stop · three lines per x</span></div>
              <div style={{ fontWeight: 500, fontSize: 22, lineHeight: 1.35, color: "var(--lagoon)" }}>Listen.<br />Gather.<br />Align.</div>
            </div>
            <div className={s.row}>
              <div><b>Body</b><br /><span className={s.small}>Regular or Light · 9–11 pt in print</span></div>
              <p>Somewhere, a promise gets kept between two relatives. A neighbour shows up without being asked. A stranger returns a wallet, cash still inside. Trust still quietly holds.</p>
            </div>
            <div className={s.row}>
              <div><b>Place and date</b><br /><span className={s.small}>Bold · caps for place · DD.MM.YYYY</span></div>
              <div style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--forest)" }}>CAPE TOWN | 25.09.2026</div>
            </div>
            <p className={s.small}>
              On screens where Helvetica Neue is not installed, the fallback is Helvetica, then
              Arial <Proposal />.
            </p>
          </div>
        </Chapter>

        <Chapter id="grid" n="07" title="Grid" aside="The grid is derived from the nine steps: nine cells, three rows of three, one row per phase.">
          <div className={s.figure}>
            <svg viewBox="0 0 5.5 6" role="img" aria-label="Poster grid: half-x margins, three x columns for the mark, a half-x gutter and one x column for the steps">
              <rect width="5.5" height="6" fill="#fbecd2" />
              <use href="#fot-mark" x=".5" y="2.5" width="3" height="3" style={COLOUR_MARK} />
              <use href="#fot-wordmark" x=".5" y=".62" width="1.15" height=".53" style={{ color: "#191818" }} />
              <g fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif" fontWeight="500" fontSize=".2" fill="#348eac">
                {STEPS.map((st, i) => (
                  <text key={st.id} x="4" y={2.72 + i * 0.333}>{st.name}.</text>
                ))}
              </g>
              <path
                d="M.5 0V6M1.5 0V6M2.5 0V6M3.5 0V6M4 0V6M5 0V6M0 .5H5.5M0 1.5H5.5M0 2.5H5.5M0 3.5H5.5M0 4.5H5.5M0 5.5H5.5"
                fill="none" stroke="#191818" strokeWidth=".012" strokeDasharray=".02 .035"
              />
            </svg>
            <div className={`${s.cols} ${s.oneCol}`}>
              <div><h3>Build the page from x</h3><p className={s.small}>Margins are 0.5x. Columns are 1x. The steps column sits 0.5x away from the mark. On this format: 0.5 · 1 · 1 · 1 · 0.5 · 1 · 0.5 across, 0.5 · 1 · 1 · 1 · 1 · 1 · 0.5 down.</p></div>
              <div><h3>Intuition proposes, the grid returns order</h3><p className={s.small}>Size and position can follow intuition while creating, but always fall back into the grid&apos;s structure. Every composition still answers to the same underlying structure.</p></div>
              <div><h3>Three lines per cell</h3><p className={s.small}>Step lists are set so three steps fill one cell. That keeps text and forms on the same rhythm.</p></div>
            </div>
          </div>
        </Chapter>

        <Chapter id="dimmer" n="08" title="The dimmer" aside="One structure, five settings. Turn it down for calm and authority, up for festival energy. The grid, forms and wordmark never change.">
          <p className={s.lede}>
            The identity is <b>architecture, not decoration.</b> The dimmer decides how much of it
            you light up: from solid black and white to full colour layered over life.
          </p>
          <Dimmer />
          <p className={s.small}>
            The five settings and their names are a first proposal <Proposal />, read from the
            posters, book and logo sheets in the identity file.
          </p>
          <div style={{ display: "grid", gap: 14 }}>
            <h3>At every setting, never</h3>
            <div className={s.dont}>
              <figure>
                <div className={s.dontArt}><Sym id="mark" w={3} h={3} style={{ ...COLOUR_MARK, transform: "scaleX(1.35)" }} /></div>
                <figcaption className={s.small}>Stretch or squash the mark</figcaption>
              </figure>
              <figure>
                <div className={s.dontArt}>
                  <svg viewBox="-.1 -.1 3.2 3.2" aria-hidden="true" style={COLOUR_MARK}>
                    <use href="#fot-mark" width="3" height="3" stroke="#191818" strokeWidth=".06" />
                  </svg>
                </div>
                <figcaption className={s.small}>Add outlines, shadows or effects</figcaption>
              </figure>
              <figure>
                <div className={s.dontArt}>
                  <Sym id="mark" w={3} h={3} style={{ "--listen": "#348eac", "--gather": "#fbb4a8", "--align": "#fb2f4a", "--connect": "#0c7b4b", "--design": "#fbac0f", "--invite": "#4e4c9f", "--host": "#fbac0f", "--harvest": "#6d5687", "--grow": "#0c7b4b" } as CSSProperties} />
                </div>
                <figcaption className={s.small}>Recolour the forms at random</figcaption>
              </figure>
              <figure>
                <div className={s.dontArt}>
                  <svg viewBox="0 0 3 2" aria-hidden="true" style={COLOUR_MARK}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <use key={i} href="#fot-grow" x={i % 3} y={Math.floor(i / 3)} width="1" height="1" />
                    ))}
                  </svg>
                </div>
                <figcaption className={s.small}>Use the pentagon for anything but Grow</figcaption>
              </figure>
              <figure>
                <div className={s.dontArt}>
                  <svg viewBox="0 0 3 3" aria-hidden="true" style={COLOUR_MARK}>
                    <use href="#fot-listen" x=".13" y=".2" width="1" height="1" />
                    <use href="#fot-design" x="1.37" y=".08" width="1" height="1" />
                    <use href="#fot-harvest" x=".7" y="1.55" width="1" height="1" />
                    <use href="#fot-invite" x="1.9" y="1.3" width="1" height="1" />
                  </svg>
                </div>
                <figcaption className={s.small}>Place forms off the grid</figcaption>
              </figure>
            </div>
          </div>
        </Chapter>

        <Chapter id="in-use" n="09" title="In use" aside="The book, the Playbook and the posters, sorted by dimmer setting. Made from the same nine forms and the same grid.">
          <div className={s.book}>
            <div style={{ display: "grid", gap: 6 }}>
              <span className={s.label}>The book · the whole dimmer in one object</span>
              <p className={s.small}>
                The cover runs at Full. Inside, a single marigold star sits on white, then the mark
                breaks open in white over a photograph. One object turns the dimmer from calm to
                wild, page by page.
              </p>
            </div>
            <div className={s.bookRow}>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element -- artwork exports, shown as-is */}
                <img src="/brand/guide/book-1.jpg" alt="Book cover: 'grow trust, one pocket at a time.' above the colour mark on cream." loading="lazy" />
                <figcaption className={s.small}>Cover · Full</figcaption>
              </figure>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/guide/book-2.jpg" alt="Book spread: 'Trust seems to be disappearing everywhere. But look closer, and the picture is not that grim.' around a single marigold star, with the opening text on the right." loading="lazy" />
                <figcaption className={s.small}>Opening spread · one form on white</figcaption>
              </figure>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/guide/book-3.jpg" alt="Book spread: photo of a child in pink sunglasses with the Gather form and wordmark in white, the steps listed with Align highlighted; text on the right." loading="lazy" />
                <figcaption className={s.small}>Step spread · Layered, the current step highlighted</figcaption>
              </figure>
            </div>
          </div>

          <div className={s.playbook}>
            <div style={{ display: "grid", gap: 6 }}>
              <span className={s.label}>The Playbook · Trust is made together</span>
              <p className={s.small}>
                The 150-page playbook for hosts is the identity at its wildest. Forms overlap and
                turn translucent, each phase opens on a full field of colour, step numbers run
                off the page in the form&apos;s colour. Underneath, the same nine forms on the same
                grid.
              </p>
            </div>
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/guide/playbook-cover.jpg" alt="Playbook cover, back, spine and front: 'Trust is made together.' under the nine forms overlapping in translucent colour on cream." loading="lazy" />
              <figcaption className={s.small}>Cover · back, spine, front</figcaption>
            </figure>
            <div className={s.spreads}>
              {PLAYBOOK.map((it) => (
                <figure key={it.src}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/brand/guide/playbook-${it.src}.jpg`} alt={it.alt} loading="lazy" />
                  <figcaption className={s.small}>{it.note}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          {IN_USE.map((g) => (
            <div key={g.level} style={{ display: "grid", gap: 14 }}>
              <div className={s.groupHead}>
                <h3>{g.level}</h3>
              </div>
              <div className={s.gallery}>
                {g.items.map((it) => (
                  <figure key={it.src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/brand/guide/${it.src}.jpg`} alt={it.alt} loading="lazy" />
                    <figcaption className={s.small}>{it.note}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
        </Chapter>
      </div>

      <div id="generator" className={s.genHead}>
        <div className={s.side} style={{ position: "static" }}>
          <span className={s.num}>10</span>
          <h2 style={{ fontSize: 18 }}>Generator</h2>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <p className={s.lede}>
            Make a form of your own in the logo&apos;s grammar: <b>a connected cluster, one anchor,
            a trailing tail.</b>
          </p>
          <p className={s.small}>
            Slide from the nine grid towards breakout. Click a tile to open and edit it, tick to
            pick, then export as SVG. Saved forms stay in this browser.
          </p>
        </div>
      </div>
      <div className={s.generator}>
        <Generator shared={false} />
      </div>
    </main>
  );
}
