# Festival planner as a Fibre app — external-app pilot

The planner is the first app to integrate with The Fibre from **outside** the
monorepo. Shipping it is half the point; the other half is finding out where
the external-app path breaks, so the answer to "can Fibre host third-party
apps?" is evidence rather than intent.

Reference: `thefibre/docs/third-party-app-guide.md`.

## Where data lives

Two databases, deliberately.

| | Fibre (platform Supabase) | Festival of Trust (this Supabase) |
|---|---|---|
| Owns | persons, organisations, workspaces, activities | festival plans |
| Written by | the platform | this app |
| Key table | `person`, `organisation`, `activity` | `festival_plan` |

They are joined by `festival_plan.organiser_person_id`, a Fibre person UUID
obtained through the platform's `app_record_link` API. It is **not** a foreign
key — it points into a different database, and pretending otherwise would be a
lie the schema can't enforce.

The plan payload is stored as `jsonb` verbatim. The tool versions its own state
(currently `version: 2`) and gains fields often; only the handful we filter,
sort or link on are promoted to columns.

## Integration steps

1. **Workspace** — create the Festival of Trust workspace at thefibre.app.
   This is a signup, so it has to be done by a human.
2. **Register the app** — `POST /api/v1/apps/register` with the manifest. No
   credential needed; an app registering itself has none yet. An admin then
   approves it at `/admin/apps` and activates it on the workspace.
3. **Declare entity mappings** — from `fibre.app.json`, once per workspace.
4. **Auth** — mint an `app_key` scoped to (this app × the workspace). It
   carries the app's authority bounded by the scopes the manifest asked for,
   works server-to-server, and does not need a signed-in browser.
5. **Link records** — on save, `POST /apps/fot-planner/links` to bind the
   organiser to a Fibre person, and the host community to an organisation.
6. **Emit activity** — `fot_planner.plan.created` / `.updated` /
   `.offer.issued` onto the workspace timeline.
7. **Run the nine steps on Fibre Flow** — see below.

## What this pilot found

It found them by hitting them, which was the point. The Fibre's own account is
`thefibre/docs/brief-external-apps.md`; all of these are now closed.

| Gap this pilot hit | Closed by |
|---|---|
| No per-(workspace × app) API keys — every write needed a signed-in browser, ruling out background sync | `app_key`, v0.14.0 |
| No self-registration endpoint — onboarding needed production database access | `POST /apps/register` + an admin review queue, v0.14.0 |
| No bulk linking — initial sync was N parallel POSTs | `POST /links:bulk`, v0.14.0 |
| Scope enforcement not implemented — `scopes_requested` was decorative | Enforced per route, default-deny, v0.14.0 |
| Org mappings unsupported on `POST /links` — `festival_host` could not be linked | Organisation links, v0.14.0 |
| `activity_types` informational only — a typo landed silently on an append-only timeline | Validated against the manifest, v0.14.0 |
| **The app catalogue was closed by a CHECK constraint** — registering an app was a schema migration against the platform database, so the set of installable apps was fixed at build time | Slugs validated by format; the guard moved onto the row as `pending → approved → suspended`, v0.14.0 |
| Flow unreachable by an app key — no flow scope, no flow route on the allow-list | `read:flows` + `write:flow_runs` and the `/apps/:slug/flow/*` surface, v0.15.0 |

## The nine steps run on Fibre Flow

Decided 2026-08-22: the planner does **not** own a bespoke steps-and-tasks
schema. Flow is Fibre's sequence engine, and the nine steps are a flow like any
other — `thefibre/docs/brief-flow-as-planner-engine.md` has the reasoning.

What that means here:

- A festival plan is a **flow run**. It needs no person: pass the host
  organisation and a `subject_label`, and give it our own plan id as
  `source_ref` so creating a run is idempotent.
- The suggested tasks per step are Flow's step default tasks; checking one off
  is `PATCH /apps/fot-planner/flow/tasks/:id`.
- The reflection note is one body per (run, step), rewritten in place.
- Reading a run returns all nine steps with tasks, note, and a derived status
  per step — `not_started` / `in_progress` / `done` from the task counts. The
  planner's own status rule falls straight out; nothing to compute here.
- **Nothing locks.** `POST /flow/runs/:id/move` jumps to any step with no gate
  and no ordering, and tasks an app creates carry no due date. The engine
  cannot express lateness at us, which is the behaviour the spec demands: a
  companion, not a taskmaster.

Two things still to come from the platform side before this is fully usable:
`flow_task.step_id` (a task we add is not yet filed under a step) and Flow's
open progression mode (only the entry step's tasks materialise at run
creation). Both are queued as build-plan item 1b.

The Thread is the next one after that — turning a festival into a public page
with tickets and enrolment. Same app-key shape, a new scope pair.

## Open questions this raised

- **Workspace-scoped sharing.** `festival_plan` RLS is owner-scoped, because
  this database cannot see Fibre workspace membership. For a plan to be visible
  to a whole workspace, either the JWT must carry workspace claims this app can
  read, or reads must go through the Fibre API rather than direct Supabase. This
  is the sharpest architectural question in the pilot.
- **Where identity lives.** The organiser fields are captured in the planner and
  pushed to Fibre. If Fibre is the identity system, the tool arguably ought to
  read persons from Fibre first and let the organiser pick, rather than typing
  a name and email that then need reconciling.
- **Two Supabase projects, two bills.** Justified while the app is external.
  Worth revisiting if it ever moves in-monorepo.

## Status

Manifest and schema are written, and the platform side is no longer the
blocker: registration, approval, keys, scopes, links (person *and*
organisation), activity and Flow are all live and verified end-to-end by
`thefibre/apps/api/scripts/verify-external-app.mjs`.

What remains here: create the Festival of Trust workspace (a signup, so a
human does it), register through the API, mint a key, and replace the
local-storage `/plan` with calls against a Flow run.
