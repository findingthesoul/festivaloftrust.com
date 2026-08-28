"use server";

/**
 * Putting people into The Fibre's contact graph.
 *
 * An organiser signs in through this app's own Supabase, which the platform
 * knows nothing about — apps cannot create Fibre users and should not. What
 * belongs in Fibre is the *person*: the contact, alongside their festival,
 * their partners and later their registrants. That is where "one human, one
 * timeline across every app" actually lives.
 *
 * Failure here is deliberately quiet. Someone's festival should not fail to
 * open because the platform was briefly unreachable — the link is recoverable
 * on the next attempt, and the local record is the source of truth for who they
 * are.
 */

import { FibreError, link, recordActivity, recordMembership } from "@/lib/fibre";

type Result = { personId: string | null; created: boolean; error?: string };

async function linkPerson(appRecordId: string, email: string, name: string | null): Promise<Result> {
  if (!process.env.FIBRE_APP_KEY) return { personId: null, created: false };
  try {
    const r = await link({
      app_entity: "festival_organiser",
      app_record_id: appRecordId,
      // Only these three fields reach the platform: a created person gets
      // email and a split name and nothing else. Phone and address are held
      // locally until Fibre can accept them.
      match_on: { email, ...(name ? { name } : {}) },
      create_if_missing: true,
    });
    return { personId: r.platform_id, created: r.action === "created" };
  } catch (e) {
    // Quiet for the caller, loud in the logs. Swallowing this entirely meant a
    // festival could be created with nobody attached and nothing anywhere
    // saying why — which then blocked publishing, with a second misleading
    // message.
    const detail = e instanceof FibreError ? e.detail : String(e);
    console.error("[contact-graph] could not link person", { appRecordId, detail });
    return { personId: null, created: false, error: detail };
  }
}

/**
 * Put a person into the organisation hosting their festival.
 *
 * This is the edge that makes the contact graph a graph. Without it the
 * workspace knows the organiser and knows the host organisation and cannot say
 * that one belongs to the other — so "the contacts we had through this
 * organisation" has nothing to answer from.
 *
 * Quiet like the rest of this file: a festival should not fail because an edge
 * could not be drawn.
 */
export async function joinOrganisation(input: {
  personRecordId: string;
  festivalId: string;
  title?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.FIBRE_APP_KEY) return { ok: false };
  try {
    await recordMembership({
      person: { app_entity: "festival_organiser", app_record_id: input.personRecordId },
      organisation: { app_entity: "festival_host", app_record_id: `festival:${input.festivalId}` },
      ...(input.title ? { title: input.title } : {}),
      is_primary: true,
    });
    return { ok: true };
  } catch (e) {
    const detail = e instanceof FibreError ? e.detail : String(e);
    console.error("[contact-graph] could not record the membership", {
      festivalId: input.festivalId,
      detail,
    });
    return { ok: false, error: detail };
  }
}

/** The organiser of a festival, as a contact. */
export async function linkOrganiser(input: {
  userId: string;
  email: string;
  name: string | null;
}): Promise<Result> {
  return linkPerson(`organiser:${input.userId}`, input.email, input.name);
}

/** A host joining a festival, as a contact. */
export async function linkHost(input: {
  userId: string;
  email: string;
  name: string | null;
}): Promise<Result> {
  return linkPerson(`host:${input.userId}`, input.email, input.name);
}

/** The community or organisation hosting, as an organisation. */
export async function linkHostOrganisation(
  festivalId: string,
  name: string,
): Promise<Result> {
  if (!process.env.FIBRE_APP_KEY || !name.trim()) {
    return { personId: null, created: false };
  }
  try {
    const r = await link({
      app_entity: "festival_host",
      app_record_id: `festival:${festivalId}`,
      match_on: { name: name.trim() },
      create_if_missing: true,
    });
    return { personId: r.platform_id, created: r.action === "created" };
  } catch (e) {
    const detail = e instanceof FibreError ? e.detail : String(e);
    console.error("[contact-graph] could not link organisation", { festivalId, detail });
    return { personId: null, created: false, error: detail };
  }
}

/**
 * A moment worth putting on someone's timeline.
 *
 * Sparingly: activity is append-only and permanent, and an activity row also
 * pins the person against deletion. Step completion is already queryable from
 * the run — this is for the handful of things a workspace member should see.
 */
export async function noteActivity(input: {
  type:
    | "fot_planner_plan_created"
    | "fot_planner_plan_updated"
    | "fot_planner_offer_issued"
    | "fot_planner_festival_published";
  subject: string;
  personId?: string;
  organisationId?: string;
}): Promise<void> {
  if (!process.env.FIBRE_APP_KEY) return;
  try {
    await recordActivity({
      type: input.type,
      subject: input.subject,
      ...(input.personId ? { person_id: input.personId } : {}),
      ...(input.organisationId ? { organisation_id: input.organisationId } : {}),
    });
  } catch {
    // A missing timeline entry is not worth failing a festival over.
  }
}
