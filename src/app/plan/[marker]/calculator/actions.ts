"use server";

import { serverSupabase } from "@/lib/supabase/server";
import { accessTo, festivalByMarker } from "@/lib/festivals";

/**
 * Reading and writing the tenth area.
 *
 * `data` is the calculator's own snapshot, stored whole and never interpreted
 * here. The tool owns its format — that is what makes a new export a drop-in
 * replacement rather than a migration.
 *
 * Both actions re-check access. RLS enforces it too, but a server action is a
 * public endpoint and must not rely on the page that rendered it having asked.
 */
async function moneyAccessTo(marker: string) {
  const festival = await festivalByMarker(marker);
  if (!festival) return null;
  const access = await accessTo(festival);
  return access?.canSeeMoney ? festival : null;
}

export async function loadCalculator(marker: string): Promise<unknown | null> {
  const festival = await moneyAccessTo(marker);
  if (!festival) return null;

  const supabase = await serverSupabase();
  const { data } = await supabase
    .from("festival_calculator")
    .select("data")
    .eq("festival_id", festival.id)
    .maybeSingle();
  return (data as { data: unknown } | null)?.data ?? null;
}

export async function saveCalculator(
  marker: string,
  data: unknown,
): Promise<{ error?: string }> {
  const festival = await moneyAccessTo(marker);
  if (!festival) return { error: "not yours" };

  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("festival_calculator")
    .upsert(
      { festival_id: festival.id, data, updated_by: auth.user?.id },
      { onConflict: "festival_id" },
    );
  return error ? { error: error.message } : {};
}
