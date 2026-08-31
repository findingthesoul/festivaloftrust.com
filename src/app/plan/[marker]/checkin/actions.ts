"use server";

import { revalidatePath } from "next/cache";
import { accessTo, festivalByMarker } from "@/lib/festivals";
import { checkinEnrolment, resolveCheckin } from "@/lib/fibre";
import { bookSupabase } from "@/lib/supabase/service";

/**
 * The door's writes. Any of the festival's own people — organisers and the
 * hosts actually standing at the door — may check guests in and out. The
 * book has no write policies, so the writes go through the server's own key
 * after the caller's role is proven.
 */
async function teamFestival(marker: string) {
  const festival = await festivalByMarker(marker);
  if (!festival) return null;
  const access = await accessTo(festival);
  return access ? festival : null;
}

export type CheckResult = { error?: string; arrived?: boolean; name?: string };

/** Check a known book row in or out. */
export async function setArrived(
  marker: string,
  attendeeId: string,
  on: boolean,
): Promise<CheckResult> {
  const festival = await teamFestival(marker);
  if (!festival) return { error: "not yours" };
  const admin = await bookSupabase();
  if (!admin) return { error: "the door is not configured on this server" };
  const { data, error } = await admin
    .from("festival_attendee")
    .update({ arrived_at: on ? new Date().toISOString() : null })
    .eq("id", attendeeId)
    .eq("festival_id", festival.id)
    .select("name")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "no such guest on this festival" };
  revalidatePath(`/plan/${marker}/checkin`);
  return { arrived: on, name: (data as { name: string }).name };
}

/**
 * Check in a guest the book does not know yet — a platform enrolment that
 * never touched the site's own form. A row is made for them at the door.
 */
export async function checkInPlatformGuest(
  marker: string,
  guest: { name: string; email: string | null },
): Promise<CheckResult> {
  const festival = await teamFestival(marker);
  if (!festival) return { error: "not yours" };
  const admin = await bookSupabase();
  if (!admin) return { error: "the door is not configured on this server" };

  if (guest.email) {
    const { data: existing } = await admin
      .from("festival_attendee")
      .select("id")
      .eq("festival_id", festival.id)
      .ilike("email", guest.email)
      .maybeSingle();
    if (existing) {
      return setArrived(marker, (existing as { id: string }).id, true);
    }
  }
  const { error } = await admin.from("festival_attendee").insert({
    festival_id: festival.id,
    name: guest.name,
    email: guest.email ?? `door-${crypto.randomUUID().slice(0, 8)}@unknown.invalid`,
    request_id: `door-${crypto.randomUUID()}`,
    arrived_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath(`/plan/${marker}/checkin`);
  return { arrived: true, name: guest.name };
}


/** Check a platform enrolment in or out, on the platform's own book. */
export async function setEnrolmentArrived(
  marker: string,
  enrolmentRowId: string,
  on: boolean,
): Promise<CheckResult> {
  const festival = await teamFestival(marker);
  if (!festival) return { error: "not yours" };
  try {
    await checkinEnrolment(enrolmentRowId, !on);
    revalidatePath(`/plan/${marker}/checkin`);
    return { arrived: on };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** A scanned Thread ticket: resolve the code, admit its person. */
export async function checkInThreadCode(
  marker: string,
  code: string,
): Promise<CheckResult> {
  const festival = await teamFestival(marker);
  if (!festival) return { error: "not yours" };
  try {
    const ticket = await resolveCheckin(code);
    if (ticket.status === "declined") {
      return { error: `${ticket.full_name ?? "This guest"} was declined — not admitted.` };
    }
    await checkinEnrolment(ticket.id, false);
    revalidatePath(`/plan/${marker}/checkin`);
    return { arrived: true, name: ticket.full_name ?? undefined };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
