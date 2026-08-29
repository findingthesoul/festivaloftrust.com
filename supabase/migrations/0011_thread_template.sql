-- ============================================================================
-- Which structure this festival is built from.
--
-- The Thread holds several thread templates — a structure, not a design: the
-- items an event has, which the organiser then fills in. The platform lists
-- them at GET /apps/:slug/thread/templates and applies one at publish via
-- `template_id` (The Fibre v0.18.22).
--
-- Held here for the same reason every other event setting is: a festival is
-- planned before it is published, so the choice has to live somewhere until
-- there is a page to apply it to.
--
-- ONLY MEANINGFUL BEFORE PUBLISHING. A template seeds a thread's items when
-- the page is created. Changing it afterwards would either duplicate every
-- item or silently do nothing, so the settings screen stops offering it once
-- the festival is live. Kept on the row regardless, as the record of what this
-- festival was built from.
--
-- No FK: the id belongs to The Fibre's database, not this one. Same reasoning
-- as fibre_run_id and thread_id.
-- ============================================================================

alter table public.festival
  add column if not exists thread_template_id uuid;

comment on column public.festival.thread_template_id is
  'The Thread template this festival is built from, chosen before publishing and applied when the page is created. Points into The Fibre, so no foreign key.';
