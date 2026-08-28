-- ============================================================================
-- Make one signed-in address an approved organiser and an admin.
--
-- The planner's Supabase and The Fibre are separate databases. Being a Fibre
-- workspace admin grants nothing here — this app decides its own organisers,
-- which is why an address that runs the workspace can still land on /apply.
--
-- Edit the address on the next line, then run the whole file.
-- ============================================================================

with target as (
  select id, email from auth.users where lower(email) = lower('sjoerd+fot@soul.com')
)
insert into public.organiser (id, email, full_name, status, is_admin, reviewed_at)
select t.id, t.email, 'Sjoerd Luteijn', 'approved', true, now()
  from target t
on conflict (id) do update
   set status      = 'approved',
       is_admin    = true,
       reviewed_at = now();

-- Nothing inserted means that address has never signed in: sign in once with
-- it first, so auth.users has the row this joins against.
select email, status, is_admin from public.organiser order by applied_at;
