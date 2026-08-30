-- ============================================================================
-- The festival's own guest book.
--
-- The platform's data wall is right to hide registration details from app
-- keys — but the registration form on this site receives name, email and
-- phone first-hand, so the festival keeps its own book of them. Readable by
-- the festival's team only; written exclusively by the server with the
-- service role at the moment of registration, so there is no public insert
-- door at all.
-- ============================================================================

create table if not exists public.festival_attendee (
  id          uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festival(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text,
  -- One row per registration attempt, however often it is retried.
  request_id  text unique,
  created_at  timestamptz not null default now()
);

alter table public.festival_attendee enable row level security;

drop policy if exists festival_attendee_read on public.festival_attendee;
create policy festival_attendee_read on public.festival_attendee
  for select using (
    exists (select 1 from public.festival f
             where f.id = festival_id and f.owner_id = auth.uid())
    or public.festival_role(festival_id) is not null
    or public.is_admin()
  );
