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
  listFlows,
  listRuns,
  setNote as apiSetNote,
  setTaskStatus,
  startRun,
  whoami,
  FibreError,
  type FibreRun,
} from "@/lib/fibre";

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
    const existing = mine.items?.find((r) => r.source_ref === input.sourceRef);
    if (existing) return { run: await getRun(existing.id) };

    // Only one workspace flow is expected; if the flow is not seeded yet there
    // is nothing to run and saying so beats starting a run against the wrong one.
    const flows = await listFlows();
    const flow = flows.items?.[0];
    if (!flow) return { error: "no flow is available to this app yet" };

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
