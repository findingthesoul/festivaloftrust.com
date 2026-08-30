import {
  ORIGINAL_FILLS,
  svgFor,
  svgForItems,
  type Fill,
  type Item,
} from "@/app/gen/core";
import { serverSupabase } from "@/lib/supabase/server";

/**
 * Festival logos: compositions from the shape generator, kept in the
 * database as the one shared collection. A festival claims one; everything
 * that shows a festival without a cover photo draws it — and until one is
 * chosen, the festival's marker seeds a composition of its own, so no two
 * festivals ever wear the same face.
 */

/** The generator's saved form state, verbatim (see src/app/gen/editor.tsx). */
export type LogoForm = {
  seed: number;
  items: Item[];
  base: Fill;
  original: boolean;
  accent: { i: number; fill: Fill } | null;
  bg: string;
};

export type Logo = { id: string; form: LogoForm; claimed_by: string | null };

/** Render a stored form. idPrefix must be unique among inline SVGs on a page. */
export function logoSvg(form: LogoForm, idPrefix: string): string {
  const fills = form.items.map((it, i) =>
    form.original
      ? ORIGINAL_FILLS[it.id]
      : form.accent?.i === i
        ? form.accent.fill
        : null,
  );
  return svgForItems(form.items, form.base, fills, undefined, form.bg, idPrefix);
}

/**
 * The stand-in before a logo is chosen: a composition grown by the
 * generator's own grammar, seeded by the festival's address, in the original
 * drawing's colours. Deterministic — the same festival always gets the same
 * form.
 */
export function fallbackLogoSvg(marker: string): string {
  let h = 0;
  for (const c of marker) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const seed = (h % 99991) + 1;
  return svgFor(seed, "original", {
    compactness: 0.2,
    wildness: 0.25,
    pentagonTail: false,
  });
}

export async function allLogos(): Promise<Logo[]> {
  const supabase = await serverSupabase();
  const { data, error } = await supabase
    .from("logo")
    .select("id, form, claimed_by")
    .order("created_at");
  if (error) throw new Error(`logos: ${error.message}`);
  return (data ?? []) as Logo[];
}

export async function logoForFestival(festivalId: string): Promise<Logo | null> {
  const supabase = await serverSupabase();
  const { data, error } = await supabase
    .from("logo")
    .select("id, form, claimed_by")
    .eq("claimed_by", festivalId)
    .maybeSingle();
  if (error) throw new Error(`logo: ${error.message}`);
  return (data as Logo | null) ?? null;
}
