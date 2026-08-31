"use server";

import { revalidatePath } from "next/cache";
import { serverSupabase } from "@/lib/supabase/server";
import { standing } from "@/lib/organiser";
import { publishToThread, unpublishFromThread } from "@/lib/festivals";

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

  const { data: row } = await supabase
    .from("festival")
    .select(
      "id, marker, name, status, summary, place, starts_on, cover_url, fibre_run_id, host_org_id, thread_id, thread_slug, owner_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  // Both directions touch The Thread, and both report failure rather than
  // logging it. An admin who presses "Take offline" and is told nothing will
  // reasonably believe the public page is gone; if the patch failed, it isn't.
  let threadError: string | undefined;
  if (row) {
    const festival = row as Parameters<typeof publishToThread>[0];
    // Going live is also when the festival gets a public page — created in
    // draft in The Thread, so approving means "this may exist publicly", not
    // "the doors are open". Somebody still decides when registration starts.
    const result =
      decision === "live"
        ? await publishToThread(festival)
        : await unpublishFromThread(festival);
    if ("error" in result) threadError = result.error;
  }

  revalidatePath("/admin");
  revalidatePath("/upcoming");
  revalidatePath(`/festival/${(row as { marker?: string } | null)?.marker ?? ""}`);
  // The status change stuck either way — the festival is live, or it is not.
  // Only the public page is in doubt, so say which half went wrong.
  return threadError ? { error: `saved, but The Thread said: ${threadError}` } : {};
}

/**
 * Take a photo out of the home page rotation. The offer stays with the
 * festival — its organiser can offer it again — but the workspace decides
 * what the front door wears.
 */
export async function removeFromHome(photoId: string) {
  if (!(await requireAdmin())) return { error: "not an admin" };
  const supabase = await serverSupabase();
  const { error } = await supabase
    .from("photo")
    .update({ page: null })
    .eq("id", photoId);
  revalidatePath("/admin");
  revalidatePath("/");
  return error ? { error: error.message } : {};
}
