// Shape composition generator — the logo's grammar: one dense connected
// cluster, one 2x anchor touching it, a short shrinking tail trailing off.
// Everything connected, nine shapes always, clean 90° rotations, lattice
// snapped (the tail shrink is the one deliberate sub-cell exception).

export const UNIT = 226.8;

// The seven palette colours, sampled from the original drawing's colour sheet.
export const PALETTE = [
  { name: "Pink", hex: "#EEB9AC" },
  { name: "Amber", hex: "#F3B33C" },
  { name: "Red", hex: "#E4444C" },
  { name: "Plum", hex: "#6A5A7E" },
  { name: "Indigo", hex: "#47499C" },
  { name: "Blue", hex: "#4C87A9" },
  { name: "Green", hex: "#2E8B56" },
  { name: "Black", hex: "#141414" },
  { name: "White", hex: "#FFFFFF" },
] as const;

// Canvas background choices (the cream is the site background).
export const BACKGROUNDS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Cream", hex: "#FEECD2" },
  { name: "Black", hex: "#141414" },
] as const;

// The six gradients blend neighbouring palette colours, running diagonally.
export const GRADIENT_PAIRS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
];

// A fill is a solid hex, or "g:N" for gradient N from GRADIENT_PAIRS.
export type Fill = string;
export const isGradient = (f: Fill) => f.startsWith("g:");
export const gradientIndex = (f: Fill) => Number(f.slice(2));

// Each master shape's colour in the original drawing.
export const ORIGINAL_FILLS: Fill[] = [
  PALETTE[0].hex, // four circles — pink
  PALETTE[5].hex, // pinwheel — blue
  PALETTE[1].hex, // half circles — amber
  PALETTE[3].hex, // diamond — plum
  PALETTE[1].hex, // bowtie — amber
  PALETTE[6].hex, // sparkle — green
  PALETTE[2].hex, // circle — red
  PALETTE[0].hex, // pentagon — pink
  PALETTE[4].hex, // square — indigo
];

// The nine master shapes, viewBox 0 0 226.8 226.8, single fill. Do not redraw.
export const SHAPES = [
  `<circle cx="56.7" cy="170.1" r="56.7"/><circle cx="170.1" cy="170.1" r="56.7"/><circle cx="56.7" cy="56.7" r="56.7"/><circle cx="170.1" cy="56.7" r="56.7"/>`,
  `<path d="M226.8,0C164.2,0,113.4,50.8,113.4,113.4s50.8,113.4,113.4,113.4V0Z"/><path d="M0,113.4c62.6,0,113.4-50.8,113.4-113.4H0v113.4Z"/><path d="M0,113.4v113.4h113.4c0-62.6-50.8-113.4-113.4-113.4Z"/>`,
  `<path d="M226.8,226.8c0-62.6-50.8-113.4-113.4-113.4S0,164.2,0,226.8h226.8Z"/><path d="M0,0C0,62.6,50.8,113.4,113.4,113.4c62.6,0,113.4-50.8,113.4-113.4H0Z"/>`,
  `<rect x="33.2" y="33.2" width="160.4" height="160.4" transform="translate(113.4 273.7) rotate(-135)"/>`,
  `<polygon points="0 0 0 226.8 113.4 113.4 0 0"/><polygon points="113.4 113.4 226.8 226.8 226.8 0 113.4 113.4"/>`,
  `<path d="M0,113.4c62.6,0,113.4,50.8,113.4,113.4,0-62.6,50.8-113.4,113.4-113.4-62.6,0-113.4-50.8-113.4-113.4,0,62.6-50.8,113.4-113.4,113.4Z"/>`,
  `<circle cx="113.4" cy="113.4" r="113.4"/>`,
  `<polygon points="0 162.4 22.2 22.2 162.4 0 226.8 126.4 126.4 226.8 0 162.4"/>`,
  `<rect width="226.8" height="226.8"/>`,
];

const PENTAGON = 7;

export type Options = {
  // 0 = tightest, squarest mass (the nine-grid block); 1 = stringy sprawl —
  // growth actively prefers cells far from the centre of the mass.
  compactness: number;
  // Keep the pentagon (Grow, the shape that exceeds the system) in the tail.
  pentagonTail: boolean;
  // 0 = fully stable: every size and position on the lattice grammar.
  // 1 = wild: shapes shrink or grow (on the half/double ladder) and slide
  // off-grid — but the composition always stays one connected mass.
  wildness: number;
};

export const DEFAULT_OPTIONS: Options = {
  compactness: 0.4,
  pentagonTail: false,
  wildness: 0.25,
};

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Positions and sizes in cell units; the tail may sit off-lattice.
export type Item = { id: number; x: number; y: number; size: number; rot: number };

type Rect = { x: number; y: number; size: number };

const overlaps = (a: Rect, b: Rect) => {
  const eps = 1e-6;
  return (
    a.x + a.size > b.x + eps &&
    b.x + b.size > a.x + eps &&
    a.y + a.size > b.y + eps &&
    b.y + b.size > a.y + eps
  );
};

// Boxes count as in contact when they abut (edge or corner) or overlap.
const touchesBox = (a: Rect, b: Rect) => {
  const eps = 1e-6;
  return (
    a.x + a.size >= b.x - eps &&
    b.x + b.size >= a.x - eps &&
    a.y + a.size >= b.y - eps &&
    b.y + b.size >= a.y - eps
  );
};

const allConnected = (items: Item[]) => {
  const parent = items.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++)
      if (touchesBox(items[i], items[j])) parent[find(i)] = find(j);
  return items.every((_, i) => find(i) === find(0));
};

export function build(seed: number, opts: Options) {
  const rand = mulberry32(seed);
  const wild = opts.wildness ?? 0;
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // Rotation follows the slider too: near the nine-grid end shapes keep the
  // canonical orientation of the original sheet; wilder turns more of them.
  const rot90 = () => {
    const roll = rand();
    const r = Math.floor(rand() * 4) * 90;
    return roll < 0.1 + wild * 0.9 ? r : 0;
  };

  // Roles. The pentagon can be biased into the tail (it "exceeds the system").
  // Tail length is fixed per seed — if it varied with the slider, a shape
  // would migrate between cluster and tail mid-sweep and the whole base
  // layout would rebuild, breaking the one-form story.
  const tailCount = rand() < 0.5 ? 2 : 1;
  let pool = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  let anchorId: number, tailIds: number[], clusterIds: number[];
  if (opts.pentagonTail) {
    pool = pool.filter((i) => i !== PENTAGON);
    anchorId = pool[0];
    tailIds = tailCount === 1 ? [PENTAGON] : [pool[1], PENTAGON];
    clusterIds = pool.slice(tailCount);
  } else {
    anchorId = pool[0];
    tailIds = pool.slice(1, 1 + tailCount);
    clusterIds = pool.slice(1 + tailCount);
  }

  // --- CLUSTER: grow by edge-adjacency with a centroid bias (dense mass).
  const occ = new Map<string, number | string>();
  const cells: { x: number; y: number; id: number }[] = [];
  const key = (x: number, y: number) => x + "," + y;
  const edgeN = (x: number, y: number): [number, number][] => [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ];
  const place = (x: number, y: number, id: number) => {
    occ.set(key(x, y), id);
    cells.push({ x, y, id });
  };

  place(0, 0, clusterIds[0]);
  for (let k = 1; k < clusterIds.length; k++) {
    const seen = new Set<string>();
    const frontier: [number, number][] = [];
    for (const c of cells) {
      for (const [nx, ny] of edgeN(c.x, c.y)) {
        const kk = key(nx, ny);
        if (!occ.has(kk) && !seen.has(kk)) {
          seen.add(kk);
          frontier.push([nx, ny]);
        }
      }
    }
    const cx = cells.reduce((s, c) => s + c.x, 0) / cells.length;
    const cy = cells.reduce((s, c) => s + c.y, 0) / cells.length;
    frontier.sort(
      (a, b) =>
        (a[0] - cx) ** 2 + (a[1] - cy) ** 2 - ((b[0] - cx) ** 2 + (b[1] - cy) ** 2),
    );
    // A window slides along the centre-sorted frontier: at 0 it sits on the
    // nearest cells (square block), at 1 on the farthest (stringy sprawl).
    const c = Math.min(1, Math.max(0, opts.compactness));
    const windowSize = Math.max(1, Math.round(frontier.length * 0.35));
    const offset = Math.round((frontier.length - windowSize) * c);
    const [fx, fy] = pick(frontier.slice(offset, offset + windowSize));
    place(fx, fy, clusterIds[k]);
  }

  const massCx = cells.reduce((s, c) => s + c.x, 0) / cells.length + 0.5;
  const massCy = cells.reduce((s, c) => s + c.y, 0) / cells.length + 0.5;

  // --- ANCHOR: a free block sharing an edge with the mass. Normally 2x; at
  // high wildness it occasionally doubles again to 4x (the size ladder).
  // For visual range across seeds, pick the attachment side first.
  const blockFree = (bx: number, by: number, span: number) => {
    for (let dx = 0; dx < span; dx++)
      for (let dy = 0; dy < span; dy++) if (occ.has(key(bx + dx, by + dy))) return false;
    return true;
  };
  const blockTouchesMass = (bx: number, by: number, span: number) => {
    for (let dx = 0; dx < span; dx++)
      for (let dy = 0; dy < span; dy++)
        for (const [nx, ny] of edgeN(bx + dx, by + dy))
          if (occ.has(key(nx, ny))) return true;
    return false;
  };
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  const blockCandidates = (span: number) => {
    const out: [number, number][] = [];
    for (let bx = Math.min(...xs) - span; bx <= Math.max(...xs) + span; bx++)
      for (let by = Math.min(...ys) - span; by <= Math.max(...ys) + span; by++)
        if (blockFree(bx, by, span) && blockTouchesMass(bx, by, span)) out.push([bx, by]);
    return out;
  };
  // The anchor is always placed as 2x first, so its position is identical at
  // every slider value — the base form never jumps.
  const spanRoll = rand();
  const growDraw = rand();
  let anchorSpan = 2;
  const candidates = blockCandidates(2);

  const sideOf = ([bx, by]: [number, number]) => {
    const dx = bx + anchorSpan / 2 - massCx;
    const dy = by + anchorSpan / 2 - massCy;
    return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : dy >= 0 ? "below" : "above";
  };
  const sideOrder = shuffle(["right", "below", "above", "left"]);
  let anchorPos: [number, number] | undefined;
  for (const side of sideOrder) {
    const onSide = candidates.filter((c) => sideOf(c) === side);
    if (onSide.length) {
      anchorPos = pick(onSide);
      break;
    }
  }
  anchorPos ??= [Math.max(...xs) + 1, Math.min(...ys)];
  for (let dx = 0; dx < 2; dx++)
    for (let dy = 0; dy < 2; dy++) occ.set(key(anchorPos[0] + dx, anchorPos[1] + dy), "A");

  // Breakout move, past the halfway point only: the anchor doubles again to
  // 4x by GROWING AROUND its own 2x block (never re-placed — no jumps). If no
  // surrounding room exists, it stays 2x.
  if (wild > 0.5 && spanRoll < (wild - 0.5) * 1.2) {
    const grown: [number, number][] = [];
    for (let ox = 0; ox < 3; ox++)
      for (let oy = 0; oy < 3; oy++) {
        const gx = anchorPos[0] - ox;
        const gy = anchorPos[1] - oy;
        let free = true;
        for (let dx = 0; dx < 4 && free; dx++)
          for (let dy = 0; dy < 4 && free; dy++) {
            const v = occ.get(key(gx + dx, gy + dy));
            if (v !== undefined && v !== "A") free = false;
          }
        if (free) grown.push([gx, gy]);
      }
    if (grown.length) {
      anchorPos = grown[Math.floor(growDraw * grown.length)];
      anchorSpan = 4;
      for (let dx = 0; dx < 4; dx++)
        for (let dy = 0; dy < 4; dy++) occ.set(key(anchorPos[0] + dx, anchorPos[1] + dy), "A");
    }
  }
  const anchorItem: Item = { id: anchorId, x: anchorPos[0], y: anchorPos[1], size: anchorSpan, rot: rot90() };

  // --- TAIL: trails diagonally away from the anchor, shrinking, each shape
  // geometrically touching the previous one. Box-corner contact is not
  // enough: most shapes fall short of their box corner (a circle misses it by
  // 0.207 of its size along the diagonal), which is what made earlier tails
  // read as almost-separate. So each shape carries its corner gap (worst
  // corner, measured along the diagonal, as a fraction of size) and the next
  // shape is pulled in by the sum of both gaps — silhouettes touch, not boxes.
  const DIAG_GAP = [0.104, 0, 0, 0.354, 0, 0.5, 0.207, 0.32, 0];
  const massRects: Rect[] = [
    ...cells.map((c) => ({ x: c.x, y: c.y, size: 1 })),
    { x: anchorPos[0], y: anchorPos[1], size: anchorSpan },
  ];
  const outX = anchorPos[0] + anchorSpan / 2 - massCx;
  const outY = anchorPos[1] + anchorSpan / 2 - massCy;
  const dirs: [number, number][] = [
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];
  // Head away from the mass; small jitter for variety among similar dirs.
  const scored = dirs
    .map((d) => ({ d, s: d[0] * outX + d[1] * outY + (rand() - 0.5) * 0.6 }))
    .sort((a, b) => b.s - a.s)
    .map((e) => e.d);

  // Wildness varies how hard the tail shrinks (drawn up front so the same
  // seed keeps the same base layout as the slider moves).
  const tailJitter = [rand(), rand()];
  const tailSizes = [0.62, 0.45].map((s, i) => {
    const shrunk = Math.min(0.95, Math.max(0.25, s * (1 + (tailJitter[i] - 0.5) * 1.0 * wild)));
    // At the nine-grid end the size ladder holds whole: every form 1x and
    // the anchor 2x — the original sheet's grammar, and the look the
    // festival cards wear. The shrink is the slider's to introduce, fading
    // in fully by a third of the way out.
    const hold = Math.max(0, 1 - wild / 0.35);
    return shrunk + (1 - shrunk) * hold;
  });

  const layTail = ([dx, dy]: [number, number], strict: boolean): Item[] | null => {
    const items: Item[] = [];
    let prev: Rect & { id: number } = {
      x: anchorPos![0],
      y: anchorPos![1],
      size: anchorSpan,
      id: anchorId,
    };
    const sizes = tailSizes;
    for (let i = 0; i < tailIds.length; i++) {
      const id = tailIds[i];
      const size = sizes[i];
      const pull = strict
        ? (DIAG_GAP[prev.id] * prev.size + DIAG_GAP[id] * size) / Math.SQRT2
        : 0;
      const x = dx > 0 ? prev.x + prev.size - pull : prev.x - size + pull;
      const y = dy > 0 ? prev.y + prev.size - pull : prev.y - size + pull;
      const rect = { x, y, size };
      // The pull may overlap the previous element's box — that is the point.
      // Everything else must stay clear.
      const samePlace = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.size === b.size;
      const others = [...massRects, ...items].filter((r) => !samePlace(r, prev));
      if (strict && others.some((r) => overlaps(rect, r))) return null;
      items.push({ id, x, y, size, rot: rot90() });
      prev = { ...rect, id };
    }
    return items;
  };
  let tailItems: Item[] | null = null;
  for (const d of scored) {
    tailItems = layTail(d, true);
    if (tailItems) break;
  }
  // Guaranteed fallback: pure corner-to-corner in the most outward direction.
  tailItems ??= layTail(scored[0], false)!;

  const clusterItems: Item[] = cells.map((c) => ({ id: c.id, x: c.x, y: c.y, size: 1, rot: 0 }));
  const items = [...clusterItems, anchorItem, ...tailItems];

  // --- BREAKOUT: one legible axis. Every cluster shape gets its own breakout
  // moment, spread evenly along the slider in a seed-fixed order. Below its
  // moment a shape sits square on the grid, unrotated. Past it, the shape
  // turns to its seed-drawn rotation, may drop to half size (flush against a
  // neighbour), and drifts outward from the mass — the further the slider
  // goes past its moment, the further it drifts. The drift is clamped to the
  // largest step that keeps the one-connected-mass rule intact, so the form
  // loosens but never falls apart. Sweeping the slider therefore reads as the
  // SAME form breaking out of the grid, shape by shape.
  const sharesEdge = (a: Rect, b: Rect) => {
    const eps = 1e-6;
    const overX = Math.min(a.x + a.size, b.x + b.size) - Math.max(a.x, b.x);
    const overY = Math.min(a.y + a.size, b.y + b.size) - Math.max(a.y, b.y);
    return (
      (Math.abs(overX) < eps && overY > eps) || (Math.abs(overY) < eps && overX > eps)
    );
  };
  const nC = clusterItems.length;
  const order = shuffle([...Array(nC).keys()]);
  const plans = clusterItems.map((_, j) => ({
    j,
    activation: (order[j] + 0.5) / (nC + 1),
    // Drift is a WALK of small contact-preserving steps, biased outward. A
    // step that would let go of the mass tries the other axis instead, so a
    // shape can turn corners, crawl along the perimeter, and — using shapes
    // that broke out before it as handholds — chain out beyond the grid.
    axisDraw: rand(),
    signDrawX: rand(),
    signDrawY: rand(),
    dist: 1.0 + rand() * 2.2,
    shrinkRoll: rand(),
    rot: Math.floor(rand() * 4) * 90,
    nbrDraw: rand(),
  }));
  for (const plan of [...plans].sort((a, b) => a.activation - b.activation)) {
    if (wild <= plan.activation) continue;
    const it = clusterItems[plan.j];
    const p = (wild - plan.activation) / (1 - plan.activation);
    it.rot = plan.rot;
    if (plan.shrinkRoll < 0.4) {
      const nbrs = items.filter((o) => o !== it && sharesEdge(it, o));
      if (nbrs.length) {
        const nb = nbrs[Math.floor(plan.nbrDraw * nbrs.length)];
        const old = { x: it.x, y: it.y, size: it.size };
        it.size = 0.5;
        it.x =
          nb.x >= old.x + old.size - 1e-6
            ? old.x + 0.5
            : nb.x + nb.size <= old.x + 1e-6
              ? old.x
              : old.x + 0.25;
        it.y =
          nb.y >= old.y + old.size - 1e-6
            ? old.y + 0.5
            : nb.y + nb.size <= old.y + 1e-6
              ? old.y
              : old.y + 0.25;
        if (!allConnected(items)) Object.assign(it, old);
      }
    }
    // Outward signs from the mass centre; a random tiebreak when centred.
    const mcx = items.reduce((s, o) => s + o.x + o.size / 2, 0) / items.length;
    const mcy = items.reduce((s, o) => s + o.y + o.size / 2, 0) / items.length;
    const ddx = it.x + it.size / 2 - mcx;
    const ddy = it.y + it.size / 2 - mcy;
    const signX = Math.abs(ddx) > 0.05 ? Math.sign(ddx) : plan.signDrawX < 0.5 ? -1 : 1;
    const signY = Math.abs(ddy) > 0.05 ? Math.sign(ddy) : plan.signDrawY < 0.5 ? -1 : 1;
    const primary: "x" | "y" = plan.axisDraw < 0.5 ? "x" : "y";
    const tryStep = (axis: "x" | "y", d: number) => {
      const prev = { x: it.x, y: it.y };
      if (axis === "x") it.x += d;
      else it.y += d;
      if (!items.some((o) => o !== it && overlaps(it, o)) && allConnected(items)) return true;
      Object.assign(it, prev);
      return false;
    };
    let remaining = plan.dist * p;
    const STEP = 0.15;
    while (remaining > 1e-6) {
      const d = Math.min(STEP, remaining);
      const secondary: "x" | "y" = primary === "x" ? "y" : "x";
      const moved =
        tryStep(primary, d * (primary === "x" ? signX : signY)) ||
        tryStep(secondary, d * (secondary === "x" ? signX : signY)) ||
        tryStep(secondary, -d * (secondary === "x" ? signX : signY));
      if (!moved) break;
      remaining -= d;
    }
  }

  // --- Normalise to positive coordinates with a margin.
  const margin = 0.5;
  const minX = Math.min(...items.map((i) => i.x)) - margin;
  const minY = Math.min(...items.map((i) => i.y)) - margin;
  for (const i of items) {
    i.x -= minX;
    i.y -= minY;
  }
  const totalW = (Math.max(...items.map((i) => i.x + i.size)) + margin) * UNIT;
  const totalH = (Math.max(...items.map((i) => i.y + i.size)) + margin) * UNIT;
  return { items, totalW, totalH };
}

// fills: per-item override (solid hex or "g:N"); null/absent falls back to
// the mono colour. A gradient runs across the whole composition as ONE sweep:
// the shapes carrying it are painted as a mask over a single full-canvas
// gradient rect, so the blend flows continuously through them all.
// meta: embedded as <metadata> so an exported file can be uploaded back into
// the tool and edited again.
// bg: a saved background colour — baked into the file as a backing rect,
// except white, which stays transparent paper.
// idPrefix: MUST be unique per SVG that ends up inline in a shared document —
// url(#id) references resolve document-wide, so two inline SVGs with the same
// gradient/mask ids paint each other's masks.
export function svgForItems(
  items: Item[],
  color: string,
  fills?: (Fill | null)[],
  meta?: object,
  bg?: string,
  idPrefix = "fg",
): string {
  const margin = 0.5;
  const minX = Math.min(...items.map((i) => i.x)) - margin;
  const minY = Math.min(...items.map((i) => i.y)) - margin;
  const w = (Math.max(...items.map((i) => i.x + i.size)) - minX + margin) * UNIT;
  const h = (Math.max(...items.map((i) => i.y + i.size)) - minY + margin) * UNIT;
  const shapeTag = (p: Item, fillAttr: string) => {
    const tx = (p.x - minX) * UNIT;
    const ty = (p.y - minY) * UNIT;
    return `<g transform="translate(${tx},${ty}) scale(${p.size}) rotate(${p.rot} ${UNIT / 2} ${UNIT / 2})"><g fill="${fillAttr}">${SHAPES[p.id]}</g></g>`;
  };
  const fillOf = (idx: number): Fill => fills?.[idx] ?? color;
  const gradGroups = new Map<number, number[]>();
  items.forEach((_, idx) => {
    const f = fillOf(idx);
    if (isGradient(f)) {
      const n = gradientIndex(f);
      gradGroups.set(n, [...(gradGroups.get(n) ?? []), idx]);
    }
  });
  let body = "";
  if (bg && bg.toUpperCase() !== "#FFFFFF") body += `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  // Gradient layers first, so solid accents paint on top.
  for (const n of gradGroups.keys()) {
    body += `<rect width="${w}" height="${h}" fill="url(#${idPrefix}${n})" mask="url(#${idPrefix}m${n})"/>`;
  }
  items.forEach((p, idx) => {
    const f = fillOf(idx);
    if (!isGradient(f)) body += shapeTag(p, f);
  });
  const defs = gradGroups.size
    ? `<defs>${[...gradGroups]
        .map(([n, idxs]) => {
          const [a, b] = GRADIENT_PAIRS[n];
          return (
            `<linearGradient id="${idPrefix}${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0.25" stop-color="${PALETTE[a].hex}"/><stop offset="0.75" stop-color="${PALETTE[b].hex}"/></linearGradient>` +
            `<mask id="${idPrefix}m${n}">${idxs.map((i) => shapeTag(items[i], "#fff")).join("")}</mask>`
          );
        })
        .join("")}</defs>`
    : "";
  const metaTag = meta
    ? `<metadata id="fot-form">${JSON.stringify(meta)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")}</metadata>`
    : "";
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${metaTag}${defs}${body}</svg>`;
}

// color may be a solid hex, "g:N" for a whole-form gradient, or "original"
// for every shape's original colour.
export function svgFor(seed: number, color: string, opts: Options): string {
  const { items } = build(seed, opts);
  const original = color === "original";
  const base = original ? PALETTE[5].hex : color;
  const fills = original ? items.map((it) => ORIGINAL_FILLS[it.id]) : undefined;
  return svgForItems(
    items,
    base,
    fills,
    { seed, items, base, original, accent: null },
    undefined,
    `t${seed}g`,
  );
}
