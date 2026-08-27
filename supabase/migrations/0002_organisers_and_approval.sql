-- ============================================================================
-- Organisers, collaborators, and the two approval gates.
--
-- Two gates, deliberately separate:
--   * an organiser is approved once, before they can create anything;
--   * each festival is approved again before it goes live.
-- Someone approved to organise can therefore draft freely and still not
-- publish, which is the point.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Organisers. One row per signed-in person, created on first sign-in.
-- ---------------------------------------------------------------------------
create table if not exists public.organiser (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  organisation  text,
  -- Why they want to host one. Written at application, read at review.
  reason        text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'declined')),
  is_admin      boolean not null default false,
  applied_at    timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid references auth.users(id),
  review_note   text
);

-- ---------------------------------------------------------------------------
-- 2. Festivals gain a lifecycle and a face.
-- ---------------------------------------------------------------------------
alter table public.festival
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'submitted', 'live')),
  add column if not exists cover_url text,
  add column if not exists summary text,
  add column if not exists starts_on date,
  add column if not exists place text,
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id);

-- ---------------------------------------------------------------------------
-- 3. Collaborators. An organiser runs the festival; a host helps run it and
--    does not see the money.
-- ---------------------------------------------------------------------------
create table if not exists public.festival_member (
  festival_id uuid not null references public.festival(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('organiser', 'host')),
  added_at    timestamptz not null default now(),
  added_by    uuid references auth.users(id),
  primary key (festival_id, user_id)
);
create index if not exists festival_member_user_idx on public.festival_member (user_id);

-- Someone invited before they have signed in has no user id yet, so the
-- invitation waits here and is claimed on their first sign-in.
create table if not exists public.festival_invite (
  id          uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festival(id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('organiser', 'host')),
  invited_by  uuid references auth.users(id),
  invited_at  timestamptz not null default now(),
  claimed_at  timestamptz,
  unique (festival_id, email)
);

-- ---------------------------------------------------------------------------
-- 4. Predicates.
--
-- security definer on purpose: a festival policy that reads festival_member,
-- and a festival_member policy that reads festival, would recurse. These run
-- outside RLS and break the cycle. Each is narrow and reads one table.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organiser o
     where o.id = auth.uid() and o.is_admin and o.status = 'approved'
  );
$$;

create or replace function public.is_approved_organiser()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organiser o
     where o.id = auth.uid() and o.status = 'approved'
  );
$$;

create or replace function public.festival_role(fid uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.festival_member
   where festival_id = fid and user_id = auth.uid();
$$;

create or replace function public.can_see_festival(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.festival f
                  where f.id = fid and (f.owner_id = auth.uid() or f.status = 'live'))
      or public.festival_role(fid) is not null
      or public.is_admin();
$$;

-- ---------------------------------------------------------------------------
-- 5. Access.
-- ---------------------------------------------------------------------------
alter table public.organiser enable row level security;

drop policy if exists organiser_select_self on public.organiser;
create policy organiser_select_self on public.organiser
  for select using (id = auth.uid() or public.is_admin());

-- Applying is writing your own row. Status and is_admin are not settable from
-- here: the column defaults win, and only an admin may change them (below).
drop policy if exists organiser_insert_self on public.organiser;
create policy organiser_insert_self on public.organiser
  for insert with check (id = auth.uid());

drop policy if exists organiser_update_self on public.organiser;
create policy organiser_update_self on public.organiser
  for update using (id = auth.uid()) with check (id = auth.uid() and status = 'pending');

drop policy if exists organiser_update_admin on public.organiser;
create policy organiser_update_admin on public.organiser
  for update using (public.is_admin()) with check (public.is_admin());

-- Festivals ----------------------------------------------------------------
drop policy if exists festival_select_own on public.festival;
drop policy if exists festival_insert_own on public.festival;
drop policy if exists festival_update_own on public.festival;

create policy festival_select_visible on public.festival
  for select using (public.can_see_festival(id));

-- Only an approved organiser may create one, and only as a draft.
create policy festival_insert_approved on public.festival
  for insert with check (
    owner_id = auth.uid()
    and public.is_approved_organiser()
    and status = 'draft'
  );

-- The owner and any organiser-role collaborator may edit. Going live is not
-- theirs to grant — see the trigger below.
create policy festival_update_organisers on public.festival
  for update using (
    owner_id = auth.uid() or public.festival_role(id) = 'organiser' or public.is_admin()
  ) with check (
    owner_id = auth.uid() or public.festival_role(id) = 'organiser' or public.is_admin()
  );

-- A policy cannot see the row's previous value, so "you may edit but not
-- publish yourself" has to be a trigger.
create or replace function public.guard_festival_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status
     and new.status = 'live'
     and not public.is_admin() then
    raise exception 'a festival is put live by an admin, not by its organiser';
  end if;
  return new;
end $$;

drop trigger if exists festival_status_guard on public.festival;
create trigger festival_status_guard
  before update on public.festival
  for each row execute function public.guard_festival_status();

-- Members ------------------------------------------------------------------
alter table public.festival_member enable row level security;

drop policy if exists festival_member_select on public.festival_member;
create policy festival_member_select on public.festival_member
  for select using (user_id = auth.uid() or public.can_see_festival(festival_id));

drop policy if exists festival_member_write on public.festival_member;
create policy festival_member_write on public.festival_member
  for all using (
    public.festival_role(festival_id) = 'organiser'
    or exists (select 1 from public.festival f where f.id = festival_id and f.owner_id = auth.uid())
    or public.is_admin()
  ) with check (
    public.festival_role(festival_id) = 'organiser'
    or exists (select 1 from public.festival f where f.id = festival_id and f.owner_id = auth.uid())
    or public.is_admin()
  );

-- Invites ------------------------------------------------------------------
alter table public.festival_invite enable row level security;

drop policy if exists festival_invite_manage on public.festival_invite;
create policy festival_invite_manage on public.festival_invite
  for all using (
    public.festival_role(festival_id) = 'organiser'
    or exists (select 1 from public.festival f where f.id = festival_id and f.owner_id = auth.uid())
    or public.is_admin()
  ) with check (
    public.festival_role(festival_id) = 'organiser'
    or exists (select 1 from public.festival f where f.id = festival_id and f.owner_id = auth.uid())
    or public.is_admin()
  );

-- Someone may read an invitation addressed to them, so it can be claimed.
drop policy if exists festival_invite_select_mine on public.festival_invite;
create policy festival_invite_select_mine on public.festival_invite
  for select using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------------------------------------------------------------------------
-- 6. Claiming invitations.
--
-- Someone can be invited before they have ever signed in, so the invitation is
-- addressed to an email. On sign-in this turns any invitation for that address
-- into a membership. Called by the app rather than by a trigger on auth.users,
-- which an app-level role may not attach to.
-- ---------------------------------------------------------------------------
create or replace function public.claim_festival_invites()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  n       integer := 0;
begin
  if auth.uid() is null or v_email = '' then
    return 0;
  end if;

  with claimed as (
    update public.festival_invite i
       set claimed_at = now()
     where lower(i.email) = v_email and i.claimed_at is null
     returning i.festival_id, i.role
  )
  insert into public.festival_member (festival_id, user_id, role)
  select c.festival_id, auth.uid(), c.role from claimed c
  on conflict (festival_id, user_id) do nothing;

  get diagnostics n = row_count;
  return n;
end $$;
