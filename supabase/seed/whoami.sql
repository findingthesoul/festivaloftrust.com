-- Who is who. Run this whole file and paste the two results back.
--
-- The planner keys an organiser to auth.users(id). If refreshmiracle has an
-- organiser row but a different auth user is signing in — two accounts for one
-- address, or a recreated user — the app is right to say you have never
-- applied, and every festival you own belongs to the other id.

select 'auth user' as what, id::text, email, created_at
  from auth.users
 order by created_at;

select 'organiser' as what, o.id::text, o.email, o.status, o.is_admin,
       (o.id in (select id from auth.users)) as auth_user_exists
  from public.organiser o
 order by o.applied_at;

select 'festival' as what, f.marker, f.status, f.owner_id::text,
       (select email from auth.users u where u.id = f.owner_id) as owner_email
  from public.festival f
 order by f.created_at;
