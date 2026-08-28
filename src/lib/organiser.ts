"use server";

/**
 * Who the signed-in person is, and what they are allowed to do.
 *
 * Signing in and being allowed to organise are separate things: anyone can get
 * a magic link, but only an approved organiser can create a festival. Every
 * gated page asks here rather than deciding for itself.
 */

import { serverSupabase } from "@/lib/supabase/server";
import { linkHost } from "@/lib/contact-graph";

export type Organiser = {
  id: string;
  email: string;
  full_name: string | null;
  organisation: string | null;
  status: "pending" | "approved" | "declined";
  is_admin: boolean;
  review_note: string | null;
};

export type Standing =
  | { state: "signed-out" }
  /** Signed in but has never applied. */
  | { state: "no-application"; email: string }
  | { state: "pending"; organiser: Organiser }
  | { state: "declined"; organiser: Organiser }
  | { state: "approved"; organiser: Organiser };

export async function standing(): Promise<Standing> {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { state: "signed-out" };

  const { data } = await supabase
    .from("organiser")
    .select("id, email, full_name, organisation, status, is_admin, review_note")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!data) return { state: "no-application", email: auth.user.email ?? "" };
  const organiser = data as Organiser;
  return { state: organiser.status, organiser } as Standing;
}

/**
 * Turn any invitations addressed to this email into memberships.
 *
 * Someone who arrives this way is a real collaborator on a real festival, so
 * this is also where they enter the contact graph — the same moment they stop
 * being an email address and become a person on the work.
 */
export async function claimInvites(): Promise<number> {
  const supabase = await serverSupabase();
  const { data } = await supabase.rpc("claim_festival_invites");
  const claimed = typeof data === "number" ? data : 0;
  if (claimed === 0) return 0;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return claimed;

  const { data: row } = await supabase
    .from("organiser")
    .select("full_name, fibre_person_id")
    .eq("id", auth.user.id)
    .maybeSingle();
  const me = row as { full_name: string | null; fibre_person_id: string | null } | null;
  if (me?.fibre_person_id) return claimed;

  const linked = await linkHost({
    userId: auth.user.id,
    email: auth.user.email ?? "",
    name: me?.full_name ?? null,
  });
  if (linked.personId) {
    await supabase
      .from("organiser")
      .update({ fibre_person_id: linked.personId, fibre_linked_at: new Date().toISOString() })
      .eq("id", auth.user.id);
  }
  return claimed;
}

export async function apply(input: {
  fullName: string;
  organisation?: string;
  phone?: string;
  address?: string;
  reason?: string;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await serverSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "not signed in" };

  const { error } = await supabase.from("organiser").insert({
    id: auth.user.id,
    email: auth.user.email,
    full_name: input.fullName,
    organisation: input.organisation || null,
    phone: input.phone || null,
    address: input.address || null,
    reason: input.reason || null,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
