-- Festival planner storage.
--
-- Lives in the festivaloftrust Supabase project, not in Fibre's. Fibre owns
-- people and organisations; this owns plans. The two are joined by
-- organiser_person_id, which is a Fibre person UUID written through the
-- platform's app_record_link API — deliberately not a foreign key, since it
-- points into a different database.

create extension if not exists "pgcrypto";

create table if not exists public.festival_plan (
  id                  uuid primary key default gen_random_uuid(),

  -- Fibre identifiers. Not FKs: they live in the platform database.
  workspace_id        uuid not null,
  organiser_person_id uuid,
  host_org_id         uuid,

  -- Promoted out of the snapshot only because we filter, sort or link on them.
  festival_name       text,
  festival_date       date,
  organiser_email     text,

  -- The planner's own state, stored verbatim. The tool versions its own
  -- payload (currently version 2) and gains fields regularly; shredding it
  -- into columns would mean a migration every time the tool changes.
  snapshot            jsonb not null,

  owner_id            uuid not null default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists festival_plan_workspace_idx on public.festival_plan (workspace_id);
create index if not exists festival_plan_owner_idx     on public.festival_plan (owner_id);
create index if not exists festival_plan_organiser_idx on public.festival_plan (organiser_person_id);

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists festival_plan_touch on public.festival_plan;
create trigger festival_plan_touch
  before update on public.festival_plan
  for each row execute function public.touch_updated_at();

-- RLS. The anon key is public by definition (it ships in the browser bundle),
-- so without these policies every plan — including organiser names, emails and
-- phone numbers — would be world-readable and world-writable.
alter table public.festival_plan enable row level security;

drop policy if exists festival_plan_select_own on public.festival_plan;
create policy festival_plan_select_own on public.festival_plan
  for select using (owner_id = auth.uid());

drop policy if exists festival_plan_insert_own on public.festival_plan;
create policy festival_plan_insert_own on public.festival_plan
  for insert with check (owner_id = auth.uid());

drop policy if exists festival_plan_update_own on public.festival_plan;
create policy festival_plan_update_own on public.festival_plan
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists festival_plan_delete_own on public.festival_plan;
create policy festival_plan_delete_own on public.festival_plan
  for delete using (owner_id = auth.uid());

-- Note: this is owner-scoped, not workspace-scoped. Sharing a plan across a
-- workspace needs the caller's Fibre workspace membership, which this database
-- cannot see. That is a genuine open question for the pilot — see
-- docs/fibre-integration.md.
