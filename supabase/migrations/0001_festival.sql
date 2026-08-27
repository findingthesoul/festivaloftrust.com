-- ============================================================================
-- Festivals.
--
-- Small on purpose. Flow owns the plan — the nine steps, their tasks, notes and
-- status all live there, and duplicating any of it here would give the same
-- fact two homes and let them drift. This table answers only the questions Flow
-- cannot: which festival is at which address, who may open it, and which run it
-- corresponds to.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.festival (
  id                 uuid primary key default gen_random_uuid(),

  -- The public address: festivaloftrust.com/[marker]. Changeable, so nothing
  -- durable may be derived from it.
  marker             text not null unique
                       check (marker ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'),

  name               text not null,

  -- The Fibre run this festival is planned in. The run's source_ref is this
  -- row's id, which is why identity and address are separate: renaming the
  -- marker must not create a second run.
  fibre_run_id       uuid,
  fibre_workspace_id uuid,
  -- The hosting organisation, as a Fibre organisation id. Not a foreign key:
  -- it lives in another database.
  host_org_id        uuid,

  owner_id           uuid not null default auth.uid(),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists festival_owner_idx on public.festival (owner_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists festival_touch on public.festival;
create trigger festival_touch
  before update on public.festival
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Access.
--
-- The anon key ships in the browser bundle, so without these policies every
-- festival — and every organiser against it — would be world-readable and
-- world-writable.
--
-- An organiser sees their own festivals and nobody else's. The public page at
-- /[marker] does not read through this: it is served by the app's own server,
-- which chooses what to expose.
-- ---------------------------------------------------------------------------
alter table public.festival enable row level security;

drop policy if exists festival_select_own on public.festival;
create policy festival_select_own on public.festival
  for select using (owner_id = auth.uid());

drop policy if exists festival_insert_own on public.festival;
create policy festival_insert_own on public.festival
  for insert with check (owner_id = auth.uid());

drop policy if exists festival_update_own on public.festival;
create policy festival_update_own on public.festival
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- No delete policy. A festival with a Fibre run behind it cannot be undone from
-- here — the app surface has no way to withdraw a run — so deleting the row
-- would orphan the run rather than remove the festival.
