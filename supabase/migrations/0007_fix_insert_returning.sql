-- ============================================================================
-- Creating a festival was refused by the SELECT policy, not the insert one.
--
-- 0002 replaced `owner_id = auth.uid()` with `can_see_festival(id)`, which is
-- `stable security definer` and queries public.festival itself:
--
--   select exists (select 1 from public.festival f
--                   where f.id = fid and (f.owner_id = auth.uid() ...))
--
-- PostgREST inserts with RETURNING, so the row must pass the SELECT policy to
-- be returned. A STABLE function reads the snapshot taken at the start of the
-- statement — and the row being inserted is not in it. So the function says
-- "no such festival", the policy refuses, and the client is told
-- "new row violates row-level security policy for table festival", which
-- points at the insert policy that had in fact passed.
--
-- The fix is to compare columns directly for the two cases that do not need a
-- lookup. festival_role() stays: it reads festival_member, a different table,
-- which the snapshot does contain.
-- ============================================================================

drop policy if exists festival_select_visible on public.festival;
create policy festival_select_visible on public.festival
  for select using (
    owner_id = auth.uid()
    or status = 'live'
    or public.festival_role(id) is not null
    or public.is_admin()
  );

-- can_see_festival() is still used by festival_member, festival_invite and the
-- cover policies, where it reads a table other than the one being written, so
-- it is left in place.
