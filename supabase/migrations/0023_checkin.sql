-- The door: a guest is checked in by setting the moment they arrived.
-- Written only by the site's own server (the book has no write policies),
-- read by the festival's team like the rest of the book.
alter table public.festival_attendee
  add column if not exists arrived_at timestamptz;
