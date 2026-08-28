"use server";

import { revalidatePath } from "next/cache";
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
  revalidatePath(`/plan/${marker}/settings`);
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
