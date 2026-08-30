"use server";

import { revalidatePath } from "next/cache";
import { accessTo, festivalByMarker } from "@/lib/festivals";
import { approveEnrolment, declineEnrolment, FibreError } from "@/lib/fibre";

/**
 * The organiser's decision on an application. Reviewing is an organiser's
 * authority, not a host's — the same line the money draws. The platform
 * enforces ownership again on its side (source_app), so a foreign id dies
 * there rather than needing a lookup here.
 */
async function organiserOf(marker: string) {
  const festival = await festivalByMarker(marker);
  if (!festival) return null;
  const access = await accessTo(festival);
  return access?.role === "organiser" ? festival : null;
}

export async function admit(
  marker: string,
  enrolmentRowId: string,
): Promise<{ error?: string }> {
  if (!(await organiserOf(marker))) return { error: "not yours to decide" };
  try {
    await approveEnrolment(enrolmentRowId);
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
  revalidatePath(`/plan/${marker}/registrations`);
  return {};
}

export async function turnAway(
  marker: string,
  enrolmentRowId: string,
): Promise<{ error?: string }> {
  if (!(await organiserOf(marker))) return { error: "not yours to decide" };
  try {
    await declineEnrolment(enrolmentRowId);
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
  revalidatePath(`/plan/${marker}/registrations`);
  return {};
}
