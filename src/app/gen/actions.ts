"use server";

import { serverSupabase } from "@/lib/supabase/server";
import type { LogoForm } from "@/lib/logos";

/**
 * The Festival logos collection lives in the database, not the browser —
 * the pool is shared, so an organiser somewhere else can claim from it.
 * Row-level security does the guarding: only the admin writes, only
 * unclaimed logos can be deleted, and reads are open.
 */

export type LogoRow = {
  id: string;
  form: LogoForm;
  /** The name of the festival wearing it, when claimed. */
  claimedBy: string | null;
};

export async function listLogos(): Promise<{ logos: LogoRow[]; error?: string }> {
  const supabase = await serverSupabase();
  const { data, error } = await supabase
    .from("logo")
    .select("id, form, claimed_by, festival:claimed_by(name)")
    .order("created_at");
  if (error) return { logos: [], error: error.message };
  return {
    logos: (data ?? []).map((row) => {
      const festival = row.festival as { name?: string } | { name?: string }[] | null;
      const one = Array.isArray(festival) ? festival[0] : festival;
      return {
        id: row.id as string,
        form: row.form as LogoForm,
        claimedBy: row.claimed_by ? (one?.name ?? "a festival") : null,
      };
    }),
  };
}

export async function addLogo(form: LogoForm): Promise<{ error?: string }> {
  const supabase = await serverSupabase();
  const { error } = await supabase.from("logo").insert({ form });
  if (error) {
    return {
      error:
        error.code === "42501"
          ? "Only the workspace admin can add to Festival logos."
          : error.message,
    };
  }
  return {};
}

export async function removeLogo(id: string): Promise<{ error?: string }> {
  const supabase = await serverSupabase();
  const { error, count } = await supabase
    .from("logo")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) return { error: error.message };
  if (!count) {
    return {
      error:
        "Nothing was deleted — a claimed logo stays with its festival, and only the admin removes logos.",
    };
  }
  return {};
}
