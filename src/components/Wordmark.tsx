/**
 * "festival of / trust" wordmark, type-set in a Helvetica-style grotesque.
 * The official artwork is an outlined logo; when the SVG lands, replace the
 * innards of this component and every usage updates.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`block font-bold leading-[0.86] tracking-[-0.035em] ${className ?? ""}`}>
      <span className="block text-[0.42em]">festival of</span>
      <span className="block">trust</span>
      <span className="sr-only">Festival of Trust</span>
    </span>
  );
}
