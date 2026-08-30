/**
 * The identity composition, shared by everything that draws it: the home
 * page's flying lockup and the card backgrounds that echo it. One entry per
 * form in grid order (the order they take in the docked 3×3). x/y/w are
 * fractions of the composition box, taken from the identity artwork: forms
 * live on an 80-grid, only double or halve in size, and each leans on at
 * least one other form — keep that grammar when tuning numbers here.
 */
export const POSTER_FORMS: {
  file: string;
  x: number;
  y: number;
  w: number;
  /** Clean quarter turns only, drawn on an inner layer. */
  rot?: number;
  accent?: boolean;
}[] = [
  { file: "forms-01", x: 0.07, y: 0.228, w: 0.18 },
  { file: "forms-02", x: 0.25, y: 0.084, w: 0.25 },
  { file: "forms-03", x: 0.5, y: 0.193, w: 0.126 },
  { file: "forms-05", x: 0.244, y: 0.333, w: 0.089 },
  { file: "forms-06", x: 0.333, y: 0.299, w: 0.333, accent: true },
  { file: "forms-04", x: 0.667, y: 0.368, w: 0.083 },
  { file: "forms-09", x: 0.202, y: 0.404, w: 0.132 },
  { file: "forms-07", x: 0.626, y: 0.299, w: 0.084 },
  { file: "forms-08", x: 0.709, y: 0.439, w: 0.043 },
];

/** The wordmark's place inside the same composition box. */
export const POSTER_MARK = { x: 0.093, y: 0.602, w: 0.682 };

/** The composition box's own proportions, from the identity artwork. */
export const POSTER_RATIO = "1290 / 1536";
