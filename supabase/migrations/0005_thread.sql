-- ============================================================================
-- The festival's public page in The Thread.
--
-- The Thread owns the page, its tickets and the registration form. This holds
-- only the pointer, so the planner can find it again without asking every time.
-- ============================================================================

alter table public.festival
  add column if not exists thread_id uuid,
  add column if not exists thread_slug text,
  add column if not exists published_at timestamptz;
