-- Where the faces are. One click at the photo desk stores a focal point per
-- photo; the home page keeps its shape composition on the other side.
alter table public.photo add column if not exists focus_x numeric
  check (focus_x >= 0 and focus_x <= 1);
alter table public.photo add column if not exists focus_y numeric
  check (focus_y >= 0 and focus_y <= 1);
