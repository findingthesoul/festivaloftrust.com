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
2. **Register the app** — insert `fot-planner` into `public.app` in the Fibre
   database. There is no self-registration endpoint; this is SQL today.
3. **Declare entity mappings** — from `fibre.app.json`, once per workspace.
4. **Auth** — the app needs a user-scoped Supabase JWT for the workspace.
   There are no per-app API keys yet, so the organiser signs in and the browser
   session supplies the token.
5. **Link records** — on save, `POST /apps/fot-planner/links` to bind the
   organiser to a Fibre person.
6. **Emit activity** — `fot_planner.plan.created` / `.updated` /
   `.offer.issued` onto the workspace timeline.

## What this pilot is testing

Gaps the guide already documents, and what each one costs an external app:

| Known gap | Consequence here |
|---|---|
| No per-(workspace × app) API keys | No server-to-server sync. Every write needs a signed-in user in the browser. Rules out background jobs. |
| No self-registration endpoint | Onboarding an external app needs someone with production database access. Doesn't scale past a handful. |
| No bulk linking | Initial sync is N parallel POSTs. |
| Scope enforcement not implemented | `scopes_requested` is decorative. The manifest claims four scopes; nothing checks them. A hostile app would be limited only by RLS. |
| Org mappings unsupported on `POST /links` | `festival_host` in the manifest cannot actually be linked yet. Person-only. |
| `activity_types` informational only | The API accepts any snake_case type, so a typo lands silently on the timeline. |

### Blocker found: the app catalogue is closed by a CHECK constraint

`public.app.slug` carries `app_slug_check`, an allow-list of known slugs. Every
in-family app so far (`fibre-flow`, `fibre-pulse`, …) registered itself by
dropping that constraint, inserting, and re-adding it with its own slug appended
— inside a platform migration.

So registering an app is not "an INSERT" as the guide says. It is **a schema
migration against the platform database**, which means a deploy, and means the
set of installable apps is fixed at platform build time.

For a first-party app in the monorepo that is merely awkward. For genuinely
third-party apps it is the structural blocker: nobody outside the platform team
can register one, however good the API around it is. Self-registration cannot be
built on top of this table without dropping the constraint permanently and
validating slugs some other way.


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

Manifest and schema are written. Everything past step 1 is blocked on the
workspace existing and on this project's Supabase credentials.
