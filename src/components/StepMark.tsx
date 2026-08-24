import { STEP_COLOR_ALT, STEP_COLORS } from "@/lib/festival-plan";

/**
 * The nine step marks.
 *
 * These are the nine forms of the poster grid, one per step. The grid is
 * "derived from the nine steps — nine cells, three rows of three, one row per
 * phase" (Developer Briefing §5), so cell position is step number: cell 9 is
 * the pentagon, and the pentagon marks Grow.
 *
 * Built from the three primitives — circle, triangle, square — by cutting,
 * rotating and combining. The pentagon on Grow is the one documented
 * exception, "the step where the language exceeds itself". Do not normalise it.
 *
 * Each form keeps its own colour from the poster rather than taking its phase
 * colour, so a mark here is the same mark as on the artwork. Phase still reads,
 * from the label and the progress gradient.
 */

/** Geometry per step, on a 100x100 cell. */
function form(step: number, fill: string, alt: string | undefined) {
  switch (step) {
    case 1: // Listen — four circles: separate pockets, not yet joined.
      return (
        <g fill={fill}>
          <circle cx="25" cy="25" r="25" />
          <circle cx="75" cy="25" r="25" />
          <circle cx="25" cy="75" r="25" />
          <circle cx="75" cy="75" r="25" />
        </g>
      );
    case 2: // Gather — quarter discs closing toward a half: forming a group.
      return (
        <>
          <g fill={fill}>
            <path d="M0 0h50a50 50 0 0 1-50 50z" />
            <path d="M0 50a50 50 0 0 1 50 50H0z" />
          </g>
          <path d="M100 0a50 50 0 0 0 0 100z" fill={alt ?? fill} />
        </>
      );
    case 3: // Align — two half discs meeting on one axis.
      return (
        <g fill={fill}>
          <path d="M0 0h100a50 50 0 0 1-100 0z" />
          <path d="M0 100a50 50 0 0 1 100 0z" />
        </g>
      );
    case 4: // Connect — two triangles meeting at a point.
      return (
        <g fill={fill}>
          <path d="M0 0h100l-50 50z" />
          <path d="M0 100h100l-50-50z" />
        </g>
      );
    case 5: // Design — the centre star, cut from four arcs.
      return (
        <path
          fill={fill}
          d="M50 0a50 50 0 0 0 50 50 50 50 0 0 0-50 50 50 50 0 0 0-50-50 50 50 0 0 0 50-50z"
        />
      );
    case 6: // Invite — the square turned, opening outward.
      return <path fill={fill} d="M50 0 100 50 50 100 0 50z" />;
    case 7: // Host — the square at rest: the day itself, held.
      return <rect width="100" height="100" fill={fill} />;
    case 8: // Harvest — the whole circle.
      return <circle cx="50" cy="50" r="50" fill={fill} />;
    case 9: // Grow — the pentagon. Outside the three primitives, by design.
      return <path fill={fill} d="M50 0 100 36 81 94 19 94 0 36z" />;
    default:
      return null;
  }
}

export function StepMark({ step, className }: { step: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {form(step, STEP_COLORS[step], STEP_COLOR_ALT[step])}
    </svg>
  );
}
