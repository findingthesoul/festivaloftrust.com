import { serverSupabase } from "@/lib/supabase/server";
import type { Item } from "@/app/gen/core";
import type { LogoForm } from "@/lib/logos";

/**
 * Photos, and where they hang. Every festival keeps a list; the workspace
 * keeps a library of its own (rows with no festival). A photo's `page` says
 * which public page it dresses: the home page rotates through everything
 * placed on 'home', and the story pages wear the newest photo placed on
 * theirs.
 */

export type PhotoPage = "home" | "society" | "organisations" | "about";

export type PhotoRow = {
  id: string;
  url: string;
  credit: string | null;
  page: PhotoPage | null;
  festival_id: string | null;
  /** Where the faces are, as fractions of the image — null is unknown. */
  focus_x: number | null;
  focus_y: number | null;
};

export async function photosFor(festivalId: string): Promise<PhotoRow[]> {
  const supabase = await serverSupabase();
  const { data, error } = await supabase
    .from("photo")
    .select("id, url, credit, page, festival_id, focus_x, focus_y")
    .eq("festival_id", festivalId)
    .order("created_at");
  if (error) throw new Error(`photos: ${error.message}`);
  return (data ?? []) as PhotoRow[];
}

/** Every photo there is — the desk's view. */
export async function allPhotos(): Promise<PhotoRow[]> {
  const supabase = await serverSupabase();
  const { data, error } = await supabase
    .from("photo")
    .select("id, url, credit, page, festival_id, focus_x, focus_y")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`photos: ${error.message}`);
  return (data ?? []) as PhotoRow[];
}

/** The newest photo placed on a story page, or null to keep the built-in. */
export async function pagePhoto(page: PhotoPage): Promise<string | null> {
  const supabase = await serverSupabase();
  const { data } = await supabase
    .from("photo")
    .select("url")
    .eq("page", page)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { url: string } | null)?.url ?? null;
}

export type HomeSlide = {
  url: string;
  credit: string;
  logo: Item[] | null;
  /** The photo's focal point (faces), for the shapes to stay away from. */
  focus: { x: number; y: number } | null;
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Runs signed out, so it only leans on what the world may read: photos,
 * logos, and live festivals. A festival the public cannot see simply
 * contributes no place or date to its credit line; a library photo carries
 * only its own credit.
 */
export async function homeSlides(): Promise<HomeSlide[]> {
  const supabase = await serverSupabase();
  const { data: photos } = await supabase
    .from("photo")
    .select("url, credit, festival_id, focus_x, focus_y")
    .eq("page", "home")
    .order("created_at");
  const rows = (photos ?? []) as {
    url: string;
    credit: string | null;
    festival_id: string | null;
    focus_x: number | null;
    focus_y: number | null;
  }[];
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((p) => p.festival_id).filter(Boolean))] as string[];
  const [{ data: fests }, { data: logos }] = ids.length
    ? await Promise.all([
        supabase.from("festival").select("id, name, place, starts_on").in("id", ids),
        supabase.from("logo").select("form, claimed_by").in("claimed_by", ids),
      ])
    : [{ data: [] }, { data: [] }];
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

  const slides = rows.map((p) => {
    const f = p.festival_id ? festOf.get(p.festival_id) : undefined;
    const when = f?.starts_on ? dateFormat.format(new Date(f.starts_on)) : null;
    const where = [f?.place, when].filter(Boolean).join(" ");
    const by = p.credit?.trim();
    const credit = [where || f?.name, by ? `organised by ${by}` : null]
      .filter(Boolean)
      .join(", ");
    return {
      url: p.url,
      credit: credit || by || "Festival of Trust",
      logo: p.festival_id ? (logoOf.get(p.festival_id)?.items ?? null) : null,
      focus:
        p.focus_x != null && p.focus_y != null
          ? { x: Number(p.focus_x), y: Number(p.focus_y) }
          : null,
    };
  });
  // The ring opens at a random photo each request — order kept, door moved.
  const start = Math.floor(Math.random() * slides.length);
  return [...slides.slice(start), ...slides.slice(0, start)];
}
