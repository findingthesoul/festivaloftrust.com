-- Festival logos: one generator collection promoted out of the browser and
-- into the database, so it is shared. The admin fills it from the shape
-- generator; a festival's organiser claims one composition, and a claimed
-- logo leaves the pool — one festival, one form, never two the same.

create table public.logo (
  id         uuid primary key default gen_random_uuid(),
  -- The generator's full form state (seed, items, fills, background), so a
  -- logo can be re-opened and edited in the tool that made it.
  form       jsonb not null,
  claimed_by uuid references public.festival(id) on delete set null,
  created_at timestamptz not null default now()
);

-- One logo per festival, one festival per logo.
create unique index logo_one_per_festival
  on public.logo (claimed_by) where claimed_by is not null;

alter table public.logo enable row level security;

-- Brand artwork: public pages draw it, so anyone may read.
create policy logo_read on public.logo for select using (true);

-- Only the workspace admin curates the collection.
create policy logo_admin_insert on public.logo
  for insert with check (public.is_admin());

-- A claimed logo is never deleted out from under its festival — release first.
create policy logo_admin_delete on public.logo
  for delete using (public.is_admin() and claimed_by is null);

-- Claiming: an unclaimed logo may be pointed at a festival you can edit.
-- Releasing: a festival's own organiser (or the admin) sets it back to null.
create policy logo_claim on public.logo
  for update using (
    public.is_admin() or claimed_by is null or public.can_edit_festival(claimed_by)
  )
  with check (
    public.is_admin() or claimed_by is null or public.can_edit_festival(claimed_by)
  );
