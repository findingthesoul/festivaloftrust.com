-- ============================================================================
-- Festival of Trust — the nine steps, as a Fibre Flow.
--
-- Run this in the Supabase SQL editor for The Fibre. It targets the Festival
-- of Trust workspace, found by slug. It exists as SQL rather than as clicks because `system_key` is not
-- settable from Flow's UI or its API — Pulse's pipeline got its own the same
-- way (20260708120000_pipeline_flow_in_flow.sql), and that is the precedent
-- this follows.
--
-- system_key is what the planner matches on. Without it the planner would have
-- to find the flow by name, and renaming the flow in Flow would break it.
--
-- Idempotent: re-running does nothing if the flow already exists.
-- ============================================================================

do $$
declare
  v_ws      uuid;
  v_owner   uuid;
  v_flow    uuid;
  v_version uuid;
  v_step    uuid;
  v_prev    uuid;
begin
  -- Looked up by slug rather than pasted: the Festival of Trust workspace, not
  -- Solidarity Lab. Festival registrants become persons in whichever workspace
  -- holds the festival, and they do not belong in Solidarity Lab's contact
  -- graph alongside its clients.
  select id into v_ws from public.workspace where slug = 'festival-of-trust-7va1';
  if v_ws is null then
    raise exception 'workspace festival-of-trust-7va1 not found';
  end if;

  if exists (select 1 from public.flow_definition
              where workspace_id = v_ws and system_key = 'fot_festival') then
    raise notice 'fot_festival already exists — nothing to do';
    return;
  end if;

  select u.id into v_owner
    from public."user" u
   where u.workspace_id = v_ws and u.is_super_admin = true
   order by u.created_at asc
   limit 1;
  if v_owner is null then
    raise exception 'no super admin found in workspace %', v_ws;
  end if;

  insert into public.flow_definition
    (workspace_id, name, description, scope, owner_user_id, visibility,
     lifecycle, progression, created_by, system_key)
  values
    (v_ws,
     'Festival of Trust — the nine steps',
     'The method an organiser walks through to create a Festival of Trust. The Festival planner reads this flow; edit the steps, their tasks and their meta here.',
     'workspace', v_owner, 'org_wide', 'active', 'open', v_owner, 'fot_festival')
  returning id into v_flow;

  insert into public.flow_version (flow_id, version_number, published_at, created_by)
  values (v_flow, 1, now(), v_owner)
  returning id into v_version;

  update public.flow_definition set current_version_id = v_version where id = v_flow;


  -- 1 Listen
  insert into public.flow_step
    (flow_version_id, key, name, description, kind, ordinal, group_key, group_label, meta)
  values
    (v_version, 'listen', 'Listen', 'Discover the need. Find out what trust looks like, and where it is thin, in this specific place, before planning anything.', 'entry', 0,
     'orientation', 'Orientation',
     '{"purpose": "Discover the need. Find out what trust looks like, and where it is thin, in this specific place, before planning anything.", "trap": "Arriving with the answer. If you already know what the festival will be before you have listened, you have skipped the step. Listening that only confirms your plan is not listening.", "reflection": "What surprised you about how trust lives here?", "what_good_looks_like": "You can describe the community in its own words, not yours. You know who is gathering and what holds them together. You have heard, from real people, where trust already lives and where it strains.", "readiness": "This step also tests you. Can you sit with a community''s account without correcting it. If listening feels like a delay before the real work, pause. The listening is the real work."}'::jsonb)
  returning id into v_step;

  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Have unhurried conversations with people in the community', 'personal', 0);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Ask how trust grows here, who people rely on, what is missing', 'personal', 1);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Name who is gathering, and what holds them together', 'personal', 2);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Listen for the pockets of trust that already exist', 'personal', 3);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Resist pitching a festival, you are learning, not recruiting', 'personal', 4);

  if v_prev is not null then
    insert into public.flow_transition (flow_version_id, from_step_id, to_step_id, label, ordinal)
    values (v_version, v_prev, v_step, 'Next', 0);
  end if;
  v_prev := v_step;


  -- 2 Gather
  insert into public.flow_step
    (flow_version_id, key, name, description, kind, ordinal, group_key, group_label, meta)
  values
    (v_version, 'gather', 'Gather', 'Form the core group. Bring together a small, diverse group who will steward the festival. Stewards, not staff.', 'normal', 1,
     'orientation', 'Orientation',
     '{"purpose": "Form the core group. Bring together a small, diverse group who will steward the festival. Stewards, not staff.", "trap": "Gathering people who agree with you and are easy to work with. A core group that shares one perspective will design a festival for people like themselves.", "reflection": "Whose perspective is still missing from this group?", "what_good_looks_like": "A handful of people who care, from different backgrounds, generations, and vantage points. They own the festival together. No single person carries it alone.", "readiness": "Here you learn what you carry and what others must. If you cannot let others shape the festival, notice that now, while it is still small."}'::jsonb)
  returning id into v_step;

  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Invite people whose presence widens the group''s view, not just its workload', 'personal', 0);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Seek difference: someone who knows the elders, someone who knows the young', 'personal', 1);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Include at least one person from outside your usual circle', 'personal', 2);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Agree how you will work together before you agree what to do', 'personal', 3);

  if v_prev is not null then
    insert into public.flow_transition (flow_version_id, from_step_id, to_step_id, label, ordinal)
    values (v_version, v_prev, v_step, 'Next', 0);
  end if;
  v_prev := v_step;


  -- 3 Align
  insert into public.flow_step
    (flow_version_id, key, name, description, kind, ordinal, group_key, group_label, meta)
  values
    (v_version, 'align', 'Align', 'Clarify purpose and vision. Agree why here, why now, and what people should carry home. This becomes the test for every later choice.', 'normal', 2,
     'orientation', 'Orientation',
     '{"purpose": "Clarify purpose and vision. Agree why here, why now, and what people should carry home. This becomes the test for every later choice.", "trap": null, "reflection": "Does our purpose help us say no to something?", "what_good_looks_like": "The core group can say, in a sentence or two, why this festival exists and what it hopes people leave with. When a later decision is hard, you return to this and it helps."}'::jsonb)
  returning id into v_step;

  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Answer together: why are we doing this', 'personal', 0);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Answer together: who do we hope will come', 'personal', 1);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Answer together: what do we want people to carry home', 'personal', 2);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Write the purpose plainly and keep it where the group can see it', 'personal', 3);

  if v_prev is not null then
    insert into public.flow_transition (flow_version_id, from_step_id, to_step_id, label, ordinal)
    values (v_version, v_prev, v_step, 'Next', 0);
  end if;
  v_prev := v_step;


  -- 4 Connect
  insert into public.flow_step
    (flow_version_id, key, name, description, kind, ordinal, group_key, group_label, meta)
  values
    (v_version, 'connect', 'Connect', 'Build partnerships. Invite organisations, schools, artists, businesses, and local leaders to strengthen the social fabric with you.', 'normal', 3,
     'doing', 'Doing',
     '{"purpose": "Build partnerships. Invite organisations, schools, artists, businesses, and local leaders to strengthen the social fabric with you.", "trap": "Treating partnership as fundraising. The moment the conversation is only about money, you have lost the point. Partners join the work; sponsors buy a logo.", "reflection": "Who did we invite to give, when we should have invited them to join?", "what_good_looks_like": "You have partners, not sponsors. People and groups who see the festival as theirs too, who contribute more than money: space, reach, trust, hands."}'::jsonb)
  returning id into v_step;

  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'List organisations, schools, artists, businesses, local leaders', 'personal', 0);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Approach each with an invitation to build, not a request to fund', 'personal', 1);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Be clear about the shared aim', 'personal', 2);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Let partners shape their own contribution', 'personal', 3);

  if v_prev is not null then
    insert into public.flow_transition (flow_version_id, from_step_id, to_step_id, label, ordinal)
    values (v_version, v_prev, v_step, 'Next', 0);
  end if;
  v_prev := v_step;


  -- 5 Design
  insert into public.flow_step
    (flow_version_id, key, name, description, kind, ordinal, group_key, group_label, meta)
  values
    (v_version, 'design', 'Design', 'Shape the festival journey. Choose the movements, formats, and artistic elements that carry people from experience to their own sense of agency.', 'normal', 4,
     'doing', 'Doing',
     '{"purpose": "Shape the festival journey. Choose the movements, formats, and artistic elements that carry people from experience to their own sense of agency.", "trap": "Designing a programme instead of a journey. A good festival is not a full timetable. Empty space, a shared meal, an unhurried conversation often do more than another session.", "reflection": "Where in the day does a stranger first feel they belong?", "what_good_looks_like": "A day that moves. Not a stack of sessions, but a sequence that deepens: people arrive as strangers and leave having met. The design fits this community, tuned to it, not copied from elsewhere."}'::jsonb)
  returning id into v_step;

  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Work with the five movements as the spine', 'personal', 0);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Set the four pillars for this community using the dials', 'personal', 1);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Start from a named preset if this is your first time', 'personal', 2);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Choose formats, conversations, and art that serve the movements', 'personal', 3);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Leave empty space: a shared meal, an unhurried conversation', 'personal', 4);

  if v_prev is not null then
    insert into public.flow_transition (flow_version_id, from_step_id, to_step_id, label, ordinal)
    values (v_version, v_prev, v_step, 'Next', 0);
  end if;
  v_prev := v_step;


  -- 6 Invite
  insert into public.flow_step
    (flow_version_id, key, name, description, kind, ordinal, group_key, group_label, meta)
  values
    (v_version, 'invite', 'Invite', 'Bring the community together. Reach people personally first, publicly second. Aim to gather people who would not usually meet.', 'normal', 5,
     'doing', 'Doing',
     '{"purpose": "Bring the community together. Reach people personally first, publicly second. Aim to gather people who would not usually meet.", "trap": "Relying on marketing. People rarely join a conversation about trust because of an advert. They come because they were asked, by name, by someone who matters to them.", "reflection": "Who in the room would surprise the rest of the room?", "what_good_looks_like": "The room holds a mix that does not happen by accident. People came because someone they trust asked them, not because they saw a poster."}'::jsonb)
  returning id into v_step;

  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Make personal invitations the core of your outreach', 'personal', 0);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Ask partners and the core group to invite people directly', 'personal', 1);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Use public reach to widen, not replace, the personal ask', 'personal', 2);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Notice who is not coming, and go to them', 'personal', 3);

  if v_prev is not null then
    insert into public.flow_transition (flow_version_id, from_step_id, to_step_id, label, ordinal)
    values (v_version, v_prev, v_step, 'Next', 0);
  end if;
  v_prev := v_step;


  -- 7 Host
  insert into public.flow_step
    (flow_version_id, key, name, description, kind, ordinal, group_key, group_label, meta)
  values
    (v_version, 'host', 'Host', 'Facilitate meaningful encounters. Hold the space so that trust can grow. Do not control the outcome.', 'normal', 6,
     'culmination', 'Culmination',
     '{"purpose": "Facilitate meaningful encounters. Hold the space so that trust can grow. Do not control the outcome.", "trap": "Over-programming the day out of nervousness. Silence and open space feel risky to a host and often feel rich to a participant. Trust the room.", "reflection": "What happened that we did not plan, and was better for it?", "what_good_looks_like": "People relax. Strangers talk. The team is present but not central. The day belongs to the participants, and the hosts make that possible without making it about themselves."}'::jsonb)
  returning id into v_step;

  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Attend to welcome, hospitality, facilitation, inclusion, reflection', 'personal', 0);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Prepare facilitators well', 'personal', 1);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Watch the room and adjust', 'personal', 2);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Protect the quiet moments as carefully as the loud ones', 'personal', 3);

  if v_prev is not null then
    insert into public.flow_transition (flow_version_id, from_step_id, to_step_id, label, ordinal)
    values (v_version, v_prev, v_step, 'Next', 0);
  end if;
  v_prev := v_step;


  -- 8 Harvest
  insert into public.flow_step
    (flow_version_id, key, name, description, kind, ordinal, group_key, group_label, meta)
  values
    (v_version, 'harvest', 'Harvest', 'Capture stories and learning. Turn one day into shared community knowledge.', 'normal', 7,
     'culmination', 'Culmination',
     '{"purpose": "Capture stories and learning. Turn one day into shared community knowledge.", "trap": "Measuring the wrong thing. Attendance and satisfaction are easy to count and say little about trust. Look instead for what people intend to carry on.", "reflection": "What did the community learn about itself today?", "what_good_looks_like": "The festival leaves a trace. Stories told, relationships named, commitments made, ideas surfaced. Not a report filed and forgotten, but something the community can hold and use."}'::jsonb)
  returning id into v_step;

  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Gather stories, insights, relationships formed, commitments made', 'personal', 0);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Capture with consent and care, never by extraction', 'personal', 1);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Let people say what mattered to them', 'personal', 2);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Keep it in a form the community owns, not only the organisers', 'personal', 3);

  if v_prev is not null then
    insert into public.flow_transition (flow_version_id, from_step_id, to_step_id, label, ordinal)
    values (v_version, v_prev, v_step, 'Next', 0);
  end if;
  v_prev := v_step;


  -- 9 Grow
  insert into public.flow_step
    (flow_version_id, key, name, description, kind, ordinal, group_key, group_label, meta)
  values
    (v_version, 'grow', 'Grow', 'Sustain the web. Support participants to keep going, start their own initiatives, and become organisers themselves.', 'end_positive', 8,
     'culmination', 'Culmination',
     '{"purpose": "Sustain the web. Support participants to keep going, start their own initiatives, and become organisers themselves.", "trap": "Treating the festival as the finish line. If everything ends when the room empties, the pockets stay scattered. The threads form only if someone tends them after.", "reflection": "What is now possible here that was not possible before?", "what_good_looks_like": "The festival was a beginning. Conversations continue. New pockets of trust form. Some participants become the next organisers. The web is denser than it was."}'::jsonb)
  returning id into v_step;

  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Before people leave, open a path to what comes next', 'personal', 0);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Offer further conversations, learning circles, small initiatives, future gatherings', 'personal', 1);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Stay in light contact', 'personal', 2);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Connect this festival''s web to others', 'personal', 3);
  insert into public.flow_step_default_task
    (step_id, title, actor_type, ordinal)
  values (v_step, 'Hand the work onward rather than holding it', 'personal', 4);

  if v_prev is not null then
    insert into public.flow_transition (flow_version_id, from_step_id, to_step_id, label, ordinal)
    values (v_version, v_prev, v_step, 'Next', 0);
  end if;
  v_prev := v_step;


  raise notice 'seeded fot_festival: flow %, version %', v_flow, v_version;
end $$;
