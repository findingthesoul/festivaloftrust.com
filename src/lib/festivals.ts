"use server";

/**
 * Festivals: the app's own record of which festival is at which address, who
 * owns it, and which Fibre run it is planned in.
 *
 * Reads and writes go through the signed-in organiser's Supabase session, so
 * RLS decides what they can see. Nothing here trusts a marker from the URL to
 * mean the caller is entitled to it — the policy does that.
 */

import { serverSupabase } from "@/lib/supabase/server";
import {
  startRun,
  listFlows,
  listEnrolments,
  publishThread,
  patchThread,
  FibreError,
} from "@/lib/fibre";
import { linkHostOrganisation, linkOrganiser, noteActivity } from "@/lib/contact-graph";

export type FestivalStatus = "draft" | "submitted" | "live";

export type Festival = {
  id: string;
  marker: string;
  name: string;
  status: FestivalStatus;
  summary: string | null;
  place: string | null;
  starts_on: string | null;
  cover_url: string | null;
  fibre_run_id: string | null;
  host_org_id: string | null;
  thread_id: string | null;
  thread_slug: string | null;
  owner_id: string;
  created_at: string;
};

const COLUMNS =
  "id, marker, name, status, summary, place, starts_on, cover_url, fibre_run_id, host_org_id, thread_id, thread_slug, owner_id, created_at";

/**
 * The festivals this person actually works on.
 *
 * Filtered here rather than left to RLS. `can_see_festival` is true for every
 * live festival, because the public page reads through the same policy — so
 * selecting the table plainly returns everybody's published festivals, and
 * "Your festivals" listed one you had no part in and could not open.
 */
export async function listFestivals(): Promise<Festival[]> {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data: memberships } = await supabase
    .from("festival_member")
    .select("festival_id")
    .eq("user_id", auth.user.id);
  const ids = (memberships ?? []).map((m: { festival_id: string }) => m.festival_id);

  let query = supabase.from("festival").select(COLUMNS);
  query = ids.length
    ? query.or(`owner_id.eq.${auth.user.id},id.in.(${ids.join(",")})`)
    : query.eq("owner_id", auth.user.id);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Festival[];
}

/** One festival by its public marker. RLS returns nothing if it is not theirs. */
export async function festivalByMarker(marker: string): Promise<Festival | null> {
  const supabase = await serverSupabase();
  const { data } = await supabase
    .from("festival")
    .select(COLUMNS)
    .eq("marker", marker)
    .maybeSingle();
  return (data as Festival) ?? null;
}

/**
 * The first festival, made the moment an approved organiser has none.
 *
 * Approval is the answer to "may I run a Festival of Trust", so the next thing
 * they see should be their festival, not an empty page and a button. Created
 * as them rather than at approval time, because the insert policy requires
 * owner_id = auth.uid() — an admin cannot write a festival for someone else,
 * and should not be able to.
 *
 * Runs once: the moment they own one, this does nothing forever after.
 */
export async function ensureFirstFestival(profile: {
  fullName: string | null;
  organisation: string | null;
}): Promise<Festival | null> {
  const mine = await listFestivals();
  if (mine.length > 0) return null;

  const source = profile.organisation?.trim() || profile.fullName?.trim() || "";
  const base =
    source
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "festival-of-trust";
  // The check constraint wants at least three characters, first and last
  // alphanumeric.
  const seed = base.length >= 3 ? base : `${base}-festival`;

  const taken = new Set(await takenMarkers());
  let marker = seed;
  for (let n = 2; taken.has(marker); n++) marker = `${seed}-${n}`;

  const made = await createFestival({
    name: profile.organisation?.trim()
      ? `Festival of Trust — ${profile.organisation.trim()}`
      : "Festival of Trust",
    marker,
    ...(profile.organisation?.trim() ? { hostOrganisation: profile.organisation.trim() } : {}),
  });
  return "error" in made ? null : made.festival;
}

/** Markers already in use, so suggestions can avoid them. */
export async function takenMarkers(): Promise<string[]> {
  const supabase = await serverSupabase();
  const { data } = await supabase.from("festival").select("marker");
  return (data ?? []).map((r: { marker: string }) => r.marker);
}

/**
 * Create a festival and its Fibre run.
 *
 * Two systems, so two steps. The row is written first and carries the identity;
 * the run's source_ref is that id, which is what makes the marker free to
 * change later without spawning a second run. If the run cannot be started the
 * festival still exists and can be retried — creation is idempotent on
 * source_ref, so a retry attaches the same run rather than a second one.
 */
export async function createFestival(input: {
  name: string;
  marker: string;
  place?: string;
  hostOrganisation?: string;
  hostOrgId?: string;
}): Promise<{ festival: Festival } | { error: string }> {
  const supabase = await serverSupabase();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "not signed in" };

  const { data: row, error } = await supabase
    .from("festival")
    .insert({
      name: input.name,
      marker: input.marker,
      place: input.place ?? null,
      owner_id: user.user.id,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    // 23505 is the unique index on marker.
    if (error.code === "23505") return { error: "that address is already taken" };
    return { error: error.message };
  }
  const festival = row as Festival;

  // Put the people into the contact graph before the run, so the run can carry
  // the organisation and the timeline entry has someone to belong to. None of
  // this is allowed to stop a festival being created.
  const profile = await supabase
    .from("organiser")
    .select("full_name, organisation, fibre_person_id")
    .eq("id", user.user.id)
    .maybeSingle();
  if (profile.error) {
    // A missing column here used to fail silently and take the whole contact
    // link with it, leaving a festival with nobody attached.
    console.error("[festivals] could not read the organiser profile", profile.error.message);
  }
  const me = profile.data as
    | { full_name: string | null; organisation: string | null; fibre_person_id: string | null }
    | null;

  let personId = me?.fibre_person_id ?? null;
  if (!personId) {
    const linked = await linkOrganiser({
      userId: user.user.id,
      email: user.user.email ?? "",
      name: me?.full_name ?? null,
    });
    personId = linked.personId;
    if (personId) {
      await supabase
        .from("organiser")
        .update({ fibre_person_id: personId, fibre_linked_at: new Date().toISOString() })
        .eq("id", user.user.id);
    }
  }

  const orgName = input.hostOrganisation ?? me?.organisation ?? null;
  let hostOrgId = input.hostOrgId ?? null;
  if (!hostOrgId && orgName) {
    hostOrgId = (await linkHostOrganisation(festival.id, orgName)).personId;
  }

  try {
    const { flows } = await listFlows();
    const flow = flows?.find((f) => f.system_key === "fot_festival");
    if (!flow) return { festival };

    const run = await startRun(flow.id, {
      subject_label: input.name,
      source_ref: festival.id,
      ...(hostOrgId ? { organisation_id: hostOrgId } : {}),
      ...(personId ? { person_id: personId } : {}),
    });

    await noteActivity({
      type: "fot_planner_plan_created",
      subject: `Started planning ${input.name}`,
      ...(personId ? { personId } : {}),
      ...(hostOrgId ? { organisationId: hostOrgId } : {}),
    });

    const { data: updated } = await supabase
      .from("festival")
      .update({ fibre_run_id: run.id, host_org_id: hostOrgId })
      .eq("id", festival.id)
      .select(COLUMNS)
      .single();
    return { festival: (updated as Festival) ?? festival };
  } catch (e) {
    // The festival exists; only the run is missing. Better to hand it back and
    // let the organiser retry than to delete a row they just made.
    console.error("[festivals] run creation failed", e instanceof FibreError ? e.detail : e);
    return { festival };
  }
}

/**
 * What the signed-in person may do on a festival.
 *
 * An organiser runs it; a host helps run it and does not see the money. That
 * distinction is the only reason this returns a role rather than a boolean.
 */
export type Access = { role: "organiser" | "host"; canSeeMoney: boolean };

export async function accessTo(festival: Festival): Promise<Access | null> {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  if (festival.owner_id === auth.user.id) {
    return { role: "organiser", canSeeMoney: true };
  }
  const { data } = await supabase
    .from("festival_member")
    .select("role")
    .eq("festival_id", festival.id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!data) return null;

  const role = (data as { role: "organiser" | "host" }).role;
  return { role, canSeeMoney: role === "organiser" };
}

/** Submit a draft for review. Going live is the admin's to grant. */
export async function submitForReview(id: string): Promise<{ error?: string }> {
  const supabase = await serverSupabase();
  const { error } = await supabase
    .from("festival")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", id);
  return error ? { error: error.message } : {};
}

export type Member = {
  user_id: string;
  role: "organiser" | "host";
  email: string | null;
};

export type Invite = {
  id: string;
  email: string;
  role: "organiser" | "host";
  invited_at: string;
};

/** Who is on a festival, and who has been asked but not yet arrived. */
export async function collaborators(
  festivalId: string,
): Promise<{ members: Member[]; invites: Invite[] }> {
  const supabase = await serverSupabase();
  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("festival_member")
      .select("user_id, role, organiser:organiser!inner(email)")
      .eq("festival_id", festivalId),
    supabase
      .from("festival_invite")
      .select("id, email, role, invited_at")
      .eq("festival_id", festivalId)
      .is("claimed_at", null)
      .order("invited_at"),
  ]);

  return {
    members: (members ?? []).map((m) => {
      const row = m as unknown as {
        user_id: string;
        role: "organiser" | "host";
        organiser: { email: string } | { email: string }[] | null;
      };
      const org = Array.isArray(row.organiser) ? row.organiser[0] : row.organiser;
      return { user_id: row.user_id, role: row.role, email: org?.email ?? null };
    }),
    invites: (invites ?? []) as Invite[],
  };
}

/**
 * Invite someone by email.
 *
 * Addressed to an address rather than a user, because the people worth inviting
 * are usually the ones who have not signed in yet. It becomes a membership the
 * first time that address does.
 */
export async function invite(
  festivalId: string,
  email: string,
  role: "organiser" | "host",
): Promise<{ error?: string }> {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("festival_invite").insert({
    festival_id: festivalId,
    email: email.trim().toLowerCase(),
    role,
    invited_by: auth.user?.id,
  });
  if (error) {
    if (error.code === "23505") return { error: "already invited" };
    return { error: error.message };
  }
  return {};
}

export async function withdrawInvite(id: string): Promise<{ error?: string }> {
  const supabase = await serverSupabase();
  const { error } = await supabase.from("festival_invite").delete().eq("id", id);
  return error ? { error: error.message } : {};
}

export async function removeMember(
  festivalId: string,
  userId: string,
): Promise<{ error?: string }> {
  const supabase = await serverSupabase();
  const { error } = await supabase
    .from("festival_member")
    .delete()
    .eq("festival_id", festivalId)
    .eq("user_id", userId);
  return error ? { error: error.message } : {};
}

/**
 * A festival's public face.
 *
 * Only live ones. A draft returns nothing, so an unpublished marker is
 * indistinguishable from one that was never taken — which is what stops the
 * public page being used to discover what is being planned.
 */
export async function liveFestival(marker: string): Promise<Festival | null> {
  const supabase = await serverSupabase();
  const { data } = await supabase
    .from("festival")
    .select(COLUMNS)
    .eq("marker", marker)
    .eq("status", "live")
    .maybeSingle();
  return (data as Festival) ?? null;
}

/**
 * Publish the festival as a public page in The Thread.
 *
 * Created in draft: approval here means "this may exist publicly", not "open
 * the doors". Someone still decides when registration opens, in The Thread.
 *
 * Idempotent on `source_ref`, so a retried publish returns the page that
 * already exists rather than a second one.
 */
export async function publishToThread(
  festival: Festival,
): Promise<{ threadId: string } | { error: string }> {
  if (!process.env.FIBRE_APP_KEY) return { error: "not configured" };
  // Already has a page: this is a re-publish after a take-offline, so put the
  // listing back rather than returning a thread that is still hidden. Without
  // this, "Take offline" would be a one-way door.
  if (festival.thread_id) {
    try {
      await patchThread(festival.thread_id, { is_public_listed: true });
    } catch (e) {
      return { error: e instanceof FibreError ? e.detail : String(e) };
    }
    const db = await serverSupabase();
    await db
      .from("festival")
      .update({ published_at: new Date().toISOString() })
      .eq("id", festival.id);
    return { threadId: festival.thread_id };
  }

  const supabase = await serverSupabase();
  const { data: owner } = await supabase
    .from("organiser")
    .select("id, email, full_name, fibre_person_id")
    .eq("id", festival.owner_id)
    .maybeSingle();
  const org = owner as
    | { id: string; email: string; full_name: string | null; fibre_person_id: string | null }
    | null;
  if (!org) return { error: "the festival has no organiser record" };

  // Make sure the organiser is in the contact graph, so the activity below
  // lands on their timeline. Not a precondition of publishing: the page is the
  // workspace's, and refusing to publish because a contact could not be linked
  // would block the festival for a reason that has nothing to do with it.
  let personId = org.fibre_person_id;
  if (!personId) {
    const linked = await linkOrganiser({
      userId: org.id,
      email: org.email,
      name: org.full_name,
    });
    personId = linked.personId;
    if (personId) {
      await supabase
        .from("organiser")
        .update({ fibre_person_id: personId, fibre_linked_at: new Date().toISOString() })
        .eq("id", org.id);
    }
  }

  try {
    const thread = await publishThread({
      title: festival.name,
      format: "event",
      slug: festival.marker,
      intention: festival.summary,
      starts_on: festival.starts_on,
      source_ref: festival.id,
    });

    // Listed, so the two paths end in the same state. Listed is not the same
    // as open for registration — capacity and enrolment are decided separately.
    if (!thread.is_public_listed) {
      await patchThread(thread.id, { is_public_listed: true });
    }

    await supabase
      .from("festival")
      .update({
        thread_id: thread.id,
        thread_slug: thread.slug,
        published_at: new Date().toISOString(),
      })
      .eq("id", festival.id);

    await noteActivity({
      type: "fot_planner_festival_published",
      subject: `Published ${festival.name}`,
      ...(personId ? { personId } : {}),
      ...(festival.host_org_id ? { organisationId: festival.host_org_id } : {}),
    });

    return { threadId: thread.id };
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
}

/**
 * Take a festival's public page back down.
 *
 * The thread is kept, not deleted: it holds the enrolments, and deleting it
 * would take real registrations with it. Draft + unlisted is the reversible
 * version of the same intent — and because `thread_id` stays, putting the
 * festival live again reuses the page people may already have linked to.
 */
export async function unpublishFromThread(
  festival: Pick<Festival, "id" | "thread_id">,
): Promise<{ ok: true } | { error: string }> {
  if (!festival.thread_id) return { ok: true };
  if (!process.env.FIBRE_APP_KEY) return { error: "not configured" };

  try {
    await patchThread(festival.thread_id, {
      status: "draft",
      is_public_listed: false,
    });
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }

  const supabase = await serverSupabase();
  await supabase.from("festival").update({ published_at: null }).eq("id", festival.id);
  return { ok: true };
}

/** Who has registered. Empty until The Thread's page is opened for enrolment. */
export async function registrations(festival: Festival) {
  if (!festival.thread_id || !process.env.FIBRE_APP_KEY) return [];
  try {
    const { enrolments } = await listEnrolments(festival.thread_id);
    return enrolments ?? [];
  } catch {
    return [];
  }
}
