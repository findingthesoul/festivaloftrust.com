-- ============================================================================
-- Fuller organiser profile.
--
-- Phone and address are held here rather than in The Fibre because the app
-- surface cannot write them: a created person receives email and a split name
-- and nothing else (`MatchOn` is email / name / domain). When the platform can
-- accept a fuller contact, these move and this table keeps only what is
-- genuinely local.
-- ============================================================================

alter table public.organiser
  add column if not exists phone text,
  add column if not exists address text,
  -- The Fibre person this organiser is, once linked. Not a foreign key: it
  -- lives in another database.
  add column if not exists fibre_person_id uuid,
  add column if not exists fibre_linked_at timestamptz;
