import Image from "next/image";
import shapes from "@/assets/shapes.png";

/**
 * The Festival of Trust shape mark — the official artwork from
 * branding/website/, not a reproduction.
 */
export function ShapeGrid({
  className,
  loading,
}: {
  className?: string;
  // Whether to load eagerly is the page's call, not the mark's: where it
  // falls relative to the fold differs per page.
  loading?: "eager" | "lazy";
}) {
  return (
    <Image
      src={shapes}
      alt=""
      aria-hidden="true"
      className={className}
      sizes="(max-width: 640px) 45vw, 20vw"
      loading={loading}
    />
  );
}
