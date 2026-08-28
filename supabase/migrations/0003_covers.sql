-- ============================================================================
-- Festival cover images.
--
-- Public bucket: a cover is shown on a public festival page, so there is
-- nothing to protect in the file itself. Writing is the part that needs
-- guarding, and that is what the policies below do.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Files are stored as <festival_id>/<filename>, so the first path segment says
-- which festival a file belongs to and can be checked against membership.
create or replace function public.may_write_cover(object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.festival f
     where f.id::text = split_part(object_name, '/', 1)
       and (f.owner_id = auth.uid() or public.festival_role(f.id) = 'organiser')
  );
$$;

drop policy if exists covers_read on storage.objects;
create policy covers_read on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists covers_insert on storage.objects;
create policy covers_insert on storage.objects
  for insert with check (
    bucket_id = 'covers' and public.may_write_cover(name)
  );

drop policy if exists covers_update on storage.objects;
create policy covers_update on storage.objects
  for update using (bucket_id = 'covers' and public.may_write_cover(name));

drop policy if exists covers_delete on storage.objects;
create policy covers_delete on storage.objects
  for delete using (bucket_id = 'covers' and public.may_write_cover(name));
