-- ============================================================================
-- Make the Festival of Trust workspace's user an admin of it.
--
-- Why this is needed: a workspace created by approving an access request ends
-- up with no admin. The signup-request handler notes that user and person rows
-- are created at first sign-in "via the existing sso/resolve flow" — but that
-- flow inserts a `user`, never a `workspace_member`. Membership rows are only
-- written by the members admin screen and by Meet.
--
-- So the first user of a new workspace has no membership row, therefore no
-- role, therefore fails requireWorkspaceAdmin — which is what makes the API
-- keys page answer 403. And the screen that could grant the role is itself
-- behind the same check, so it cannot be fixed from the UI.
--
-- Idempotent: re-running promotes rather than duplicating.
-- ============================================================================

do $$
declare
  v_ws   uuid;
  v_user uuid;
  v_mail text;
begin
  select id into v_ws from public.workspace where slug = 'festival-of-trust-7va1';
  if v_ws is null then
    raise exception 'workspace festival-of-trust-7va1 not found';
  end if;

  -- The workspace's earliest user: the person who signed in and created it.
  select id, email into v_user, v_mail
    from public."user"
   where workspace_id = v_ws
   order by created_at asc
   limit 1;
  if v_user is null then
    raise exception 'no user has signed into festival-of-trust-7va1 yet';
  end if;

  insert into public.workspace_member (user_id, workspace_id, workspace_role)
  values (v_user, v_ws, 'admin')
  on conflict (user_id, workspace_id)
    do update set workspace_role = 'admin';

  raise notice 'workspace admin granted to % in festival-of-trust-7va1', v_mail;
end $$;
