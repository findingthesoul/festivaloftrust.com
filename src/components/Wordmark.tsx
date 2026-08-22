import Image from "next/image";
import wordmark from "@/assets/festival-of-trust.png";

/**
 * Festival of Trust wordmark — the official artwork from branding/website/,
 * not a reproduction. Set in Helvetica Neue (Bold over Black).
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Image
      src={wordmark}
      alt="Festival of Trust"
      className={className}
      sizes="(max-width: 640px) 80vw, 45vw"
      priority
    />
  );
}
