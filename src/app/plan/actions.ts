"use server";

/**
 * Server actions between the planner screens and The Fibre.
 *
 * They exist because the app key must never reach the browser: it is scoped to
 * this app in one workspace, and a bundle is public. Everything that touches
 * the platform runs here.
 *
 * While no key is configured these report `configured: false` and the screens
 * fall back to the browser-local store. That keeps the planner usable before
 * the app is approved, activated and keyed, without pretending to be connected.
 */

import {
  addTask as apiAddTask,
  getRun,
  link,
  linkedOrganisation,
  listFlows,
  listRuns,
  setNote as apiSetNote,
  setTaskStatus,
  startRun,
  whoami,
  FibreError,
  type FibreRun,
} from "@/lib/fibre";

/**
 * The festival flow is identified by system_key, following the pulse_pipeline
 * precedent. Set it when seeding the flow in Flow.
 */
const FESTIVAL_FLOW_KEY = process.env.FIBRE_FLOW_SYSTEM_KEY ?? "fot_festival";

export type Connection =
  | { configured: false }
  | { configured: true; ok: true; workspaceId: string; scopes: string[] }
  | { configured: true; ok: false; error: string };

export async function connectionStatus(): Promise<Connection> {
  if (!process.env.FIBRE_APP_KEY) return { configured: false };
  try {
    const me = await whoami();
    return {
      configured: true,
      ok: true,
      workspaceId: me.workspace_id,
      scopes: me.scopes ?? [],
    };
  } catch (e) {
    // A key that exists but does not work is worth saying out loud: the app is
    // probably registered but not yet approved or activated.
    return {
      configured: true,
      ok: false,
      error: e instanceof FibreError ? e.detail : String(e),
    };
  }
}

/**
 * Find this festival's run. Read-only on purpose: a page load must never create
 * one. Creation is an explicit act, not a side effect of someone visiting.
 */
export async function findRun(
  sourceRef: string | undefined,
): Promise<FibreRun | null> {
  if (!process.env.FIBRE_APP_KEY || !sourceRef) return null;
  try {
    const { runs } = await listRuns();
    const match = runs?.find((r) => r.source_ref === sourceRef);
    return match ? await getRun(match.id) : null;
  } catch {
    return null;
  }
}

/**
 * The Festival of Trust organisation, by our own record id rather than a UUID
 * in config.
 *
 * Asks the platform what `festival_host/<marker>` points at; on a first run the
 * link does not exist yet, so it is made by matching on name. `create_if_missing`
 * stays false — if no organisation of that name exists, that is worth an error,
 * not a new organisation invented in the shared contact graph.
 */
export async function hostOrganisationId(
  marker: string,
  name = "Festival of Trust",
): Promise<{ id: string } | { error: string }> {
  try {
    const org = await linkedOrganisation("festival_host", marker);
    return { id: org.id };
  } catch (e) {
    if (!(e instanceof FibreError) || e.status !== 404) {
      return { error: e instanceof FibreError ? e.detail : String(e) };
    }
  }
  try {
    const made = await link({
      app_entity: "festival_host",
      app_record_id: marker,
      match_on: { name },
      create_if_missing: false,
    });
    return { id: made.platform_id };
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
}

/**
 * The run for one festival, creating it if this app has not started one yet.
 *
 * `source_ref` makes creation idempotent platform-side, so a double submit or a
 * retry returns the same run rather than a second festival.
 */
export async function openRun(input: {
  sourceRef: string;
  subjectLabel: string;
  organisationId?: string;
}): Promise<{ run: FibreRun } | { error: string }> {
  if (!process.env.FIBRE_APP_KEY) return { error: "not configured" };
  try {
    const mine = await listRuns();
    const existing = mine.runs?.find((r) => r.source_ref === input.sourceRef);
    if (existing) return { run: await getRun(existing.id) };

    // Pick the festival flow by system_key, never by position. The key can see
    // every workspace flow — today that is a leadership programme and Pulse's
    // sales pipeline — and taking the first would quietly file festival plans
    // against an unrelated flow.
    const { flows } = await listFlows();
    const flow = flows?.find((f) => f.system_key === FESTIVAL_FLOW_KEY);
    if (!flow) {
      return {
        error: `no flow with system_key "${FESTIVAL_FLOW_KEY}" — seed the nine steps in Flow first`,
      };
    }
    if (flow.progression !== "open") {
      // A gated flow locks later steps and materialises due dates. The planner's
      // spec forbids both, so refusing beats silently becoming a taskmaster.
      return {
        error: `flow "${flow.name}" is ${flow.progression}; the planner needs an open flow`,
      };
    }

    const created = await startRun(flow.id, {
      subject_label: input.subjectLabel,
      source_ref: input.sourceRef,
      ...(input.organisationId ? { organisation_id: input.organisationId } : {}),
    });
    return { run: await getRun(created.id) };
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
}

export async function refreshRun(runId: string): Promise<{ run: FibreRun } | { error: string }> {
  try {
    return { run: await getRun(runId) };
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
}

export async function toggleTask(
  runId: string,
  taskId: string,
  done: boolean,
): Promise<{ run: FibreRun } | { error: string }> {
  try {
    await setTaskStatus(taskId, done ? "done" : "open");
    // Step status is derived server-side from task counts, so re-read rather
    // than recomputing it here and risking a second, divergent rule.
    return { run: await getRun(runId) };
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
}

export async function createTask(
  runId: string,
  stepKey: string,
  title: string,
): Promise<{ run: FibreRun } | { error: string }> {
  try {
    await apiAddTask(runId, title, stepKey);
    return { run: await getRun(runId) };
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
}

/** The reflection. An empty body clears it. */
export async function saveNote(
  runId: string,
  stepKey: string,
  body: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    await apiSetNote(runId, stepKey, body);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof FibreError ? e.detail : String(e) };
  }
}
