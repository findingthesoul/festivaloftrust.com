import Image from "next/image";
import wordmark from "@/assets/festival-of-trust.png";

// The nine forms in the grid's own order — the same order the home page's
// flying lockup settles into.
const GRID = [
  "forms-01",
  "forms-02",
  "forms-03",
  "forms-05",
  "forms-06",
  "forms-04",
  "forms-09",
  "forms-07",
  "forms-08",
];

/**
 * The compact logo: the nine forms as one solid block beside the name. All
 * white, because it lives on photographs. The parent sets the height; block
 * and wordmark both fill it.
 */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <div data-lockup-grid className="grid aspect-square h-full shrink-0 grid-cols-3">
        {GRID.map((file) => (
          <div
            key={file}
            className="bg-white"
            style={{
              maskImage: `url(/brand/shapes/${file}.svg)`,
              maskSize: "100% 100%",
              WebkitMaskImage: `url(/brand/shapes/${file}.svg)`,
              WebkitMaskSize: "100% 100%",
            }}
          />
        ))}
      </div>
      <Image
        src={wordmark}
        alt="Festival of Trust"
        loading="eager"
        className="h-full w-auto"
        style={{ filter: "brightness(0) invert(1)" }}
      />
    </div>
  );
}
