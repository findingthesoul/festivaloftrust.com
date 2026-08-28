"use server";

import { revalidatePath } from "next/cache";
import { serverSupabase } from "@/lib/supabase/server";
import { accessTo, festivalByMarker, submitForReview, unpublishFromThread } from "@/lib/festivals";

async function organiserOf(marker: string) {
  const festival = await festivalByMarker(marker);
  if (!festival) return null;
  const access = await accessTo(festival);
  return access?.role === "organiser" ? festival : null;
}

export async function askToPublish(marker: string): Promise<{ error?: string }> {
  const festival = await organiserOf(marker);
  if (!festival) return { error: "not yours to publish" };
  const result = await submitForReview(festival.id);
  revalidatePath(`/plan/${marker}/publish`);
  return result;
}

/**
 * Take a published festival back down.
 *
 * An organiser may do this, unlike putting it live: the status trigger only
 * refuses the move *to* live. Withdrawing what you published is yours.
 *
 * The Thread page goes back to draft and unlisted rather than being deleted —
 * it holds the registrations, and the link stays valid for when it returns.
 */
export async function unpublish(marker: string): Promise<{ error?: string }> {
  const festival = await organiserOf(marker);
  if (!festival) return { error: "not yours to unpublish" };

  const supabase = await serverSupabase();
  const { error } = await supabase
    .from("festival")
    .update({ status: "draft", submitted_at: null })
    .eq("id", festival.id);
  if (error) return { error: error.message };

  const off = await unpublishFromThread(festival);

  revalidatePath(`/plan/${marker}/publish`);
  revalidatePath(`/${marker}`);
  revalidatePath("/upcoming");
  // The festival is down either way; only the public page is in doubt.
  return "error" in off ? { error: `taken offline, but The Thread said: ${off.error}` } : {};
}
