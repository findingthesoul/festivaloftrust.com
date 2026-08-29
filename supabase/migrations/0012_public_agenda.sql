-- ============================================================================
-- The public agenda, held here while The Thread grows its own.
--
-- Organisers write the day as items — a title and a description each — and a
-- switch on the festival decides whether the event page shows them. The Thread
-- is building an agenda of its own; when it lands, these items are what gets
-- carried over, the same way the event settings already travel.
--
-- Reading follows the festival: whoever may see the festival may see its
-- agenda, which makes it public exactly when the festival is. Writing follows
-- editing: the owner, an organiser-role collaborator, an admin.
-- ============================================================================

alter table public.festival
  add column if not exists show_public_agenda boolean not null default false;

-- "May edit the festival" existed only spelled out inside policies; the
-- agenda needs it three times, so it gets a name.
create or replace function public.can_edit_festival(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.festival f
                  where f.id = fid and f.owner_id = auth.uid())
      or public.festival_role(fid) = 'organiser'
      or public.is_admin();
$$;

create table if not exists public.festival_agenda_item (
  id          uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festival(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  description text,
  -- Explicit order, because a programme is an order: 09:00 before 11:00,
  -- whatever moment each row happened to be typed in.
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists festival_agenda_item_festival
  on public.festival_agenda_item (festival_id, position, created_at);

alter table public.festival_agenda_item enable row level security;

drop policy if exists festival_agenda_read on public.festival_agenda_item;
create policy festival_agenda_read on public.festival_agenda_item
  for select using (public.can_see_festival(festival_id));

drop policy if exists festival_agenda_insert on public.festival_agenda_item;
create policy festival_agenda_insert on public.festival_agenda_item
  for insert with check (public.can_edit_festival(festival_id));

drop policy if exists festival_agenda_update on public.festival_agenda_item;
create policy festival_agenda_update on public.festival_agenda_item
  for update using (public.can_edit_festival(festival_id))
  with check (public.can_edit_festival(festival_id));

drop policy if exists festival_agenda_delete on public.festival_agenda_item;
create policy festival_agenda_delete on public.festival_agenda_item
  for delete using (public.can_edit_festival(festival_id));
