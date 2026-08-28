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

import { FibreError, link, recordActivity } from "@/lib/fibre";

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
    return {
      personId: null,
      created: false,
      error: e instanceof FibreError ? e.detail : String(e),
    };
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
    return {
      personId: null,
      created: false,
      error: e instanceof FibreError ? e.detail : String(e),
    };
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
