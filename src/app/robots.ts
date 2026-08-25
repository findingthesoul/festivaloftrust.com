import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Deliberately no Disallow for /plan or /planner. Both carry a noindex
      // meta tag, and a crawler has to fetch a page to see one — blocking them
      // here would mean the noindex is never read, while the URL itself can
      // still be listed from a link elsewhere. Crawled-and-excluded beats
      // uncrawled-and-guessable, especially for the rate card.
    },
    sitemap: "https://www.festivaloftrust.com/sitemap.xml",
  };
}
