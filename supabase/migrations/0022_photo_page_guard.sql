-- Who may place a photo on a public page. The row policy answers "whose
-- photo is this"; this trigger answers the question it cannot: which page.
-- Organisers may only offer their photo to the home page — with a credit,
-- because the home page prints one — or withdraw it. Every other placement
-- (the story-page heroes, someone else's slot) is the workspace admin's.

create or replace function public.photo_page_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.page is not distinct from old.page then
    return new;
  end if;
  if public.is_admin() then
    return new;
  end if;
  if new.page is null then
    return new;
  end if;
  if new.page = 'home' and coalesce(trim(new.credit), '') <> '' then
    return new;
  end if;
  raise exception 'only the workspace admin places photos on site pages, and the home page needs a credit';
end;
$$;

drop trigger if exists photo_page_guard on public.photo;
create trigger photo_page_guard
  before insert or update on public.photo
  for each row execute function public.photo_page_guard();

-- One row per cover pull: the round pick on the overview checks-then-inserts,
-- and two fast clicks must not seat the same cover twice.
create unique index if not exists photo_one_url_per_festival
  on public.photo (festival_id, url) where festival_id is not null;
