"use server";

import { revalidatePath } from "next/cache";
import { serverSupabase } from "@/lib/supabase/server";
import { standing } from "@/lib/organiser";

/**
 * Review actions.
 *
 * Each re-checks that the caller is an admin. The database enforces this too —
 * these tables are behind is_admin() — but a server action is a public endpoint
 * and should not rely on the page that renders it having checked.
 */
async function requireAdmin() {
  const s = await standing();
  return s.state === "approved" && s.organiser.is_admin;
}

export async function decideOrganiser(
  id: string,
  decision: "approved" | "declined",
  note?: string,
) {
  if (!(await requireAdmin())) return { error: "not an admin" };
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("organiser")
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.user?.id,
      review_note: note || null,
    })
    .eq("id", id);
  revalidatePath("/admin");
  return error ? { error: error.message } : {};
}

export async function decideFestival(id: string, decision: "live" | "draft") {
  if (!(await requireAdmin())) return { error: "not an admin" };
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("festival")
    .update(
      decision === "live"
        ? {
            status: "live",
            approved_at: new Date().toISOString(),
            approved_by: auth.user?.id,
          }
        : { status: "draft", submitted_at: null },
    )
    .eq("id", id);
  revalidatePath("/admin");
  return error ? { error: error.message } : {};
}
