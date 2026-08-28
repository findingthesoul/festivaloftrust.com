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
import { startRun, listFlows, FibreError } from "@/lib/fibre";

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
  owner_id: string;
  created_at: string;
};

const COLUMNS =
  "id, marker, name, status, summary, place, starts_on, cover_url, fibre_run_id, host_org_id, owner_id, created_at";

export async function listFestivals(): Promise<Festival[]> {
  const supabase = await serverSupabase();
  const { data, error } = await supabase
    .from("festival")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
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

  try {
    const { flows } = await listFlows();
    const flow = flows?.find((f) => f.system_key === "fot_festival");
    if (!flow) return { festival };

    const run = await startRun(flow.id, {
      subject_label: input.name,
      source_ref: festival.id,
      ...(input.hostOrgId ? { organisation_id: input.hostOrgId } : {}),
    });

    const { data: updated } = await supabase
      .from("festival")
      .update({ fibre_run_id: run.id, host_org_id: input.hostOrgId ?? null })
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
