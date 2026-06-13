-- Run after `supabase db reset` via `npm run smoke:voice-integrations`.

begin;

do $$
declare
  admin_user_id uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  blocked_user_id uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab';
  group_id uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  zone_ready_id uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
  zone_blocked_id uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2';
  location_event_id uuid := 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
  linked_user_ready_id uuid := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1';
  linked_user_blocked_id uuid := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2';
  trigger_ready_id uuid := 'ffffffff-ffff-4fff-8fff-fffffffffff1';
  trigger_blocked_id uuid := 'ffffffff-ffff-4fff-8fff-fffffffffff2';
  ready_dispatch_count integer;
  blocked_dispatch_count integer;
  linkage_runtime_row_count integer;
  linked_runtime_row_count integer;
  visible_failure_reason text;
  release_linking_evidence text;
  release_runtime_evidence text;
  release_delivery_evidence text;
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values
  (
    '00000000-0000-0000-0000-000000000000',
    admin_user_id,
    'authenticated',
    'authenticated',
    'alexa-smoke-admin@example.com',
    crypt('alexa-smoke-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    blocked_user_id,
    'authenticated',
    'authenticated',
    'alexa-smoke-blocked@example.com',
    crypt('alexa-smoke-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  on conflict (id) do nothing;

  insert into public.profiles (id, display_name, is_active, role, theme_preference)
  values
    (admin_user_id, 'Alexa Smoke Admin', true, 'admin', 'ares'),
    (blocked_user_id, 'Alexa Smoke Blocked', true, 'user', 'ares')
  on conflict (id) do update set display_name = excluded.display_name, role = excluded.role;

  insert into public.groups (id, created_by, name, description)
  values (group_id, admin_user_id, 'Alexa Smoke Group', 'Voice integrations smoke fixtures')
  on conflict (id) do update set name = excluded.name;

  insert into public.zones (id, created_by, group_id, name, latitude, longitude, radius_meters, is_active)
  values
    (zone_ready_id, admin_user_id, group_id, 'Alexa Ready Zone', 4.61, -74.08, 120, true),
    (zone_blocked_id, admin_user_id, group_id, 'Alexa Blocked Zone', 4.62, -74.07, 150, true)
  on conflict (id) do update set name = excluded.name;

  insert into public.alexa_linked_users (
    id,
    profile_id,
    alexa_user_reference,
    linkage_status,
    notification_permission_status,
    notification_subscription_status,
    readiness_status,
    locale,
    last_skill_event_at
  )
  values
    (
      linked_user_ready_id,
      admin_user_id,
      'amzn1.account.ready-user',
      'linked',
      'granted',
      'subscribed',
      'ready',
      'en-US',
      now()
    ),
    (
      linked_user_blocked_id,
      blocked_user_id,
      'amzn1.account.blocked-user',
      'linked',
      'denied',
      'subscribed',
      'permission_missing',
      'en-US',
      now()
    )
  on conflict (id) do update set readiness_status = excluded.readiness_status;

  insert into public.alexa_triggers (id, zone_id, alexa_device_id, message_template, is_active, linked_user_id, workflow_key)
  values
    (trigger_ready_id, zone_ready_id, 'device-ready', 'Welcome {{eventType}}', true, linked_user_ready_id, 'zone-enter-notification'),
    (trigger_blocked_id, zone_blocked_id, 'device-blocked', 'Blocked {{eventType}}', true, linked_user_blocked_id, 'zone-enter-notification')
  on conflict (id) do update set linked_user_id = excluded.linked_user_id, is_active = excluded.is_active;

  insert into public.location_events (id, zone_id, user_id, event_type, distance_meters, latitude, longitude)
  values (location_event_id, zone_ready_id, admin_user_id, 'enter', 12, 4.61, -74.08)
  on conflict (id) do update set zone_id = excluded.zone_id;

  insert into public.alexa_delivery_attempts (
    alexa_trigger_id,
    alexa_linked_user_id,
    location_event_id,
    workflow_key,
    idempotency_key,
    status,
    attempt_count,
    failure_reason,
    last_attempted_at
  )
  values (
    trigger_ready_id,
    linked_user_ready_id,
    location_event_id,
    'zone-enter-notification',
    'alexa:smoke:event-1:linked-user-ready:zone-enter-notification',
    'failed',
    1,
    'Amazon timeout from smoke verification',
    now()
  )
  on conflict (idempotency_key) do update set failure_reason = excluded.failure_reason, status = excluded.status;

  select count(*)
    into ready_dispatch_count
  from public.location_events event
  join public.alexa_triggers trigger on trigger.zone_id = event.zone_id and trigger.is_active = true
  join public.alexa_linked_users linked_user on linked_user.id = trigger.linked_user_id
  where event.id = location_event_id
    and trigger.workflow_key = 'zone-enter-notification'
    and linked_user.readiness_status = 'ready';

  if ready_dispatch_count <> 1 then
    raise exception 'Expected one eligible Alexa dispatch candidate, got %', ready_dispatch_count;
  end if;

  select count(*)
    into blocked_dispatch_count
  from public.alexa_triggers trigger
  join public.alexa_linked_users linked_user on linked_user.id = trigger.linked_user_id
  where trigger.id = trigger_blocked_id
    and linked_user.readiness_status = 'ready';

  if blocked_dispatch_count <> 0 then
    raise exception 'Blocked Alexa linkage should not appear as ready dispatch candidate.';
  end if;

  select count(*)
    into linkage_runtime_row_count
  from public.alexa_linked_users linked_user
  where linked_user.id in (linked_user_ready_id, linked_user_blocked_id)
    and linked_user.profile_id is not null
    and linked_user.alexa_user_reference like 'amzn1.account.%'
    and linked_user.last_skill_event_at is not null;

  if linkage_runtime_row_count <> 2 then
    raise exception 'Expected release smoke fixtures to keep runtime linkage evidence for both linked users.';
  end if;

  select count(*)
    into linked_runtime_row_count
  from public.alexa_linked_users linked_user
  where linked_user.linkage_status = 'linked'
    and linked_user.id in (linked_user_ready_id, linked_user_blocked_id)
    and linked_user.readiness_status in ('ready', 'permission_missing');

  if linked_runtime_row_count <> 2 then
    raise exception 'Expected linked Alexa users to preserve ready/runtime gating states.';
  end if;

  select attempt.failure_reason
    into visible_failure_reason
  from public.alexa_delivery_attempts attempt
  where attempt.alexa_trigger_id = trigger_ready_id
    and attempt.status = 'failed';

  if visible_failure_reason is distinct from 'Amazon timeout from smoke verification' then
    raise exception 'Expected persisted failure visibility for Alexa attempts.';
  end if;

  release_linking_evidence := format(
    'account-linking smoke: ready=%s blocked=%s readiness=%s/%s',
    linked_user_ready_id,
    linked_user_blocked_id,
    'ready',
    'permission_missing'
  );
  release_runtime_evidence := format(
    'runtime smoke: linked rows=%s custom endpoint contract expects first-link binding + last_skill_event_at timestamps',
    linkage_runtime_row_count
  );
  release_delivery_evidence := format(
    'delivery smoke: trigger=%s failure_reason=%s',
    trigger_ready_id,
    visible_failure_reason
  );

  raise notice '%', release_linking_evidence;
  raise notice '%', release_runtime_evidence;
  raise notice '%', release_delivery_evidence;
end $$;

rollback;
