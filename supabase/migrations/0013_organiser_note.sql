-- ============================================================================
-- Who is behind this festival, in their own words.
--
-- A public page should say who invites you. Free text written by the
-- organisers in settings, shown on the event page; nothing structured,
-- because "we are three neighbours and a school" does not fit columns.
-- ============================================================================

alter table public.festival
  add column if not exists organiser_note text;
