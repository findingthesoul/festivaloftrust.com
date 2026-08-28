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
    // Two error shapes in play: app-key auth failures are RFC 9457 problem
    // documents, everything else answers { error }. Reading only the first
    // turned "task not found" into a bare "Not Found".
    const p = parsed as
      | { detail?: string; title?: string; error?: unknown }
      | null;
    const fromError =
      typeof p?.error === "string"
        ? p.error
        : p?.error
          ? JSON.stringify(p.error)
          : undefined;
    throw new FibreError(
      res.status,
      p?.detail ?? fromError ?? p?.title ?? res.statusText,
      parsed,
    );
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

/**
 * Connect a person to an organisation.
 *
 * Both sides are named by our own record ids, already linked — the platform
 * resolves them. Idempotent: an existing membership comes back with
 * `created: false` rather than a second one.
 */
export const recordMembership = (input: {
  person: { app_entity: string; app_record_id: string };
  organisation: { app_entity: string; app_record_id: string };
  title?: string;
  is_primary?: boolean;
}) =>
  call<{ id: string; person_id: string; org_id: string; created: boolean }>(
    `/apps/${SLUG}/memberships`,
    { method: "POST", body: input },
  );

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
    | "fot_planner_offer_issued"
    | "fot_planner_festival_published";
  subject: string;
  person_id?: string;
  organisation_id?: string;
}) => call<{ id: string }>("/activities", { method: "POST", body: input });

// ---------------------------------------------------------------------------
// The Thread — the festival's public page and who registered.
//
// A programme and its public page are created together because neither is
// useful alone. Publishing is idempotent on `source_ref`, the same way runs
// are, so a retry returns the thread that already exists.
// ---------------------------------------------------------------------------

export type FibreThread = {
  id: string;
  program_id: string;
  slug: string;
  title: string;
  status: "draft" | "active" | "completed" | "archived";
  starts_on: string | null;
  cover_url: string | null;
  is_public_listed: boolean;
  capacity: number | null;
  public_url: string | null;
};

/**
 * No `organiser_person_id`: the workspace publishes under its own organiser,
 * which the platform derives from whoever administers it.
 *
 * A festival's organiser could never be named here anyway — they sign in to
 * this app's database, so they have no Fibre account, and The Thread requires
 * one so that a public page always has a real human behind it. Festival of
 * Trust is that human: we vet the festival and put our name to the page. Who
 * actually runs it is on the festival, in the run and on their timeline.
 */
export const publishThread = (input: {
  title: string;
  format: "event" | "journey";
  slug: string;
  intention?: string | null;
  starts_on?: string | null;
  source_ref: string;
}) =>
  call<FibreThread & { created: boolean }>(`/apps/${SLUG}/thread/threads`, {
    method: "POST",
    body: input,
  });

export const getThread = (id: string) =>
  call<FibreThread>(`/apps/${SLUG}/thread/threads/${id}`);

export const listThreads = () =>
  call<{ threads: FibreThread[] }>(`/apps/${SLUG}/thread/threads`);

/**
 * The fields shipped in v0.18.12 alongside the ones that were always here.
 * Each mirrors its column: a NOT NULL column is optional but not nullable, so
 * a null is refused by the platform rather than reaching Postgres.
 *
 * `registration_fields` is deliberately absent. It shapes what is asked of a
 * registrant, and the data wall exists so an app does not reach into that.
 */
export const patchThread = (
  id: string,
  patch: Partial<{
    title: string;
    intention: string | null;
    starts_on: string | null;
    ends_on: string | null;
    cover_url: string | null;
    is_public_listed: boolean;
    capacity: number | null;
    status: "draft" | "active" | "completed" | "archived";
    timezone: string;
    language: "en" | "nl" | "es" | "pt" | "de";
    requires_approval: boolean;
    public_interaction: "page" | "popup";
    share_participants_public: boolean;
    share_participants_participants: boolean;
  }>,
) =>
  call<FibreThread>(`/apps/${SLUG}/thread/threads/${id}`, {
    method: "PATCH",
    body: patch,
  });

/**
 * Who registered.
 *
 * The response carries the person and their payment status and nothing else —
 * the registration form answers and every payment instrument stay behind the
 * data wall, by the platform's choice rather than ours.
 */
export type FibreEnrolment = {
  id: string;
  enrolment_id: string;
  person_id: string;
  payment_status: string;
  created_at: string;
};

export const listEnrolments = (threadId: string) =>
  call<{ enrolments: FibreEnrolment[] }>(
    `/apps/${SLUG}/thread/threads/${threadId}/enrolments`,
  );
