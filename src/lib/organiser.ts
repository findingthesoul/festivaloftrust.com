"use server";

/**
 * Who the signed-in person is, and what they are allowed to do.
 *
 * Signing in and being allowed to organise are separate things: anyone can get
 * a magic link, but only an approved organiser can create a festival. Every
 * gated page asks here rather than deciding for itself.
 */

import { serverSupabase } from "@/lib/supabase/server";
import { creditOnThread, linkHost } from "@/lib/contact-graph";

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
 * being an email address and become a person on the work — and where the
 * festival's public page starts naming them among its hosts.
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

  // Linked on every claim, not only the first. Someone who applied to organise
  // is already linked as `organiser:<id>`, which leaves `host:<id>` pointing at
  // nobody — and that is the record id the festival's page resolves them by, so
  // skipping this left them off it. Matching is on email, so a second call
  // relinks the same person rather than making another one.
  const linked = await linkHost({
    userId: auth.user.id,
    email: auth.user.email ?? "",
    name: me?.full_name ?? null,
  });
  if (!linked.personId) return claimed;
  if (!me?.fibre_person_id) {
    await supabase
      .from("organiser")
      .update({ fibre_person_id: linked.personId, fibre_linked_at: new Date().toISOString() })
      .eq("id", auth.user.id);
  }

  // The festivals they were let into. claim_festival_invites answers with a
  // count and not the ids, but festival_member holds invited collaborators and
  // only those — an owner is not a member of their own festival — so a select
  // says it without an RPC having to change.
  const { data: rows } = await supabase
    .from("festival_member")
    .select("festival_id")
    .eq("user_id", auth.user.id);
  const ids = (rows ?? []).map((m: { festival_id: string }) => m.festival_id);
  if (!ids.length) return claimed;

  // Only a festival that has a page can name anyone on one. The rest get their
  // hosts when they publish.
  const { data: pages } = await supabase
    .from("festival")
    .select("id, thread_id")
    .in("id", ids)
    .not("thread_id", "is", null);

  // Their older festivals come back too, and are added again on purpose: the
  // platform is idempotent per (page, person), so a credit that failed the
  // first time is repaired the next time they claim anything.
  for (const page of (pages ?? []) as { id: string; thread_id: string }[]) {
    await creditOnThread({
      personRecordId: `host:${auth.user.id}`,
      threadId: page.thread_id,
    });
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
