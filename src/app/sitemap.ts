import type { MetadataRoute } from "next";
import { PUBLIC_PATHS } from "@/components/nav-links";
import { serverSupabase } from "@/lib/supabase/server";

const BASE = "https://www.festivaloftrust.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = PUBLIC_PATHS.map((path) => ({
    url: path === "/" ? BASE : `${BASE}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  // Live, publicly listed festivals: each is a page worth finding. Never
  // fatal — a sitemap with only the fixed pages beats a 500.
  let events: MetadataRoute.Sitemap = [];
  try {
    const supabase = await serverSupabase();
    const { data } = await supabase
      .from("festival")
      .select("marker, updated_at")
      .eq("status", "live")
      .eq("is_public_listed", true);
    events = ((data ?? []) as { marker: string; updated_at: string }[]).map(
      (f) => ({
        url: `${BASE}/${f.marker}`,
        lastModified: f.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );
  } catch {}

  return [...fixed, ...events];
}
