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

export type Festival = {
  id: string;
  marker: string;
  name: string;
  fibre_run_id: string | null;
  host_org_id: string | null;
  created_at: string;
};

const COLUMNS = "id, marker, name, fibre_run_id, host_org_id, created_at";

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
  hostOrgId?: string;
}): Promise<{ festival: Festival } | { error: string }> {
  const supabase = await serverSupabase();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "not signed in" };

  const { data: row, error } = await supabase
    .from("festival")
    .insert({ name: input.name, marker: input.marker, owner_id: user.user.id })
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
