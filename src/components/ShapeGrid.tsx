/**
 * The Festival of Trust shape mark: a 3x3 grid of geometric primitives.
 * Recreated from the brand artwork — swap in the official SVG when available.
 */
export function ShapeGrid({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 300"
      className={className}
      role="img"
      aria-label="Festival of Trust shape mark"
    >
      {/* row 1, col 1 — four pink circles */}
      <g fill="var(--c-pink)">
        <circle cx="25" cy="25" r="25" />
        <circle cx="75" cy="25" r="25" />
        <circle cx="25" cy="75" r="25" />
        <circle cx="75" cy="75" r="25" />
      </g>

      {/* row 1, col 2 — teal quarter discs + semicircle */}
      <g fill="var(--c-teal)">
        <path d="M100 0 h50 a50 50 0 0 1 -50 50 z" />
        <path d="M100 50 a50 50 0 0 1 50 50 h-50 z" />
        <path d="M200 0 a50 50 0 0 0 0 100 z" fill="var(--c-teal-2)" />
      </g>

      {/* row 1, col 3 — two yellow semicircles */}
      <g fill="var(--c-yellow)">
        <path d="M200 0 h100 a50 50 0 0 1 -100 0 z" />
        <path d="M200 100 a50 50 0 0 1 100 0 z" />
      </g>

      {/* row 2, col 1 — yellow bowtie */}
      <g fill="var(--c-yellow)">
        <path d="M0 100 h100 l-50 50 z" />
        <path d="M0 200 h100 l-50 -50 z" />
      </g>

      {/* row 2, col 2 — green four-pointed star */}
      <path
        fill="var(--c-green)"
        d="M150 100 a50 50 0 0 0 50 50 a50 50 0 0 0 -50 50 a50 50 0 0 0 -50 -50 a50 50 0 0 0 50 -50 z"
      />

      {/* row 2, col 3 — purple diamond */}
      <path fill="var(--c-purple)" d="M250 100 L300 150 L250 200 L200 150 z" />

      {/* row 3, col 1 — indigo square */}
      <rect x="0" y="200" width="100" height="100" fill="var(--c-indigo)" />

      {/* row 3, col 2 — red circle */}
      <circle cx="150" cy="250" r="50" fill="var(--c-red)" />

      {/* row 3, col 3 — pink pentagon */}
      <path
        fill="var(--c-pink)"
        d="M250 200 L299 236 L280 294 L220 294 L201 236 z"
      />
    </svg>
  );
}
