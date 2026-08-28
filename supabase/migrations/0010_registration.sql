-- ============================================================================
-- When registration opens.
--
-- In The Thread, a thread going `active` is the single moment its page is live
-- and enrolment is open — one decision, not two (§3 of
-- docs/brief-thread-event-settings.md). There is no column there for opening it
-- later, so the intent is held here and carried over when the time comes.
--
-- Null means it has not been decided. A time in the future is a promise; a time
-- in the past means it is open, and the thread is active to match.
-- ============================================================================

alter table public.festival
  add column if not exists registration_opens_at timestamptz;

-- Everything the opener has to find, in the order it asks: due, approved, has
-- a page, not open yet.
create index if not exists festival_registration_due_idx
  on public.festival (registration_opens_at)
  where registration_opens_at is not null and status = 'live';
