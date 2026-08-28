-- ============================================================================
-- Close a privilege escalation on public.organiser.
--
-- The insert policy was `with check (id = auth.uid())`, with a comment saying
-- status and is_admin "are not settable from here: the column defaults win".
-- That is not true. PostgREST inserts whatever columns the client sends, and
-- the anon key is public, so any signed-in person could POST their own
-- organiser row with status 'approved' and is_admin true and become an admin
-- of this site — able to approve organisers and publish festivals.
--
-- A default only applies to a column the client omits. It is not a constraint.
--
-- The self-update policy had the same gap in slower motion: it pinned status
-- to 'pending' but said nothing about is_admin, so someone could set the flag
-- while pending and become an admin the moment a real admin approved them.
-- ============================================================================

-- 1. Applying may only ever create a pending, non-admin row.
drop policy if exists organiser_insert_self on public.organiser;
create policy organiser_insert_self on public.organiser
  for insert with check (
    id = auth.uid()
    and status = 'pending'
    and is_admin = false
  );

-- 2. Changing status or is_admin is an admin act.
--
-- A trigger rather than a policy: a WITH CHECK sees only the proposed row, so
-- it cannot tell "is_admin was already true" from "is_admin is being set now".
-- Comparing old to new needs a trigger.
create or replace function public.organiser_guard_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- No JWT means this is the SQL editor or a service-role job — the operator,
  -- not a visitor. Bootstrapping the first admin has to remain possible.
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin then
    raise exception 'only an admin may change is_admin';
  end if;

  if new.status is distinct from old.status then
    raise exception 'only an admin may change status';
  end if;

  return new;
end $$;

drop trigger if exists organiser_guard_privileges on public.organiser;
create trigger organiser_guard_privileges
  before update on public.organiser
  for each row execute function public.organiser_guard_privileges();

-- 3. Repair anything the old policy let through.
--
-- Nobody should hold is_admin who was not deliberately given it. Review the
-- output before and after: this revokes the flag from every organiser except
-- the addresses named here.
update public.organiser
   set is_admin = false
 where is_admin
   and lower(email) not in ('sjoerd@soul.com', 'sjoerd+fot@soul.com', 'refreshmiracle@mac.com');

select email, status, is_admin from public.organiser order by applied_at;
