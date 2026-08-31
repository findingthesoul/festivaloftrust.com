import { serverSupabase } from "@/lib/supabase/server";
import type { Item } from "@/app/gen/core";
import type { LogoForm } from "@/lib/logos";

/**
 * The festival photo lists, and the home page's rotation built from them:
 * every photo tagged home, with a credit line and — when the festival has
 * claimed one — its logo composition, so the hero's forms can re-seat
 * themselves per photo.
 */

export type PhotoRow = {
  id: string;
  url: string;
  credit: string | null;
  home: boolean;
};

export async function photosFor(festivalId: string): Promise<PhotoRow[]> {
  const supabase = await serverSupabase();
  const { data, error } = await supabase
    .from("photo")
    .select("id, url, credit, home")
    .eq("festival_id", festivalId)
    .order("created_at");
  if (error) throw new Error(`photos: ${error.message}`);
  return (data ?? []) as PhotoRow[];
}

export type HomeSlide = {
  url: string;
  credit: string;
  logo: Item[] | null;
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Runs signed out, so it only leans on what the world may read: photos,
 * logos, and live festivals. A festival the public cannot see simply
 * contributes no place or date to its credit line.
 */
export async function homeSlides(): Promise<HomeSlide[]> {
  const supabase = await serverSupabase();
  const { data: photos } = await supabase
    .from("photo")
    .select("url, credit, festival_id")
    .eq("home", true)
    .order("created_at");
  const rows = (photos ?? []) as {
    url: string;
    credit: string | null;
    festival_id: string;
  }[];
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((p) => p.festival_id))];
  const [{ data: fests }, { data: logos }] = await Promise.all([
    supabase
      .from("festival")
      .select("id, name, place, starts_on")
      .in("id", ids),
    supabase.from("logo").select("form, claimed_by").in("claimed_by", ids),
  ]);
  const festOf = new Map(
    ((fests ?? []) as {
      id: string;
      name: string;
      place: string | null;
      starts_on: string | null;
    }[]).map((f) => [f.id, f]),
  );
  const logoOf = new Map(
    ((logos ?? []) as { form: LogoForm; claimed_by: string | null }[])
      .filter((l) => l.claimed_by)
      .map((l) => [l.claimed_by as string, l.form]),
  );

  return rows.map((p) => {
    const f = festOf.get(p.festival_id);
    const when = f?.starts_on ? dateFormat.format(new Date(f.starts_on)) : null;
    const where = [f?.place, when].filter(Boolean).join(" ");
    const by = p.credit?.trim();
    const credit = [where || f?.name, by ? `organised by ${by}` : null]
      .filter(Boolean)
      .join(", ");
    return {
      url: p.url,
      credit: credit || "Festival of Trust",
      logo: logoOf.get(p.festival_id)?.items ?? null,
    };
  });
}
