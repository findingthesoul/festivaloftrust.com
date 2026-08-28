"use server";

import { revalidatePath } from "next/cache";
import { serverSupabase } from "@/lib/supabase/server";
import {
  festivalByMarker,
  accessTo,
  invite,
  removeMember,
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
