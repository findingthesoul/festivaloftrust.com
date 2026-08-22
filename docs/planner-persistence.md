# Planner persistence — proposal

The build prompt (§2) names TheThread.app as the backend for data, contacts and
persistence, and marks the exact entities OPEN: *"if an entity is missing,
propose it before building."* This is that proposal.

## What already exists

**Contacts do not live in The Thread.** They are platform-owned, in Fibre's
`person` table, which every app reads (`docs/fibre-vs-app-data.md`, list 1).
The Thread's own tables are `thread_thread`, `thread_enrolment`,
`thread_ticket`, `thread_certificate`, `thread_organiser` — enrolment and
ticketing, not contacts.

So "pull contacts from TheThread.app" should read as **`GET /api/v1/persons`
against the platform**. That endpoint exists. Nothing new is needed for §6.2's
contact picker beyond a UI.

## What is missing

There is no festival or plan entity anywhere. Proposed, following the
`thread_` / `pulse_` prefix convention:

```sql
-- One per festival. `marker` drives festivaloftrust.com/[marker].
create table public.planner_festival (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspace(id),
  host_org_id   uuid references public.organisation(id),
  marker        text not null,
  variation     text not null check (variation in ('communities','organisations')),
  created_by    uuid not null references public."user"(id),
  created_at    timestamptz not null default now(),
  unique (workspace_id, marker)
);

-- Nine rows per festival, one per step. Seeded on creation.
create table public.planner_step (
  festival_id   uuid not null references public.planner_festival(id) on delete cascade,
  step_id       int  not null check (step_id between 1 and 9),
  tasks         jsonb not null default '[]',   -- [{text, done}]
  note          text  not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (festival_id, step_id)
);

-- Person links, per step. Points at platform persons.
create table public.planner_step_contact (
  festival_id   uuid not null,
  step_id       int  not null,
  person_id     uuid not null references public.person(id),
  primary key (festival_id, step_id, person_id),
  foreign key (festival_id, step_id)
    references public.planner_step(festival_id, step_id) on delete cascade
);
```

Notes on the shape:

- `tasks` is `jsonb`, not a table. They are editable per festival, order
  matters, and nothing queries across them — a row per task buys nothing.
- `status` is deliberately absent. The spec derives it from tasks (§8); storing
  it would let it drift.
- No deadline, due date or `failed` column. §8 is explicit that a step is never
  overdue, and a schema that cannot express lateness cannot leak it into the UI
  later.
- Reflection notes are private to the organiser and core group (§8), so RLS on
  `planner_step` must gate on festival membership, not workspace membership.

## The blocker

None of this can be reached from an external app yet. `public.app.slug` carries
a CHECK constraint allow-listing known slugs, so registering `fot-planner`
means a platform schema migration — see `fibre-integration.md`. Until that is
resolved the planner cannot hold a Fibre app identity, and without one there is
no scoped way to write these tables.

## What is built instead

`src/lib/plan-store.ts` — the same shape, in browser local storage, behind a
narrow interface (`subscribe` / `getSnapshot` / `setPlan`). No screen touches
storage directly, so swapping in the platform is one file.

What this costs today: a plan lives in one browser, is not shared with the core
group, and is lost if site data is cleared. Acceptable for a first version;
not acceptable for a real organiser.
