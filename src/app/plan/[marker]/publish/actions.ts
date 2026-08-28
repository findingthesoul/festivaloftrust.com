"use server";

import { revalidatePath } from "next/cache";
import { serverSupabase } from "@/lib/supabase/server";
import {
  accessTo,
  closeRegistration,
  festivalByMarker,
  openRegistration,
  submitForReview,
  unpublishFromThread,
} from "@/lib/festivals";

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

/**
 * Open enrolment — now, or from a moment.
 *
 * `at` is empty for now and a datetime-local value otherwise. That value has
 * no timezone, so it is read in the festival's own: "opens at nine" means nine
 * where the festival is, not nine where the organiser happened to be sitting.
 */
export async function openRegistrationAt(
  marker: string,
  at: string,
): Promise<{ error?: string }> {
  const festival = await organiserOf(marker);
  if (!festival) return { error: "not yours to open" };

  let when: string | null = null;
  if (at) {
    const parsed = zonedToUtc(at, festival.timezone);
    if (!parsed) return { error: "that is not a time I can read" };
    when = parsed;
  }

  const result = await openRegistration(festival, when);
  revalidatePath(`/plan/${marker}/publish`);
  revalidatePath(`/${marker}`);
  return result;
}

export async function stopRegistration(marker: string): Promise<{ error?: string }> {
  const festival = await organiserOf(marker);
  if (!festival) return { error: "not yours to close" };
  const result = await closeRegistration(festival);
  revalidatePath(`/plan/${marker}/publish`);
  revalidatePath(`/${marker}`);
  return result;
}

/**
 * A wall-clock time in a named zone, as an instant.
 *
 * Intl is the only timezone database here, so this asks it what the candidate
 * instant looks like in that zone and corrects by the difference. One pass is
 * enough except within an hour of a DST change, where a second settles it.
 */
function zonedToUtc(local: string, timeZone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as unknown as number[];

  const wanted = Date.UTC(y, mo - 1, d, h, mi);
  let guess = wanted;
  for (let i = 0; i < 2; i++) {
    const seen = readInZone(new Date(guess), timeZone);
    if (seen === null) return null;
    const drift = seen - guess;
    if (drift === 0) break;
    guess = wanted - drift + (guess - wanted);
    guess = wanted - drift;
  }
  return new Date(guess).toISOString();
}

/** What this instant reads as on a clock in that zone, as a UTC timestamp. */
function readInZone(date: Date, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  } catch {
    return null;
  }
}
