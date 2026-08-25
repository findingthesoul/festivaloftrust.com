/**
 * The Fibre app-key client.
 *
 * SERVER ONLY. `FIBRE_APP_KEY` is a credential scoped to (this app x one
 * workspace); putting it in a bundle would hand every visitor the planner's
 * platform authority. Nothing here may be imported from a "use client" module —
 * the guard below turns that mistake into an immediate error rather than a
 * silent leak.
 *
 * Shapes follow the published contract in thefibre `apps/api/src/routes/app-flow.ts`,
 * which is additive-only: fields are never renamed or removed, but responses do
 * grow keys. Types here are therefore deliberately open — read what we use,
 * ignore the rest, never assert exhaustiveness.
 */

if (typeof window !== "undefined") {
  throw new Error("src/lib/fibre.ts is server-only and was imported on the client");
}

const BASE = process.env.FIBRE_API_URL ?? "https://thefibre-api.fly.dev";
const SLUG = "fot-planner";

export type StepStatus = "not_started" | "in_progress" | "done";
export type TaskStatus = "open" | "in_progress" | "done" | "cancelled";

export type FibreTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Always null on an open flow — the engine writes no due dates. */
  due_at: string | null;
  completed_at: string | null;
};

export type FibreStep = {
  key: string;
  name: string;
  description: string | null;
  kind: string;
  ordinal: number;
  /** The phase. Group on this, never on group_label. */
  group_key: string | null;
  /** Display only; may be renamed without meaning anything moved. */
  group_label: string | null;
  /** App-defined fields the platform never interprets. `{}` when unset. */
  meta: { purpose?: string; trap?: string; reflection?: string } & Record<string, unknown>;
  tasks: FibreTask[];
  note: string | null;
  /** Derived server-side from task counts — not from the cursor. */
  status: StepStatus;
};

export type FibreRun = {
  id: string;
  flow_id: string;
  person_id: string | null;
  organisation_id: string | null;
  subject_label: string | null;
  source_ref: string | null;
  status: "active" | "completed" | "withdrawn";
  entered_at: string;
  /** Where the organiser last was. Never derive step status from this. */
  current_step_key: string | null;
  steps: FibreStep[];
  unfiled_tasks: FibreTask[];
};

export class FibreError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly body: unknown,
  ) {
    super(`Fibre ${status}: ${detail}`);
  }
}

async function call<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const key = process.env.FIBRE_APP_KEY;
  if (!key) throw new Error("FIBRE_APP_KEY is not set");

  const res = await fetch(`${BASE}/api/v1${path}`, {
    method: init.method ?? "GET",
    headers: {
      authorization: `Bearer ${key}`,
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  const text = await res.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // The API answers errors as RFC 9457 problem documents.
    const p = parsed as { detail?: string; title?: string } | null;
    throw new FibreError(res.status, p?.detail ?? p?.title ?? res.statusText, parsed);
  }
  return parsed as T;
}

/** Verify the key and see what it may do. */
export const whoami = () =>
  call<{ app_slug: string; workspace_id: string; scopes: string[] }>("/apps/whoami");

export type FibreFlow = {
  id: string;
  name: string;
  description: string | null;
  lifecycle: string;
  /** 'open' is what the planner needs: every step live, no due dates written. */
  progression: "gated" | "open";
  system_key: string | null;
  current_version_id: string | null;
};

/** Note the response key is `flows`, not `items`. */
export const listFlows = () =>
  call<{ flows: FibreFlow[] }>(`/apps/${SLUG}/flow/flows`);

export const getRun = (runId: string) =>
  call<FibreRun>(`/apps/${SLUG}/flow/runs/${runId}`);

/** Note the response key is `runs`, not `items`. */
export const listRuns = () =>
  call<{ runs: FibreRun[] }>(`/apps/${SLUG}/flow/runs`);

/**
 * Start a plan. A festival is a legitimate subject — no person required.
 * `source_ref` makes creation idempotent: a retry returns the same run with
 * `created: false` rather than a duplicate.
 */
export const startRun = (
  flowId: string,
  input: { subject_label: string; organisation_id?: string; source_ref: string },
) =>
  call<{ id: string; created: boolean }>(`/apps/${SLUG}/flow/flows/${flowId}/runs`, {
    method: "POST",
    body: input,
  });

export const setTaskStatus = (taskId: string, status: TaskStatus) =>
  call<FibreTask>(`/apps/${SLUG}/flow/tasks/${taskId}`, {
    method: "PATCH",
    body: { status },
  });

/** Returns only the new id and where it was filed, not the whole task. */
export const addTask = (runId: string, title: string, stepKey?: string) =>
  call<{ id: string; step_key: string | null }>(`/apps/${SLUG}/flow/runs/${runId}/tasks`, {
    method: "POST",
    body: { title, ...(stepKey ? { step_key: stepKey } : {}) },
  });

/** The reflection. An empty body clears it. */
export const setNote = (runId: string, stepKey: string, body: string) =>
  call<{ body: string }>(
    `/apps/${SLUG}/flow/runs/${runId}/steps/${encodeURIComponent(stepKey)}/note`,
    { method: "PUT", body: { body } },
  );

/**
 * Bind one of our records to a platform person or organisation.
 *
 * `create_if_missing` writes a real contact into the workspace's shared graph,
 * visible to every member — it is not a sandbox. Left off by default so that
 * only a deliberate caller creates people.
 */
export const link = (input: {
  app_entity: "festival_organiser" | "festival_host";
  app_record_id: string;
  /** Email is the handle for persons; domain, then name, for organisations. */
  match_on: Record<string, string>;
  create_if_missing?: boolean;
}) =>
  call<{
    ok: boolean;
    app_record_id: string;
    platform_id: string;
    platform_entity: string;
    action: "linked" | "created";
  }>(`/apps/${SLUG}/links`, {
    method: "POST",
    body: { create_if_missing: false, ...input },
  });

export type FibreOrganisation = { id: string; name: string; domain: string | null };

/**
 * Resolve one of our own record ids to the platform organisation it is linked
 * to. 404s until the link exists.
 *
 * This is why the app holds no platform UUIDs: we say "festival_host `fot`",
 * the platform says which organisation that is. Same reasoning as steps being
 * addressed by key.
 */
export const linkedOrganisation = (appEntity: string, appRecordId: string) =>
  call<FibreOrganisation>(
    `/apps/${SLUG}/organisations/${encodeURIComponent(appEntity)}/${encodeURIComponent(appRecordId)}`,
  );

/**
 * Append a timeline event.
 *
 * Append-only and permanent: no updates, no deletes, enforced by a database
 * trigger. A wrong subject line stays on that person's timeline forever, and an
 * activity row also pins the person against hard deletion. Step completion is
 * already queryable from the run — reserve this for moments a workspace member
 * should actually see.
 */
export const recordActivity = (input: {
  type:
    | "fot_planner_plan_created"
    | "fot_planner_plan_updated"
    | "fot_planner_offer_issued";
  subject: string;
  person_id?: string;
  organisation_id?: string;
}) => call<{ id: string }>("/activities", { method: "POST", body: input });
