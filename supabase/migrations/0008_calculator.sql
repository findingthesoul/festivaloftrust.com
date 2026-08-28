-- ============================================================================
-- The tenth area, stored per festival.
--
-- A separate table rather than a column on `festival`, because the money is
-- not visible to everyone a festival is. `festival` is readable by any signed
-- in person once it is live (can_see_festival), and a host may read the row
-- too — so a jsonb column there would publish the budget to exactly the people
-- the tenth area is kept from.
--
-- The shape is the calculator's own `snapshot()` output, stored whole and
-- never interpreted here. The tool owns its format; a new export changes the
-- contents of this column and nothing else.
-- ============================================================================

create table if not exists public.festival_calculator (
  festival_id uuid primary key references public.festival(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

drop trigger if exists festival_calculator_touch on public.festival_calculator;
create trigger festival_calculator_touch
  before update on public.festival_calculator
  for each row execute function public.touch_updated_at();

-- Who may see the money: the owner, an organiser-role collaborator, an admin.
-- Deliberately NOT festival_role(...) is not null — that would include hosts.
create or replace function public.can_see_money(fid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.festival f
                  where f.id = fid and f.owner_id = auth.uid())
      or public.festival_role(fid) = 'organiser'
      or public.is_admin();
$$;

alter table public.festival_calculator enable row level security;

drop policy if exists festival_calculator_read on public.festival_calculator;
create policy festival_calculator_read on public.festival_calculator
  for select using (public.can_see_money(festival_id));

drop policy if exists festival_calculator_write on public.festival_calculator;
create policy festival_calculator_write on public.festival_calculator
  for insert with check (public.can_see_money(festival_id));

drop policy if exists festival_calculator_update on public.festival_calculator;
create policy festival_calculator_update on public.festival_calculator
  for update using (public.can_see_money(festival_id))
  with check (public.can_see_money(festival_id));
