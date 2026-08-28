-- ============================================================================
-- The event's own settings, held here and pushed to The Thread.
--
-- Every column below already exists on thread_thread. They are mirrored here
-- for one reason: a festival is planned before it is published, and until it
-- is published there is no thread to hold them. An organiser who cannot say
-- "this is in Portuguese, people apply rather than just enrol" until after the
-- page is public has the order backwards.
--
-- So the planner holds the intent, and publishing carries it over. Defaults
-- match The Thread's own, so a festival that never touches this screen
-- publishes exactly as it would have.
--
-- Price is deliberately absent. A Festival of Trust is free, and the honest
-- way to say that is not to have the field.
-- ============================================================================

alter table public.festival
  add column if not exists timezone text not null default 'Europe/Amsterdam',
  add column if not exists language text not null default 'en'
    check (language in ('en', 'nl', 'es', 'pt', 'de')),
  -- People apply and are admitted, rather than enrolling straight through.
  add column if not exists requires_approval boolean not null default false,
  -- How the public overview opens it: its own page, or the enrol popup.
  add column if not exists public_interaction text not null default 'page'
    check (public_interaction in ('page', 'popup')),
  add column if not exists share_participants_public boolean not null default false,
  add column if not exists share_participants_participants boolean not null default false,
  add column if not exists capacity integer
    check (capacity is null or capacity > 0),
  add column if not exists is_public_listed boolean not null default true;
