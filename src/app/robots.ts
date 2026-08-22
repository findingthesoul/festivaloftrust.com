import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Working tool rather than public-facing content.
      disallow: "/planner",
    },
    sitemap: "https://www.festivaloftrust.com/sitemap.xml",
  };
}
