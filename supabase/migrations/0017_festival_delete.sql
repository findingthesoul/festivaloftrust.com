-- ============================================================================
-- A festival may be deleted — by its owner or an admin, and never while it
-- is live. Taking a live festival down stays a two-step act on purpose:
-- offline first (which keeps registrations), then delete. The dependent
-- rows (members, invites, calculator, agenda, attendees) all cascade.
-- ============================================================================

drop policy if exists festival_delete_owner on public.festival;
create policy festival_delete_owner on public.festival
  for delete using (
    (owner_id = auth.uid() or public.is_admin())
    and status <> 'live'
  );
