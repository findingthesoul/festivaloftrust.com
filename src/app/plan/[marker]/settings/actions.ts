"use server";

import { revalidatePath } from "next/cache";
import { serverSupabase } from "@/lib/supabase/server";
import {
  festivalByMarker,
  accessTo,
  invite,
  removeMember,
  saveEventSettings,
  submitForReview,
  withdrawInvite,
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
  });

  revalidatePath(`/plan/${marker}/settings`);
  revalidatePath(`/${marker}`);
  return result;
}
