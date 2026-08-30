/**
 * The identity composition the home page flies, derived verbatim from the
 * designer's cluster SVG (fot-cluster-72, "amazingness" collection): every
 * seat is that file's fot-form metadata converted to fractions of the
 * composition box, wordmark seated beneath. One entry per form in grid order
 * — the order they take in the docked 3×3.
 */
export const POSTER_FORMS: {
  file: string;
  x: number;
  y: number;
  w: number;
  rot?: number;
  accent?: boolean;
}[] = [
  { file: "forms-01", x: 0.1172, y: 0.0785, w: 0.1353 },
  { file: "forms-02", x: 0.3877, y: 0.2355, w: 0.1353 },
  { file: "forms-03", x: 0.2525, y: 0.0785, w: 0.1353 },
  { file: "forms-05", x: 0.7935, y: 0.146, w: 0.0839 },
  { file: "forms-06", x: 0.523, y: 0.0785, w: 0.2705, accent: true },
  { file: "forms-04", x: 0.2525, y: 0.2355, w: 0.1353 },
  { file: "forms-09", x: 0.1849, y: 0.303, w: 0.0676 },
  { file: "forms-07", x: 0.0676, y: 0.3562, w: 0.1353 },
  { file: "forms-08", x: 0.8715, y: 0.083, w: 0.0609, rot: 270 },
];

/** The wordmark's place inside the same composition box. */
export const POSTER_MARK = { x: 0.0676, y: 0.6193, w: 0.656 };

/** The composition box's own proportions: the cluster plus the wordmark. */
export const POSTER_RATIO = "1676.75 / 1444.9";
