/**
 * Placeholder step marks.
 *
 * The spec (§7) has the nine marks coming from the designer, built by cutting
 * and rotating circle / triangle / square, with a pentagon reserved for Grow.
 * Until those SVGs arrive these stand in: same primitives, same pentagon
 * exception, phase colour rather than per-step colour. Swappable one for one.
 */
export function StepMark({
  step,
  color,
  className,
}: {
  step: number;
  color: string;
  className?: string;
}) {
  // Position within the phase picks the primitive; Grow keeps the pentagon.
  const withinPhase = (step - 1) % 3;
  const shape =
    step === 9 ? "pentagon" : (["circle", "triangle", "square"] as const)[withinPhase];

  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      {shape === "circle" && <circle cx="20" cy="20" r="20" fill={color} />}
      {shape === "triangle" && <path d="M20 0 40 40 0 40z" fill={color} />}
      {shape === "square" && <rect width="40" height="40" fill={color} />}
      {shape === "pentagon" && (
        <path d="M20 0 40 14.5 32.4 38 7.6 38 0 14.5z" fill={color} />
      )}
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#feecd2"
        fontSize="17"
        fontWeight="700"
      >
        {step}
      </text>
    </svg>
  );
}
