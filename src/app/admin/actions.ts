"use server";

import { revalidatePath } from "next/cache";
import { serverSupabase } from "@/lib/supabase/server";
import { standing } from "@/lib/organiser";
import { publishToThread } from "@/lib/festivals";

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
  if (error) {
    revalidatePath("/admin");
    return { error: error.message };
  }


  revalidatePath("/admin");
  return {};
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
  if (error) {
    revalidatePath("/admin");
    return { error: error.message };
  }

  // Going live is also when the festival gets a public page — created in draft
  // in The Thread, so approving means "this may exist publicly", not "the doors
  // are open". Somebody still decides when registration starts.
  if (decision === "live") {
    const { data: row } = await supabase
      .from("festival")
      .select(
        "id, marker, name, status, summary, place, starts_on, cover_url, fibre_run_id, host_org_id, thread_id, thread_slug, owner_id, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (row) {
      const published = await publishToThread(row as Parameters<typeof publishToThread>[0]);
      if ("error" in published) {
        // The festival is live either way; the page can be retried. Better than
        // refusing an approval because a second system was briefly unhappy.
        console.error("[admin] publish to The Thread failed", published.error);
      }
    }
  }

  revalidatePath("/admin");
  return {};
}
