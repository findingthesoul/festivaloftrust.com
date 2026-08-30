"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidMarker, slugify, suggestMarkers } from "@/lib/marker";
import { serverSupabase } from "@/lib/supabase/server";
import {
  festivalByMarker,
  accessTo,
  invite,
  removeMember,
  changeMarker,
  saveEventSettings,
  takenMarkers,
  submitForReview,
  withdrawInvite,
  addAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
} from "@/lib/festivals";

/**
 * Every action re-checks the caller's role.
 *
 * The database enforces it too, but a server action is a public endpoint: it
 * must not assume the page that rendered the button did the checking.
 */
async function organiserOf(marker: string) {
  const festival = await festivalByMarker(marker);
  if (!festival) return null;
  const access = await accessTo(festival);
  return access?.role === "organiser" ? festival : null;
}

export type InviteState = { status: "idle" | "error"; message?: string };

export async function inviteCollaborator(
  marker: string,
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const festival = await organiserOf(marker);
  if (!festival) return { status: "error", message: "Only an organiser can invite." };

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "host") as "organiser" | "host";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: "error", message: "That does not look like an email address." };
  }

  const r = await invite(festival.id, email, role);
  if (r.error) return { status: "error", message: r.error };

  // The invitation is an email address until that address signs in, so the
  // invitation *is* a sign-in link. Sent through Supabase, which already sends
  // through Resend — rather than a second sender with its own key and its own
  // deliverability to earn.
  //
  // The link lands them on the festival they were invited to; signing in is
  // what turns the invitation into a membership.
  const supabase = await serverSupabase();
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.festivaloftrust.com";
  const { error: mailError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${site}/auth/callback?next=/plan/${marker}`,
      shouldCreateUser: true,
    },
  });

  revalidatePath(`/plan/${marker}/settings`);
  if (mailError) {
    // They are still invited — the row exists and will be claimed whenever
    // they sign in. Only the nudge failed, and saying so beats silence.
    return {
      status: "error",
      message: `Invited, but the email could not be sent (${mailError.message}). They can still sign in themselves.`,
    };
  }
  return { status: "idle" };
}

export async function cancelInvite(marker: string, id: string) {
  if (!(await organiserOf(marker))) return;
  await withdrawInvite(id);
  revalidatePath(`/plan/${marker}/settings`);
}

export async function dropMember(marker: string, userId: string) {
  const festival = await organiserOf(marker);
  if (!festival) return;
  await removeMember(festival.id, userId);
  revalidatePath(`/plan/${marker}/settings`);
}

export async function submit(marker: string) {
  const festival = await organiserOf(marker);
  if (!festival) return;
  await submitForReview(festival.id);
  revalidatePath(`/plan/${marker}/settings`);
}

/**
 * The event's settings, from the form.
 *
 * Read out of FormData explicitly rather than passed as an object: a form is
 * user input arriving at a public endpoint, and the shape it claims to have is
 * not evidence. An unchecked checkbox sends nothing at all, which is why every
 * boolean is read as "was it present".
 */
export async function saveSettings(
  marker: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const festival = await organiserOf(marker);
  if (!festival) return { error: "not yours to change" };

  const text = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };
  const on = (key: string) => formData.get(key) !== null;

  const name = text("name");
  if (!name) return { error: "a festival needs a title" };

  // The address, if it moved. Validated here as well as in the checker: that
  // one runs in the browser as a courtesy, this one is the gate.
  const wanted = slugify(String(formData.get("marker") ?? ""));
  if (wanted && wanted !== festival.marker) {
    if (!isValidMarker(wanted)) return { error: "that address cannot be used" };
    const moved = await changeMarker(festival, wanted);
    if (moved.error) return moved;
  }

  const capacityRaw = text("capacity");
  const capacity = capacityRaw === null ? null : Number(capacityRaw);
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    return { error: "places must be a whole number, or empty for no limit" };
  }

  const language = String(formData.get("language") ?? "en");
  if (!["en", "nl", "es", "pt", "de"].includes(language)) {
    return { error: "that language is not one The Thread knows" };
  }
  const interaction = String(formData.get("public_interaction") ?? "page");
  if (!["page", "popup"].includes(interaction)) {
    return { error: "that is not a way of opening an event" };
  }

  // Only meaningful before the page exists — after that a template would
  // duplicate the items it already laid down. Ignored rather than refused: the
  // field is not on the form once published, so a value here is stale, not an
  // error the organiser could act on.
  const templateId = festival.thread_id ? festival.thread_template_id : text("thread_template_id");

  const result = await saveEventSettings(festival, {
    name,
    summary: text("summary"),
    place: text("place"),
    starts_on: text("starts_on"),
    timezone: text("timezone") ?? "Europe/Amsterdam",
    language: language as "en" | "nl" | "es" | "pt" | "de",
    requires_approval: on("requires_approval"),
    public_interaction: interaction as "page" | "popup",
    share_participants_public: on("share_participants_public"),
    share_participants_participants: on("share_participants_participants"),
    capacity,
    is_public_listed: on("is_public_listed"),
    show_public_agenda: on("show_public_agenda"),
    organiser_note: text("organiser_note"),
    practical_info: text("practical_info"),
    thread_template_id: templateId,
  });

  revalidatePath(`/plan/${marker}/settings`);
  revalidatePath(`/${marker}`);
  if (wanted && wanted !== festival.marker) {
    // The page it was just saved on no longer exists under that name.
    redirect(`/plan/${wanted}/settings`);
  }
  return result;
}

/**
 * Is this address free, and if not, what is?
 *
 * Taken markers are read through RLS, which shows a signed-in organiser every
 * live festival plus their own — so a marker held by someone else's draft
 * looks free here and is refused by the unique index on save. That is the
 * right way round: the check is a courtesy, the index is the rule, and the
 * alternative would be publishing the existence of other people's drafts.
 */
export async function checkMarker(
  marker: string,
  currentMarker: string,
  title: string,
): Promise<{ ok: boolean; reason?: string; suggestions: string[] }> {
  const festival = await organiserOf(currentMarker);
  if (!festival) return { ok: false, reason: "not yours to change", suggestions: [] };

  const wanted = slugify(marker);
  if (wanted === festival.marker) return { ok: true, suggestions: [] };

  const taken = new Set((await takenMarkers()).filter((m) => m !== festival.marker));
  const suggestions = suggestMarkers(title || festival.name, taken, new Date().getFullYear());

  if (!wanted) return { ok: false, reason: "an address cannot be empty", suggestions };
  if (!isValidMarker(wanted)) {
    return {
      ok: false,
      reason: "letters, numbers and hyphens only, and not a name the site already uses",
      suggestions,
    };
  }
  if (taken.has(wanted)) return { ok: false, reason: "already taken", suggestions };
  return { ok: true, suggestions: [] };
}

/**
 * The agenda actions gate on the organiser like everything above; the row
 * policies close the remaining gap, so an item id from another festival dies
 * at the database rather than needing a lookup here.
 */
export async function addAgenda(
  marker: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const festival = await organiserOf(marker);
  if (!festival) return { error: "not yours to change" };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "an agenda item needs a title" };
  const description = String(formData.get("description") ?? "").trim() || null;

  const r = await addAgendaItem(festival.id, title, description);
  revalidatePath(`/plan/${marker}/settings`);
  revalidatePath(`/${marker}`);
  return r;
}

export async function saveAgenda(
  marker: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const festival = await organiserOf(marker);
  if (!festival) return { error: "not yours to change" };

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return { error: "an agenda item needs a title" };
  const description = String(formData.get("description") ?? "").trim() || null;

  const r = await updateAgendaItem(id, title, description);
  revalidatePath(`/plan/${marker}/settings`);
  revalidatePath(`/${marker}`);
  return r;
}

export async function removeAgenda(
  marker: string,
  id: string,
): Promise<{ error?: string }> {
  const festival = await organiserOf(marker);
  if (!festival) return { error: "not yours to change" };

  const r = await deleteAgendaItem(id);
  revalidatePath(`/plan/${marker}/settings`);
  revalidatePath(`/${marker}`);
  return r;
}

/**
 * Deletion is the owner's (or the admin's), not a collaborator's — RLS says
 * the same, and refuses live festivals besides. The typed address is checked
 * again here: a public endpoint takes no browser's word for a confirmation.
 */
export async function deleteFestivalAction(
  marker: string,
  confirmMarker: string,
): Promise<{ error?: string }> {
  if (confirmMarker !== marker) return { error: "the address does not match" };
  const festival = await festivalByMarker(marker);
  if (!festival) return { error: "not found" };
  if (festival.status === "live") {
    return { error: "a live festival is taken offline first, then deleted" };
  }

  const supabase = await serverSupabase();
  const { error, count } = await supabase
    .from("festival")
    .delete({ count: "exact" })
    .eq("id", festival.id);
  if (error) return { error: error.message };
  if (!count) {
    // RLS swallowed it: not the owner, or the policy migration has not run.
    return {
      error:
        "nothing was deleted — only the owner may, and the database needs 0017_festival_delete.sql",
    };
  }
  redirect("/festivals");
}

/**
 * Claim one composition from the Festival logos pool. Two organisers racing
 * for the same form is settled by the database: the update only lands where
 * claimed_by is still null, so the second one gets a count of zero and a
 * message instead of someone else's logo.
 */
export async function chooseLogo(
  marker: string,
  logoId: string,
): Promise<{ error?: string }> {
  const festival = await festivalByMarker(marker);
  if (!festival) return { error: "not found" };
  const supabase = await serverSupabase();
  // A festival wears one logo at a time — hand back the current one first.
  await supabase.from("logo").update({ claimed_by: null }).eq("claimed_by", festival.id);
  const { error, count } = await supabase
    .from("logo")
    .update({ claimed_by: festival.id }, { count: "exact" })
    .eq("id", logoId)
    .is("claimed_by", null);
  if (error) return { error: error.message };
  if (!count) return { error: "another festival chose this one just now — pick a different form" };
  revalidatePath(`/plan/${marker}/settings`);
  return {};
}

export async function releaseLogo(marker: string): Promise<{ error?: string }> {
  const festival = await festivalByMarker(marker);
  if (!festival) return { error: "not found" };
  const supabase = await serverSupabase();
  const { error } = await supabase
    .from("logo")
    .update({ claimed_by: null })
    .eq("claimed_by", festival.id);
  if (error) return { error: error.message };
  revalidatePath(`/plan/${marker}/settings`);
  return {};
}
