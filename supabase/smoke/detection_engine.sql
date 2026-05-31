-- Smoke verification for the Phase 9 detection engine.
-- Run after `supabase db reset` via `npm run smoke:detection-engine`.

begin;

create or replace function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if not condition then
    raise exception '%', message;
  end if;
end;
$$;

do $$
declare
  initial_run_result record;
  rerun_result record;
  stale_run_result record;
  event_count bigint;
  processed_count bigint;
  cursor_point_id uuid;
  cursor_captured_at timestamptz;
  cursor_received_at timestamptz;
  cursor_ingest_order integer;
  presence_point_id uuid;
  event_type_value text;
  event_triggered_at timestamptz;
begin
  perform pg_temp.assert_true(
    to_regprocedure('public.process_tracking_points_batch(integer,integer)') is not null,
    'Missing function public.process_tracking_points_batch(integer, integer).'
  );

  perform pg_temp.assert_true(
    exists (select 1 from pg_extension where extname = 'pg_cron'),
    'Missing pg_cron extension.'
  );

  perform pg_temp.assert_true(
    exists (
      select 1
      from cron.job
      where jobname = 'detection-engine-every-minute'
        and command = 'select public.process_tracking_points_batch();'
    ),
    'Unexpected pg_cron schedule for detection-engine-every-minute.'
  );

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
  ) values (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-000000000091',
    'authenticated',
    'authenticated',
    'detection-engine-smoke@example.com',
    crypt('detection-engine-smoke-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) on conflict (id) do nothing;

  insert into public.profiles (id, display_name, role)
  values ('00000000-0000-4000-8000-000000000091', 'Detection Engine Smoke', 'user')
  on conflict (id) do update set
    display_name = excluded.display_name,
    role = excluded.role,
    is_active = true;

  insert into public.groups (id, name, description, created_by)
  values (
    '10000000-0000-4000-8000-000000000091',
    'Detection Engine Smoke Group',
    'Phase 9 smoke coverage group',
    '00000000-0000-4000-8000-000000000091'
  )
  on conflict (id) do nothing;

  insert into public.group_members (id, group_id, user_id)
  values (
    '20000000-0000-4000-8000-000000000091',
    '10000000-0000-4000-8000-000000000091',
    '00000000-0000-4000-8000-000000000091'
  )
  on conflict (group_id, user_id) do nothing;

  insert into public.zones (
    id,
    name,
    latitude,
    longitude,
    radius_meters,
    is_active,
    group_id,
    created_by
  ) values (
    '30000000-0000-4000-8000-000000000091',
    'Detection Engine Smoke Zone',
    0,
    0,
    150,
    true,
    '10000000-0000-4000-8000-000000000091',
    '00000000-0000-4000-8000-000000000091'
  )
  on conflict (id) do update set
    name = excluded.name,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    radius_meters = excluded.radius_meters,
    is_active = excluded.is_active,
    group_id = excluded.group_id,
    created_by = excluded.created_by;

  insert into public.tracking_points (
    id,
    user_id,
    latitude,
    longitude,
    captured_at,
    received_at,
    ingest_order,
    processed_at
  ) values
    (
      '41000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000091',
      0,
      0.003,
      '2026-05-31T10:00:00Z',
      '2026-05-31T10:00:00Z',
      0,
      null
    ),
    (
      '41000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000091',
      0,
      0.003,
      '2026-05-31T10:05:00Z',
      '2026-05-31T10:05:00Z',
      0,
      null
    ),
    (
      '41000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-000000000091',
      0,
      0.0005,
      '2026-05-31T10:05:00Z',
      '2026-05-31T10:05:00Z',
      1,
      null
    ),
    (
      '41000000-0000-4000-8000-000000000004',
      '00000000-0000-4000-8000-000000000091',
      0,
      0.0004,
      '2026-05-31T10:10:00Z',
      '2026-05-31T10:10:00Z',
      0,
      null
    );

  select *
  into initial_run_result
  from public.process_tracking_points_batch(5, 20);

  perform pg_temp.assert_true(
    initial_run_result.claimed_user_count = 1,
    format('Expected initial claimed_user_count = 1, got %s.', initial_run_result.claimed_user_count)
  );

  perform pg_temp.assert_true(
    initial_run_result.processed_point_count = 4,
    format('Expected initial processed_point_count = 4, got %s.', initial_run_result.processed_point_count)
  );

  perform pg_temp.assert_true(
    initial_run_result.created_event_count = 1,
    format('Expected initial created_event_count = 1, got %s.', initial_run_result.created_event_count)
  );

  perform pg_temp.assert_true(
    initial_run_result.stale_point_count = 0,
    format('Expected initial stale_point_count = 0, got %s.', initial_run_result.stale_point_count)
  );

  select count(*)
  into processed_count
  from public.tracking_points
  where user_id = '00000000-0000-4000-8000-000000000091'
    and processed_at is not null;

  perform pg_temp.assert_true(
    processed_count = 4,
    format('Expected 4 processed tracking points after initial run, got %s.', processed_count)
  );

  select count(*)
  into event_count
  from public.location_events
  where user_id = '00000000-0000-4000-8000-000000000091';

  perform pg_temp.assert_true(
    event_count = 1,
    format('Expected exactly 1 location event after initial run, got %s.', event_count)
  );

  select event_type, triggered_at
  into event_type_value, event_triggered_at
  from public.location_events
  where user_id = '00000000-0000-4000-8000-000000000091'
  order by triggered_at asc, id asc
  limit 1;

  perform pg_temp.assert_true(
    event_type_value = 'enter',
    format('Expected first detection event to be enter, got %s.', coalesce(event_type_value, 'null'))
  );

  perform pg_temp.assert_true(
    event_triggered_at = '2026-05-31T10:05:00Z'::timestamptz,
    format('Expected enter event triggered_at = 2026-05-31T10:05:00Z, got %s.', event_triggered_at)
  );

  select last_captured_at, last_received_at, last_ingest_order, last_point_id
  into cursor_captured_at, cursor_received_at, cursor_ingest_order, cursor_point_id
  from public.tracking_user_cursors
  where user_id = '00000000-0000-4000-8000-000000000091';

  perform pg_temp.assert_true(
    cursor_captured_at = '2026-05-31T10:10:00Z'::timestamptz,
    format('Expected cursor last_captured_at = 2026-05-31T10:10:00Z, got %s.', cursor_captured_at)
  );

  perform pg_temp.assert_true(
    cursor_received_at = '2026-05-31T10:10:00Z'::timestamptz,
    format('Expected cursor last_received_at = 2026-05-31T10:10:00Z, got %s.', cursor_received_at)
  );

  perform pg_temp.assert_true(
    cursor_ingest_order = 0,
    format('Expected cursor last_ingest_order = 0, got %s.', cursor_ingest_order)
  );

  perform pg_temp.assert_true(
    cursor_point_id = '41000000-0000-4000-8000-000000000004'::uuid,
    format('Expected cursor last_point_id to be point 4, got %s.', cursor_point_id)
  );

  select last_point_id
  into presence_point_id
  from public.user_zone_presence
  where user_id = '00000000-0000-4000-8000-000000000091'
    and zone_id = '30000000-0000-4000-8000-000000000091';

  perform pg_temp.assert_true(
    presence_point_id = '41000000-0000-4000-8000-000000000004'::uuid,
    format('Expected zone presence to point at the latest inside sample, got %s.', presence_point_id)
  );

  select *
  into rerun_result
  from public.process_tracking_points_batch(5, 20);

  perform pg_temp.assert_true(
    rerun_result.claimed_user_count = 0
    and rerun_result.processed_point_count = 0
    and rerun_result.created_event_count = 0
    and rerun_result.stale_point_count = 0,
    format(
      'Expected empty rerun result, got claimed=%s processed=%s created=%s stale=%s.',
      rerun_result.claimed_user_count,
      rerun_result.processed_point_count,
      rerun_result.created_event_count,
      rerun_result.stale_point_count
    )
  );

  insert into public.tracking_points (
    id,
    user_id,
    latitude,
    longitude,
    captured_at,
    received_at,
    ingest_order,
    processed_at
  ) values (
    '41000000-0000-4000-8000-000000000005',
    '00000000-0000-4000-8000-000000000091',
    0,
    0.003,
    '2026-05-31T10:04:00Z',
    '2026-05-31T10:04:00Z',
    0,
    null
  );

  select *
  into stale_run_result
  from public.process_tracking_points_batch(5, 20);

  perform pg_temp.assert_true(
    stale_run_result.claimed_user_count = 1,
    format('Expected stale claimed_user_count = 1, got %s.', stale_run_result.claimed_user_count)
  );

  perform pg_temp.assert_true(
    stale_run_result.processed_point_count = 1,
    format('Expected stale processed_point_count = 1, got %s.', stale_run_result.processed_point_count)
  );

  perform pg_temp.assert_true(
    stale_run_result.created_event_count = 0,
    format('Expected stale created_event_count = 0, got %s.', stale_run_result.created_event_count)
  );

  perform pg_temp.assert_true(
    stale_run_result.stale_point_count = 1,
    format('Expected stale stale_point_count = 1, got %s.', stale_run_result.stale_point_count)
  );

  select count(*)
  into event_count
  from public.location_events
  where user_id = '00000000-0000-4000-8000-000000000091';

  perform pg_temp.assert_true(
    event_count = 1,
    format('Expected stale replay to keep 1 location event, got %s.', event_count)
  );

  perform pg_temp.assert_true(
    exists (
      select 1
      from public.tracking_points
      where id = '41000000-0000-4000-8000-000000000005'
        and processed_at is not null
    ),
    'Expected stale replay point to be marked processed.'
  );

  select last_captured_at, last_received_at, last_ingest_order, last_point_id
  into cursor_captured_at, cursor_received_at, cursor_ingest_order, cursor_point_id
  from public.tracking_user_cursors
  where user_id = '00000000-0000-4000-8000-000000000091';

  perform pg_temp.assert_true(
    cursor_captured_at = '2026-05-31T10:10:00Z'::timestamptz,
    format('Stale replay should not move the cursor captured_at, got %s.', cursor_captured_at)
  );

  perform pg_temp.assert_true(
    cursor_received_at = '2026-05-31T10:10:00Z'::timestamptz,
    format('Stale replay should not move the cursor received_at, got %s.', cursor_received_at)
  );

  perform pg_temp.assert_true(
    cursor_ingest_order = 0,
    format('Stale replay should not move the cursor ingest_order, got %s.', cursor_ingest_order)
  );

  perform pg_temp.assert_true(
    cursor_point_id = '41000000-0000-4000-8000-000000000004'::uuid,
    format('Stale replay should not move the cursor point id, got %s.', cursor_point_id)
  );

  insert into public.tracking_points (
    id,
    user_id,
    latitude,
    longitude,
    captured_at,
    received_at,
    ingest_order,
    processed_at
  ) values (
    '41000000-0000-4000-8000-000000000006',
    '00000000-0000-4000-8000-000000000091',
    0,
    0.003,
    '2026-05-31T10:10:00Z',
    '2026-05-31T10:10:00Z',
    1,
    null
  );

  update public.zones
  set is_active = false
  where id = '30000000-0000-4000-8000-000000000091';

  select *
  into stale_run_result
  from public.process_tracking_points_batch(5, 20);

  perform pg_temp.assert_true(
    stale_run_result.claimed_user_count = 1,
    format('Expected invalidation claimed_user_count = 1, got %s.', stale_run_result.claimed_user_count)
  );

  perform pg_temp.assert_true(
    stale_run_result.processed_point_count = 1,
    format('Expected invalidation processed_point_count = 1, got %s.', stale_run_result.processed_point_count)
  );

  perform pg_temp.assert_true(
    stale_run_result.created_event_count = 0,
    format('Invalid presence cleanup must not create public events, got %s.', stale_run_result.created_event_count)
  );

  perform pg_temp.assert_true(
    stale_run_result.stale_point_count = 0,
    format('Expected invalidation stale_point_count = 0, got %s.', stale_run_result.stale_point_count)
  );

  select count(*)
  into event_count
  from public.location_events
  where user_id = '00000000-0000-4000-8000-000000000091';

  perform pg_temp.assert_true(
    event_count = 1,
    format('Invalid presence cleanup must keep the public event count at 1, got %s.', event_count)
  );

  perform pg_temp.assert_true(
    not exists (
      select 1
      from public.user_zone_presence
      where user_id = '00000000-0000-4000-8000-000000000091'
        and zone_id = '30000000-0000-4000-8000-000000000091'
    ),
    'Expected invalid presence state to be cleared after zone deactivation.'
  );

  select last_captured_at, last_received_at, last_ingest_order, last_point_id
  into cursor_captured_at, cursor_received_at, cursor_ingest_order, cursor_point_id
  from public.tracking_user_cursors
  where user_id = '00000000-0000-4000-8000-000000000091';

  perform pg_temp.assert_true(
    cursor_captured_at = '2026-05-31T10:10:00Z'::timestamptz,
    format('Expected tie-break cursor captured_at = 2026-05-31T10:10:00Z, got %s.', cursor_captured_at)
  );

  perform pg_temp.assert_true(
    cursor_received_at = '2026-05-31T10:10:00Z'::timestamptz,
    format('Expected tie-break cursor received_at = 2026-05-31T10:10:00Z, got %s.', cursor_received_at)
  );

  perform pg_temp.assert_true(
    cursor_ingest_order = 1,
    format('Expected tie-break cursor ingest_order = 1, got %s.', cursor_ingest_order)
  );

  perform pg_temp.assert_true(
    cursor_point_id = '41000000-0000-4000-8000-000000000006'::uuid,
    format('Expected tie-break cursor point id to advance to point 6, got %s.', cursor_point_id)
  );
end;
$$;

rollback;
