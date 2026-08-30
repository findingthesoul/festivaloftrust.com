"use client";

import { useEffect, useRef, useState } from "react";
import {
  BACKGROUNDS,
  build,
  GRADIENT_PAIRS,
  isGradient,
  gradientIndex,
  ORIGINAL_FILLS,
  PALETTE,
  SHAPES,
  svgForItems,
  UNIT,
  type Fill,
  type Item,
  type Options,
} from "./core";

// What the editor hands back on Save — one saved form (a version).
//
// The colour model has four options: one colour for all (base solid, no
// accent); one colour for one shape with the rest sharing a colour or a
// gradient (accent solid + base); one gradient for all (base gradient, no
// accent); or every shape its original colour. Gradients apply to the base —
// the shapes around the accent — never to the accent itself.
export type FormState = {
  seed: number;
  items: Item[];
  base: Fill;
  original: boolean;
  accent: { i: number; fill: Fill } | null;
  // The canvas background is part of the form — thumbnails and exports show
  // it (white stays transparent paper in exports).
  bg: string;
};

export const fillsOf = (f: FormState): (Fill | null)[] =>
  f.items.map((it, i) =>
    f.original ? ORIGINAL_FILLS[it.id] : f.accent?.i === i ? f.accent.fill : null,
  );

// The canvas works in cell units (viewBox = cells), so pointer math and
// snapping stay in the same space the algorithm uses.
//
// Magnet priority: the lattice comes first — every shape lives in a grid
// square, and a shape dragged out of its cell must be able to come straight
// back. Near a half-cell position on both axes the drop locks to the grid and
// nothing else interferes. Only between grid points does the silhouette
// magnet engage and pull the outline into contact with a neighbour.
const GRID_MAGNET = 0.15; // lock range to the half-cell lattice
const MAGNET = 0.18; // silhouette contact range
const GRID = 0.25; // fine fallback grid step

// --- Silhouette magnet. Box edges are not enough: a diamond or sparkle never
// reaches its box edge, so box-snapping leaves daylight between forms. Each
// master shape's real outline is sampled once (browser path geometry, so
// curves and the diamond's transform come out right), and dragging snaps the
// outlines themselves together.
type Pt = [number, number];
const loopCache = new Map<number, Pt[][]>();

function shapeLoops(id: number): Pt[][] {
  const hit = loopCache.get(id);
  if (hit) return hit;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden");
  svg.innerHTML = SHAPES[id];
  document.body.appendChild(svg);
  const loops: Pt[][] = [];
  svg.querySelectorAll<SVGGeometryElement>("circle,rect,polygon,path").forEach((el) => {
    const m = el.transform.baseVal.consolidate()?.matrix;
    const L = el.getTotalLength();
    const n = Math.max(24, Math.min(96, Math.round(L / 8)));
    const pts: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const p = el.getPointAtLength((L * i) / n);
      pts.push(m ? [m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f] : [p.x, p.y]);
    }
    loops.push(pts);
  });
  svg.remove();
  loopCache.set(id, loops);
  return loops;
}

function worldLoops(it: Item): Pt[][] {
  const c = UNIT / 2;
  const rad = (it.rot * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const s = it.size / UNIT;
  return shapeLoops(it.id).map((loop) =>
    loop.map(([x, y]): Pt => {
      const rx = cos * (x - c) - sin * (y - c) + c;
      const ry = sin * (x - c) + cos * (y - c) + c;
      return [it.x + rx * s, it.y + ry * s];
    }),
  );
}

// Closest approach between two outline sets: checks each set's sample points
// against the other's segments. Returns the vector that moves A into contact.
function closestPull(a: Pt[][], b: Pt[][]): { d: number; v: Pt } {
  let d = Infinity;
  let v: Pt = [0, 0];
  const scan = (pts: Pt[][], segs: Pt[][], aIsPts: boolean) => {
    for (const lp of pts)
      for (const [px, py] of lp)
        for (const ls of segs)
          for (let i = 0; i < ls.length; i++) {
            const [x1, y1] = ls[i];
            const [x2, y2] = ls[(i + 1) % ls.length];
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len2 = dx * dx + dy * dy || 1;
            const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
            const cx = x1 + t * dx;
            const cy = y1 + t * dy;
            const dist = Math.hypot(px - cx, py - cy);
            if (dist < d) {
              d = dist;
              v = aIsPts ? [cx - px, cy - py] : [px - cx, py - cy];
            }
          }
  };
  scan(a, b, true);
  scan(b, a, false);
  return { d, v };
}

// A dropdown that shows colours as colours: the trigger wears the current
// swatch, the panel is a grid of swatches (names live in tooltips).
export function SwatchDropdown({
  label,
  value,
  options,
  onChange,
  disabled,
  title,
}: {
  label: string;
  value: string;
  options: { value: string; name: string; swatch: React.CSSProperties }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  const current = options.find((o) => o.value === value);
  return (
    <div ref={ref} className="relative flex items-center gap-2 text-sm" title={title}>
      <span>{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title={current?.name}
        className="flex items-center gap-1.5 border border-black/25 bg-white px-2 py-1.5 disabled:opacity-40"
      >
        <span className="h-5 w-5 rounded-full border border-black/20" style={current?.swatch} />
        <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 grid w-max grid-cols-8 gap-1.5 border border-black/15 bg-white p-2 shadow-lg">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              title={o.name}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="h-7 w-7 rounded-full border border-black/20"
              style={{
                ...o.swatch,
                outline: o.value === value ? "2px solid #141414" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const ORIGINAL_SWATCH: React.CSSProperties = {
  background: "conic-gradient(#EEB9AC, #F3B33C, #E4444C, #47499C, #2E8B56, #EEB9AC)",
};
const NONE_SWATCH: React.CSSProperties = {
  background:
    "linear-gradient(135deg, transparent 45%, #E4444C 45%, #E4444C 55%, transparent 55%), #fff",
};
const gradientSwatch = (n: number): React.CSSProperties => ({
  background: `linear-gradient(135deg, ${PALETTE[GRADIENT_PAIRS[n][0]].hex} 25%, ${PALETTE[GRADIENT_PAIRS[n][1]].hex} 75%)`,
});

export const SHAPE_COLOUR_OPTIONS = [
  ...PALETTE.map((c) => ({
    value: c.hex,
    name: c.name,
    swatch: { backgroundColor: c.hex } as React.CSSProperties,
  })),
  ...GRADIENT_PAIRS.map(([a, b], n) => ({
    value: `g:${n}`,
    name: `${PALETTE[a].name}–${PALETTE[b].name} gradient`,
    swatch: gradientSwatch(n),
  })),
  { value: "original", name: "Original colours", swatch: ORIGINAL_SWATCH },
];

const ACCENT_OPTIONS = [
  { value: "none", name: "None", swatch: NONE_SWATCH },
  ...PALETTE.map((c) => ({
    value: c.hex,
    name: c.name,
    swatch: { backgroundColor: c.hex } as React.CSSProperties,
  })),
];

const BACKGROUND_OPTIONS = BACKGROUNDS.map((b) => ({
  value: b.hex,
  name: b.name,
  swatch: { backgroundColor: b.hex } as React.CSSProperties,
}));

export function Editor({
  seed,
  color,
  opts,
  initial,
  title,
  collections,
  collection,
  onCollectionChange,
  onSave,
  onClose,
}: {
  seed: number;
  color: string;
  opts: Options;
  // When set, the editor opens a saved form instead of the generated seed.
  initial?: FormState;
  // Header label — says whether this is a saved version or a fresh seed.
  title: string;
  collections: string[];
  collection: string;
  onCollectionChange: (value: string) => void;
  onSave: (form: FormState) => void;
  onClose: () => void;
}) {
  // Fixed canvas: initial composition plus room to drag, so nothing reflows
  // under the cursor mid-drag.
  const [dims] = useState(() => {
    const src = initial ? initial.items : build(seed, opts).items;
    const minX = Math.min(...src.map((i) => i.x));
    const minY = Math.min(...src.map((i) => i.y));
    const its = src.map((i) => ({ ...i, x: i.x - minX + 2, y: i.y - minY + 2 }));
    return {
      its,
      w: Math.max(...its.map((i) => i.x + i.size)) + 2,
      h: Math.max(...its.map((i) => i.y + i.size)) + 2,
    };
  });
  const [items, setItems] = useState<Item[]>(dims.its);
  const [sel, setSel] = useState<number | null>(null);
  const [base, setBase] = useState<Fill>(
    initial ? initial.base : color === "original" ? PALETTE[5].hex : color,
  );
  const [original, setOriginal] = useState(initial?.original ?? color === "original");
  const [accent, setAccent] = useState<{ i: number; fill: Fill } | null>(
    initial?.accent ?? null,
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [bg, setBg] = useState<string>(initial?.bg ?? BACKGROUNDS[0].hex);
  const [showGrid, setShowGrid] = useState(true);
  const darkBg = bg === "#141414";
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    i: number;
    ox: number;
    oy: number;
    px: number;
    py: number;
    otherLoops: { o: Item; loops: Pt[][] }[];
  } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toCell = (e: React.PointerEvent): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * dims.w, ((e.clientY - r.top) / r.height) * dims.h];
  };

  const startDrag = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation();
    setSel(i);
    const [px, py] = toCell(e);
    const others = items.filter((_, j) => j !== i);
    dragRef.current = {
      i,
      ox: items[i].x,
      oy: items[i].y,
      px,
      py,
      // Static during the drag, so sample the neighbours' outlines once.
      otherLoops: others.map((o) => ({ o, loops: worldLoops(o) })),
    };
    svgRef.current!.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const [cx, cy] = toCell(e);
    const p = items[d.i];
    let x = d.ox + cx - d.px;
    let y = d.oy + cy - d.py;
    // Lattice first: near a half-cell position on both axes, lock to the grid
    // (the original drawing's rule — shapes sit in grid squares).
    const gx = Math.round(x * 2) / 2;
    const gy = Math.round(y * 2) / 2;
    if (Math.abs(x - gx) < GRID_MAGNET && Math.abs(y - gy) < GRID_MAGNET) {
      x = gx;
      y = gy;
    } else {
      // Between grid points: silhouette magnet pulls the dragged outline into
      // actual contact with a neighbour's outline.
      const dragged = worldLoops({ ...p, x, y });
      let best: { d: number; v: Pt } | null = null;
      for (const { o, loops } of d.otherLoops) {
        const clear =
          x > o.x + o.size + MAGNET ||
          o.x > x + p.size + MAGNET ||
          y > o.y + o.size + MAGNET ||
          o.y > y + p.size + MAGNET;
        if (clear) continue;
        const r = closestPull(dragged, loops);
        if (r.d <= MAGNET && (!best || r.d < best.d)) best = r;
      }
      if (best) {
        x += best.v[0];
        y += best.v[1];
      } else {
        x = Math.round(x / GRID) * GRID;
        y = Math.round(y / GRID) * GRID;
      }
    }
    setItems((prev) => prev.map((it, j) => (j === d.i ? { ...it, x, y } : it)));
  };

  const update = (fn: (p: Item) => Item) =>
    sel !== null && setItems((prev) => prev.map((p, i) => (i === sel ? fn(p) : p)));
  const rotate = () => update((p) => ({ ...p, rot: (p.rot + 90) % 360 }));
  // Sizes live on a fixed ladder: half, single, double, quadruple cell.
  const SIZES = [0.5, 1, 2, 4];
  const resize = (dir: 1 | -1) =>
    update((p) => {
      const size =
        dir > 0
          ? (SIZES.find((s) => s > p.size + 1e-9) ?? p.size)
          : ([...SIZES].reverse().find((s) => s < p.size - 1e-9) ?? p.size);
      const shift = (p.size - size) / 2;
      return { ...p, size, x: p.x + shift, y: p.y + shift };
    });

  // Stacking: painters order = array order, so front/back is a reorder. The
  // accent and selection follow their shape to its new index.
  const reorder = (dir: "front" | "back") => {
    if (sel === null) return;
    const from = sel;
    const to = dir === "front" ? items.length - 1 : 0;
    setItems((prev) => {
      const arr = [...prev];
      const [it] = arr.splice(from, 1);
      if (dir === "front") arr.push(it);
      else arr.unshift(it);
      return arr;
    });
    setAccent((a) => {
      if (!a) return a;
      let ai = a.i;
      if (ai === from) ai = to;
      else if (dir === "front" && ai > from) ai -= 1;
      else if (dir === "back" && ai < from) ai += 1;
      return { ...a, i: ai };
    });
    setSel(to);
  };

  const formState = (): FormState => ({ seed, items, base, original, accent, bg });

  const fillOf = (i: number): Fill =>
    original ? ORIGINAL_FILLS[items[i].id] : accent?.i === i ? accent.fill : base;
  // A gradient sweeps the whole composition as one: its shapes become a mask
  // over a single full-canvas gradient rect.
  const gradGroups = (() => {
    const m = new Map<number, number[]>();
    items.forEach((_, i) => {
      const f = fillOf(i);
      if (isGradient(f)) {
        const n = gradientIndex(f);
        m.set(n, [...(m.get(n) ?? []), i]);
      }
    });
    return m;
  })();
  const tf = (p: Item) =>
    `translate(${p.x},${p.y}) scale(${p.size / UNIT}) rotate(${p.rot} ${UNIT / 2} ${UNIT / 2})`;
  // The gradient's frame must be the SAME here as in thumbnails and exports —
  // the shapes' tight bounding box plus margin — or the blend would land on
  // different shapes in the editor than in the saved file.
  const bbMinX = Math.min(...items.map((i) => i.x)) - 0.5;
  const bbMinY = Math.min(...items.map((i) => i.y)) - 0.5;
  const bbW = Math.max(...items.map((i) => i.x + i.size)) - bbMinX + 0.5;
  const bbH = Math.max(...items.map((i) => i.y + i.size)) - bbMinY + 0.5;

  const save = () => {
    onSave(formState());
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const exportSvg = () => {
    const f = formState();
    const blob = new Blob(
      [svgForItems(f.items, f.base, fillsOf(f), { ...f, collection }, f.bg)],
      { type: "image/svg+xml" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fot-cluster-${seed}-edited.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selected = sel !== null ? items[sel] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-8">
      <div className="flex max-h-full w-full max-w-3xl flex-col gap-3 overflow-y-auto bg-background p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-medium">{title}</span>
          <button
            type="button"
            onClick={rotate}
            disabled={sel === null}
            className="border border-current px-3 py-1.5 text-sm disabled:opacity-30"
          >
            Rotate 90°
          </button>
          <button
            type="button"
            onClick={() => resize(-1)}
            disabled={sel === null}
            className="border border-current px-3 py-1.5 text-sm disabled:opacity-30"
          >
            Smaller
          </button>
          <button
            type="button"
            onClick={() => resize(1)}
            disabled={sel === null}
            className="border border-current px-3 py-1.5 text-sm disabled:opacity-30"
          >
            Bigger
          </button>
          <button
            type="button"
            onClick={() => reorder("front")}
            disabled={sel === null}
            title="Bring the selected shape to the front"
            className="border border-current px-3 py-1.5 text-sm disabled:opacity-30"
          >
            To front
          </button>
          <button
            type="button"
            onClick={() => reorder("back")}
            disabled={sel === null}
            title="Send the selected shape to the back"
            className="border border-current px-3 py-1.5 text-sm disabled:opacity-30"
          >
            To back
          </button>
          <button
            type="button"
            onClick={() => {
              setItems(dims.its);
              setSel(null);
            }}
            className="border border-current px-3 py-1.5 text-sm"
          >
            Reset
          </button>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={collection}
              onChange={(e) => onCollectionChange(e.target.value)}
              title="Collection to save into"
              className="border border-black/25 bg-white px-2 py-1.5 text-sm"
            >
              {collections.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__new__">+ New collection…</option>
            </select>
            <button
              type="button"
              onClick={save}
              className="border border-current px-3 py-1.5 text-sm font-medium"
            >
              {savedFlash ? "Saved ✓" : "Save"}
            </button>
            <button
              type="button"
              onClick={exportSvg}
              className="bg-foreground px-3 py-1.5 text-sm font-medium text-background"
            >
              Export SVG
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="px-3 py-1.5 text-lg">
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <SwatchDropdown
            label="Shape colour"
            value={original ? "original" : base}
            options={SHAPE_COLOUR_OPTIONS}
            onChange={(v) => {
              if (v === "original") {
                setOriginal(true);
              } else {
                setOriginal(false);
                setBase(v);
              }
            }}
          />

          <SwatchDropdown
            label="Accent"
            value={sel !== null && accent?.i === sel ? accent.fill : "none"}
            options={ACCENT_OPTIONS}
            disabled={sel === null || original}
            title={sel === null ? "Select a shape first" : "Colour for the selected shape"}
            onChange={(v) => {
              if (sel === null) return;
              if (v === "none") {
                setAccent((a) => (a?.i === sel ? null : a));
              } else {
                setAccent({ i: sel, fill: v });
              }
            }}
          />

          <SwatchDropdown
            label="Background"
            value={bg}
            options={BACKGROUND_OPTIONS}
            onChange={setBg}
          />

          <label className="flex cursor-pointer items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="accent-current"
            />
            Grid
          </label>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          className="min-h-0 w-full flex-1 touch-none"
          style={{ aspectRatio: `${dims.w} / ${dims.h}`, backgroundColor: bg }}
          onPointerMove={onMove}
          onPointerUp={() => (dragRef.current = null)}
          onPointerDown={() => setSel(null)}
        >
          <defs>
            {GRADIENT_PAIRS.map(([a, b], n) => (
              <linearGradient key={n} id={`eg${n}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0.25" stopColor={PALETTE[a].hex} />
                <stop offset="0.75" stopColor={PALETTE[b].hex} />
              </linearGradient>
            ))}
          </defs>
          {/* magnet grid */}
          {showGrid && (
            <g stroke={darkBg ? "#FFFFFF26" : "#00000012"} strokeWidth={0.015}>
              {Array.from({ length: Math.floor(dims.w) }, (_, i) => (
                <line key={"v" + i} x1={i + 1} y1={0} x2={i + 1} y2={dims.h} />
              ))}
              {Array.from({ length: Math.floor(dims.h) }, (_, i) => (
                <line key={"h" + i} x1={0} y1={i + 1} x2={dims.w} y2={i + 1} />
              ))}
            </g>
          )}
          {[...gradGroups].map(([n, idxs]) => (
            <g key={`gl${n}`}>
              <mask id={`egm${n}`}>
                {idxs.map((i) => (
                  <g
                    key={i}
                    transform={tf(items[i])}
                    fill="#fff"
                    dangerouslySetInnerHTML={{ __html: SHAPES[items[i].id] }}
                  />
                ))}
              </mask>
              <rect
                x={bbMinX}
                y={bbMinY}
                width={bbW}
                height={bbH}
                fill={`url(#eg${n})`}
                mask={`url(#egm${n})`}
              />
            </g>
          ))}
          {items.map((p, i) =>
            isGradient(fillOf(i)) ? null : (
              <g
                key={i}
                transform={tf(p)}
                fill={fillOf(i)}
                dangerouslySetInnerHTML={{ __html: SHAPES[p.id] }}
              />
            ),
          )}
          {/* hit layer: every shape stays clickable regardless of paint */}
          {items.map((p, i) => (
            <g
              key={`hit${i}`}
              transform={tf(p)}
              fill="transparent"
              className="cursor-grab"
              onPointerDown={startDrag(i)}
              dangerouslySetInnerHTML={{ __html: SHAPES[p.id] }}
            />
          ))}
          {selected && (
            <rect
              x={selected.x}
              y={selected.y}
              width={selected.size}
              height={selected.size}
              fill="none"
              stroke={darkBg ? "#FFFFFF" : "#141414"}
              strokeWidth={0.025}
              strokeDasharray="0.08 0.06"
              pointerEvents="none"
            />
          )}
        </svg>

        <p className="text-xs text-black/50">
          Click a shape to select it, drag to move — near the grid it locks to
          the grid squares (as in the original drawing); between grid points it
          snaps onto neighbouring shapes. Shape colour sets the whole form (a
          gradient sweeps it as one); Accent gives the selected shape its own
          colour (one accent at a time). Save adds a version to the saved forms
          list.
        </p>
      </div>
    </div>
  );
}
