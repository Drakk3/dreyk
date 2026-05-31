-- Smoke verification for tracking_points retention cleanup.
-- Run against a local Supabase stack after migrations are applied.

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
  '00000000-0000-4000-8000-0000000000a1',
  'authenticated',
  'authenticated',
  'tracking-retention-smoke@example.com',
  crypt('tracking-retention-smoke-password', gen_salt('bf')),
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
values ('00000000-0000-4000-8000-0000000000a1', 'Tracking Retention Smoke', 'user')
on conflict (id) do update set
  display_name = excluded.display_name,
  role = excluded.role,
  is_active = true;

do $$
declare
  cleanup_sql text;
  scheduled_command text;
  deleted_processed_count_value integer;
  deleted_expired_count_value integer;
  remaining_count bigint;
  old_remaining_count bigint;
begin
  perform pg_temp.assert_true(
    to_regprocedure('public.cleanup_tracking_points()') is not null,
    'Missing function public.cleanup_tracking_points().'
  );

  perform pg_temp.assert_true(
    exists (select 1 from pg_extension where extname = 'pg_cron'),
    'Missing pg_cron extension.'
  );

  select pg_get_functiondef('public.cleanup_tracking_points()'::regprocedure)
  into cleanup_sql;

  perform pg_temp.assert_true(
    position('location_events' in lower(cleanup_sql)) = 0,
    'cleanup_tracking_points() must not reference location_events.'
  );

  perform pg_temp.assert_true(
    position('zone' in lower(cleanup_sql)) = 0,
    'cleanup_tracking_points() must not reference zone logic.'
  );

  select command
  into scheduled_command
  from cron.job
  where jobname = 'tracking-points-retention-every-15-minutes';

  perform pg_temp.assert_true(
    scheduled_command = 'select public.cleanup_tracking_points();',
    'Unexpected pg_cron command for tracking_points retention.'
  );

  insert into public.tracking_points (
    id,
    user_id,
    latitude,
    longitude,
    captured_at,
    received_at,
    processed_at
  ) values
    (
      '51000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-0000000000a1',
      -34.6037,
      -58.3816,
      now() - interval '2 days',
      now() - interval '2 days',
      now() - interval '2 hours'
    ),
    (
      '51000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-0000000000a1',
      -34.6037,
      -58.3816,
      now() - interval '8 days',
      now() - interval '8 days',
      null
    ),
    (
      '51000000-0000-4000-8000-000000000003',
      '00000000-0000-4000-8000-0000000000a1',
      -34.6037,
      -58.3816,
      now() - interval '8 days',
      now() - interval '8 days',
      now() - interval '2 hours'
    ),
    (
      '51000000-0000-4000-8000-000000000004',
      '00000000-0000-4000-8000-0000000000a1',
      -34.6037,
      -58.3816,
      now() - interval '1 day',
      now() - interval '1 day',
      now() - interval '15 minutes'
    ),
    (
      '51000000-0000-4000-8000-000000000005',
      '00000000-0000-4000-8000-0000000000a1',
      -34.6037,
      -58.3816,
      now() - interval '3 days',
      now() - interval '3 days',
      null
    );

  select deleted_processed_count, deleted_expired_count
  into deleted_processed_count_value, deleted_expired_count_value
  from public.cleanup_tracking_points();

  perform pg_temp.assert_true(
    deleted_processed_count_value = 2,
    format('Expected 2 processed rows deleted first, got %s.', deleted_processed_count_value)
  );

  perform pg_temp.assert_true(
    deleted_expired_count_value = 1,
    format('Expected 1 expired unprocessed row deleted, got %s.', deleted_expired_count_value)
  );

  select count(*)
  into remaining_count
  from public.tracking_points
  where id in (
    '51000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000002',
    '51000000-0000-4000-8000-000000000003',
    '51000000-0000-4000-8000-000000000004',
    '51000000-0000-4000-8000-000000000005'
  );

  perform pg_temp.assert_true(
    remaining_count = 2,
    format('Expected 2 younger rows to remain, got %s.', remaining_count)
  );

  perform pg_temp.assert_true(
    exists (
      select 1
      from public.tracking_points
      where id = '51000000-0000-4000-8000-000000000004'
        and processed_at is not null
    ),
    'Recently processed row should remain until the quick-delete grace window expires.'
  );

  perform pg_temp.assert_true(
    exists (
      select 1
      from public.tracking_points
      where id = '51000000-0000-4000-8000-000000000005'
        and processed_at is null
    ),
    'Younger unprocessed row should remain before 7 days.'
  );

  select count(*)
  into old_remaining_count
  from public.tracking_points
  where id in (
      '51000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000002',
      '51000000-0000-4000-8000-000000000003'
    );

  perform pg_temp.assert_true(
    old_remaining_count = 0,
    format('Expected all processed-old/expired rows gone, got %s remaining.', old_remaining_count)
  );

  select count(*)
  into old_remaining_count
  from public.tracking_points
  where captured_at <= now() - interval '7 days';

  perform pg_temp.assert_true(
    old_remaining_count = 0,
    format('Expected 0 rows older than 7 days after cleanup, got %s.', old_remaining_count)
  );
end;
$$;

rollback;
