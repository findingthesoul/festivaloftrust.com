import Image from "next/image";
import wordmark from "@/assets/festival-of-trust.png";

/**
 * Festival of Trust wordmark — the official artwork from branding/website/,
 * not a reproduction. Set in Helvetica Neue (Bold over Black).
 */
export function Wordmark({
  className,
  loading,
}: {
  className?: string;
  // Whether to load eagerly is the page's call, not the wordmark's: it sits
  // above the fold on some pages and halfway down on others.
  loading?: "eager" | "lazy";
}) {
  return (
    <Image
      src={wordmark}
      alt="Festival of Trust"
      className={className}
      sizes="(max-width: 640px) 80vw, 45vw"
      loading={loading}
    />
  );
}
