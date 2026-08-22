import Image from "next/image";
import shapes from "@/assets/shapes.png";

/**
 * The Festival of Trust shape mark — the official artwork from
 * branding/website/, not a reproduction.
 */
export function ShapeGrid({ className }: { className?: string }) {
  return (
    <Image
      src={shapes}
      alt=""
      aria-hidden="true"
      className={className}
      sizes="(max-width: 640px) 45vw, 20vw"
      priority
    />
  );
}
