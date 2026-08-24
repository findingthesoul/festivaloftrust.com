# Briefing — building the planner on The Fibre

_Written 2026-08-24 from the platform side, against The Fibre v0.17.0 /
Flow 1.13.0. Every API claim below was checked against the running code or the
live API; where something is relayed rather than verified it says so._

## What you are building

The Festival of Trust planner: a tool that walks an organiser through nine
fixed steps — Listen → Gather → Align → Connect → Design → Invite → Host →
Harvest → Grow. Each step has suggested tasks, a "watch for" trap, a reflection
question, a free-text note, and linked people.

It exists at `~/Projects/festivaloftrust.com` (`/plan`), saving to browser local
storage. That was always a placeholder.

## The two decisions that shape everything

**1. The nine steps run on Fibre Flow. The planner is a presentation layer.**
You do not model steps, tasks or completion. Flow does. You render.

**2. The planner stays external** — its own repo, talking to the platform over
the API with an app key, exactly as a genuine third party would. That is
deliberately more work than embedding it in the Fibre monorepo, and it is the
point: the planner is the live proof that Fibre can host outside apps, and it
keeps finding what is missing. Three platform releases (v0.15.0, v0.16.0,
v0.17.0) exist because this app needed something.

## The rule that must not be broken

The planner's own spec is explicit, and it is the opposite of what a state
machine normally does:

> Order is fixed 1 to 9, but any step can be opened at any time. **Do not lock
> later steps.** A step is never 'failed' or overdue. **No deadlines, no
> nagging. This is a companion, not a taskmaster.**

You do not have to work around Flow to get this. A flow carries a
`progression` of `gated` or `open`. On an **open** flow every step's tasks
exist from the moment a run is created, and **no due dates are written at
all** — a task template's `due_days_after_entry` is ignored outright. The
engine is structurally incapable of telling someone a festival step is late.
Seed the festival flow as `open` and the rule enforces itself.

---

## Read this before you write code: three things that will bite you

### 1. Your manifest's activity types are invalid and every write will 400

`fibre.app.json` currently declares:

```
fot_planner.plan.created
fot_planner.plan.updated
fot_planner.offer.issued
```

The platform's activity type must match `^[a-z][a-z0-9_]{1,63}$` — **snake_case
only, no dots**. All three fail. This is not a warning; `POST /api/v1/activities`
rejects them with a 400 before anything else happens, so the planner cannot
write a single activity as it stands.

Worse, since v0.14.0 the API also checks the type against what your manifest
declared. So a manifest full of dotted types is a closed loop: the declared
types are unusable, and undeclared ones are refused.

**Fix before registering:** rename to `fot_planner_plan_created`,
`fot_planner_plan_updated`, `fot_planner_offer_issued`. Registering with the
broken names and fixing later means a re-registration, because the manifest is
stored at registration.

### 2. Activity is append-only, and that is permanent

No updates, no deletes, enforced by a database trigger — not by convention. A
typo'd subject line is on that person's timeline forever, and corrections are
new rows. Two consequences:

- Do not use activity as a progress log you intend to tidy up. Step
  completion already lives in Flow and is queryable; activity is for the
  handful of moments a workspace member should see on a contact's timeline.
- An activity row also **pins the person it references** — they can no longer
  be hard-deleted, only soft-deleted. Be sparing about writing activity
  against people you created speculatively.

### 3. `POST /links` with `create_if_missing` creates real contacts

A link call that doesn't match creates a genuine `person` or `organisation` row
in the workspace's real contact graph, visible to every member. It is not a
sandbox. Pass `create_if_missing: false` while you are finding your feet, and
turn it on when the flow is deliberate.

---

## What the platform gives you

Base URL `https://thefibre-api.fly.dev` (or `http://localhost:8080`).
Auth: `Authorization: Bearer fibre_ak_…`. **No `X-App-ID` header** — the key
already says which app you are. Slug: `fot-planner`.

| Method + path | Scope | Purpose |
|---|---|---|
| `GET /api/v1/apps/whoami` | — | Verify the key, see its scopes |
| `GET /api/v1/apps/fot-planner/flow/flows` | `read:flows` | Which flows can I run? |
| `GET /api/v1/apps/fot-planner/flow/flows/:id` | `read:flows` | The published shape — steps in order + task templates |
| `POST /api/v1/apps/fot-planner/flow/flows/:id/runs` | `write:flow_runs` | Start a plan |
| `GET /api/v1/apps/fot-planner/flow/runs` | `read:flows` | This app's runs |
| `GET /api/v1/apps/fot-planner/flow/runs/:id` | `read:flows` | **The main read** — everything in one call |
| `POST /api/v1/apps/fot-planner/flow/runs/:id/move` | `write:flow_runs` | `{"step_key":"grow"}` — jump anywhere |
| `POST /api/v1/apps/fot-planner/flow/runs/:id/tasks` | `write:flow_runs` | Add a task, optionally under a `step_key` |
| `PATCH /api/v1/apps/fot-planner/flow/tasks/:id` | `write:flow_runs` | `{"status":"done"}` — check off / back on |
| `PUT /api/v1/apps/fot-planner/flow/runs/:id/steps/:step_key/note` | `write:flow_runs` | The reflection; empty body clears it |
| `GET /api/v1/apps/fot-planner/flow/runs/:id/steps/:step_key/note` | `read:flows` | Read it back |
| `POST /api/v1/apps/fot-planner/links` | `write:persons` / `write:organisations` | Bind an organiser to a person, a host to an org |
| `POST /api/v1/apps/fot-planner/links:bulk` | same | Up to 500 at once |
| `POST /api/v1/activities` | `write:activities` | Timeline event: type + subject only |

Every path above is written in full. Everything is mounted under `/api/v1` —
dropping that prefix 404s, and it is the first thing an integrator copies.

### Starting a run

```json
POST /api/v1/apps/fot-planner/flow/flows/{FLOW_ID}/runs
{
  "organisation_id": "<host org uuid, optional>",
  "subject_label": "Festival of Trust — Athens",
  "source_ref": "<your own plan id>"
}
```

A run needs **no person** — a festival is a legitimate subject. Pass
`source_ref` and creation is idempotent: a retry returns the same run
(`{"id": "…", "created": false}`) rather than a duplicate.

### Reading a run — the shape you render

```jsonc
{
  "id": "…", "flow_id": "…",
  "person_id": null, "organisation_id": "…", "subject_label": "…",
  "source_ref": "…", "status": "active", "entered_at": "…",
  "current_step_key": "listen",   // where they last were; IGNORE for status
  "steps": [
    {
      "key": "listen", "name": "Listen", "description": "…",
      "kind": "entry", "ordinal": 0,
      "group_key": "orientation",        // the phase — group on this
      "group_label": "Orientation",      // display only; may be renamed
      "meta": {                          // your fields, verbatim; {} when unset
        "purpose": "…", "trap": "…", "reflection": "…"
      },
      "tasks": [
        { "id": "…", "title": "…", "description": null,
          "status": "open", "due_at": null, "completed_at": null }
      ],
      "note": "What did you hear that you did not expect?",
      "status": "not_started"            // not_started | in_progress | done
    }
    // …all nine, always, from the moment the run is created
  ],
  "unfiled_tasks": []
}
```

**Per-step `status` is derived server-side from task counts, not from the
cursor.** None done → `not_started`, some → `in_progress`, all → `done`. That
is exactly the planner's own rule. Do not reimplement it, and do not derive
status from `current_step_key`.

`due_at` is always `null` on an open flow. Nothing to render, nothing to warn
about.

### Where your three descriptions live (new in v0.17.0)

`flow_step` offers one `description`. The planner needs three — purpose, trap,
reflection — so a step now carries a `meta` object for app-defined fields the
platform never interprets. It comes back as `{}` when unset, so
`step.meta.purpose` needs no guard.

The three phases have a home too: `group_key` / `group_label`. Steps sharing a
`group_key` belong together in ordinal order. **Group on `group_key`, never on
`group_label`** — the label is a display string and renaming it must not
reshuffle your UI.

Both are set by whoever authors the flow inside Flow (the step inspector has
fields for them). You read them; you cannot write them.

### Rules that hold everywhere

- Steps are addressed by **`key`**, never uuid.
- You see **only your own runs**. Every route filters on `source_app` — other
  apps' runs, and runs a person started in Flow's own UI, are invisible.
- **You cannot author a flow.** There is no `write:flows` scope, by design.
  Steps, transitions, `meta` and the self-paced setting belong to the humans in
  Flow.
- The `/api/v1/apps/*` surface is **additive-only**: a shipped response key is
  permanent, asserted key by key in
  `thefibre/apps/api/scripts/verify-external-app.mjs`. Platform releases will
  not break you. **Tolerate unknown fields** — responses will grow keys you
  have not seen.

---

## The planner repo

`~/Projects/festivaloftrust.com` — Next.js, its own Supabase.

**The seam is already cut.** `src/lib/plan-store.ts` was deliberately written
as an external store so the backend could be swapped; its header says *"When
the platform entities land, `read` and `persist` change and no screen touches
storage."* That is the file to rewrite. Screens should not need to change.

- `src/lib/festival-plan.ts` — the nine steps as plain data (`STEPS`), phases,
  colours.
- `src/lib/plan-state.ts` — the state shape.
- `src/app/plan` — the UI.
- `fibre.app.json` — the manifest. See blocker 1 above; also its
  `festival_host` description still says org links are unimplemented, which
  has been false since v0.14.0.
- `docs/fibre-integration.md` — the planner's own view of the integration.

### Two content warnings

1. **The step copy in `festival-plan.ts` is placeholder.** The spec sources
   tasks, traps and reflections from "manual documents A2", which are not on
   this machine. Do not treat it as approved copy, and do not seed a real flow
   from it.
2. **The phase colours are unsettled.** `festival-plan.ts` records that the
   three spec hexes do not appear in the brand artwork and carries a
   `brandAlternative` beside each. A human has to choose.

---

## What is blocked, and on whom

**Sjoerd, not code:**

1. Create the Festival of Trust **workspace** at thefibre.app — it is a signup,
   so a human does it.
2. Find the real **step copy** ("manual documents A2"). The nine steps cannot
   be seeded as a real flow until it exists.
3. Decide the **phase colours**.

**Then, in order:**

4. Fix the activity types in `fibre.app.json` (blocker 1), then register
   `fot-planner` via `POST /api/v1/apps/register`, get it approved and
   activated, and mint a key with the flow scopes.
5. Seed the nine steps as a workspace flow — `progression: 'open'`, a
   `system_key`, `group_key`/`group_label` for the three phases, and
   purpose/trap/reflection in each step's `meta`. Follow the `pulse_pipeline`
   precedent in the Fibre repo.
6. Rewrite `plan-store.ts` against the API above.

**Steps 4 and 6 do not have to wait.** Build and test them against a throwaway
flow with placeholder copy; only step 5 genuinely needs the real content.

### Still open on the platform (none block starting)

- **The communities/organisations variation** — a toggle that swaps a subset of
  suggested tasks and some copy. `docs/brief-flow-as-planner-engine.md` gap 5,
  and the brief itself says it may not belong in Flow at all. It needs a design
  decision before any code, so keep the variation in the planner for now.
- **The Thread has no app-key surface**, so turning a festival into a public
  page with tickets and enrolment is not reachable yet. Same shape as the Flow
  work, new scope pair, when it is wanted.
- **No curator-data write API**, so the planner cannot annotate a person with
  its own fields. Fibre build-plan item 9a.

---

## Reading list, in order

1. `thefibre/docs/building-on-the-fibre.md` — **the contract.** §1 the data
   wall, §2 the rules, §5.4 Flow, §6 stability. Read §1 and §2 even if you skip
   the rest.
2. `thefibre/docs/brief-flow-as-planner-engine.md` — why Flow, and the status
   table of what shipped when.
3. `festivaloftrust.com/docs/fibre-integration.md` — the planner's own view.
4. `thefibre/apps/api/src/routes/app-flow.ts` — the surface itself. Read the
   CONTRACT block at the top before changing anything there.
5. `thefibre/apps/api/scripts/verify-external-app.mjs` step 7 — a working
   example of every call above, and the fastest way to see the real response
   shapes.
