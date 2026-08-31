-- The workspace photo desk. A photo can now belong to no festival (the
-- workspace's own library), and instead of a home-page flag it carries a
-- placement: which public page it dresses — home, society, organisations,
-- about — or none.

alter table public.photo alter column festival_id drop not null;

alter table public.photo add column if not exists page text
  check (page in ('home', 'society', 'organisations', 'about'));

update public.photo set page = 'home' where home = true;

alter table public.photo drop column if exists home;

-- Writes on festival photos already pass through can_edit_festival, which
-- says yes to the admin too — and for library rows (festival_id null) the
-- same check leaves only the admin standing. No new table policy needed.

-- The admin uploads library files under a 'workspace/' folder, which is no
-- festival's folder — the storage gate learns to let the admin through.
create or replace function public.may_write_cover(object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.festival f
     where f.id::text = split_part(object_name, '/', 1)
       and (f.owner_id = auth.uid() or public.festival_role(f.id) = 'organiser')
  ) or public.is_admin();
$$;
