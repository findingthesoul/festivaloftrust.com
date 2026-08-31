-- The festival's photo list. Beyond the single cover: organisers upload a
-- set, give each photo its credit, and may offer it to the home page. The
-- home page rotates through everything tagged home — with the credit shown,
-- which is why a credit is part of the offer.

create table public.photo (
  id          uuid primary key default gen_random_uuid(),
  festival_id uuid not null references public.festival(id) on delete cascade,
  url         text not null,
  -- Who to thank on the home page: the organisation or photographer.
  credit      text,
  -- Offered to (and shown on) the home page.
  home        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.photo enable row level security;

-- The home page reads these signed out, so reading is open — the files
-- themselves are in a public bucket already.
create policy photo_read on public.photo for select using (true);

create policy photo_write on public.photo for all
  using (public.can_edit_festival(festival_id))
  with check (public.can_edit_festival(festival_id));
