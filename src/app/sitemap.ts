import type { MetadataRoute } from "next";
import { NAV } from "@/components/SiteNav";

const BASE = "https://www.festivaloftrust.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return NAV.map((item) => ({
    url: item.href === "/" ? BASE : `${BASE}${item.href}`,
    changeFrequency: "monthly" as const,
    priority: item.href === "/" ? 1 : 0.7,
  }));
}
