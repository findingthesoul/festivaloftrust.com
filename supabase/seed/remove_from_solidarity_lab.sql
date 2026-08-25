-- ============================================================================
-- Undo the festival setup in Solidarity Lab.
--
-- The festival flow, one test run and an organisation link were created in
-- Solidarity Lab before we settled that Festival of Trust is its own workspace.
-- Leaving them behind means a flow named "Festival of Trust — the nine steps"
-- sitting in the wrong tenant next to Pulse's pipeline, which is exactly the
-- kind of debris that later gets mistaken for something real.
--
-- Deletes only what this project created, identified by system_key and by the
-- app slug. Run the counts first; the deletes are below them.
-- ============================================================================

do $$
declare
  v_ws    uuid;
  v_flow  uuid;
  v_app   uuid;
  n_runs  int;
  n_links int;
begin
  select id into v_ws from public.workspace where slug = 'default';       -- Solidarity Lab
  select id into v_app from public.app where slug = 'fot-planner';
  select id into v_flow from public.flow_definition
   where workspace_id = v_ws and system_key = 'fot_festival';

  if v_flow is null then
    raise notice 'nothing to remove: no fot_festival flow in Solidarity Lab';
    return;
  end if;

  select count(*) into n_runs  from public.flow_run where flow_id = v_flow;
  select count(*) into n_links from public.app_record_link
   where workspace_id = v_ws and app_id = v_app;
  raise notice 'removing: 1 flow, % run(s), % record link(s)', n_runs, n_links;

  -- Tasks and notes reference runs; runs reference the flow. Delete inward-out
  -- rather than relying on cascades that may not all be declared.
  delete from public.flow_task
   where flow_run_id in (select id from public.flow_run where flow_id = v_flow);
  delete from public.flow_run_note
   where flow_run_id in (select id from public.flow_run where flow_id = v_flow);
  delete from public.flow_run where flow_id = v_flow;

  -- Steps, transitions and default tasks hang off the version and cascade.
  delete from public.flow_version where flow_id = v_flow;
  delete from public.flow_definition where id = v_flow;

  -- The festival_host link pointing at the Festival of Trust organisation.
  delete from public.app_record_link where workspace_id = v_ws and app_id = v_app;

  raise notice 'done. The activity rows the run generated are append-only and stay.';
end $$;
