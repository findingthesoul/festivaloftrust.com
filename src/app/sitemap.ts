import type { MetadataRoute } from "next";
import { PUBLIC_PATHS } from "@/components/nav-links";

const BASE = "https://www.festivaloftrust.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? BASE : `${BASE}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
}
