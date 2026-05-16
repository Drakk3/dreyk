-- Smoke verification for life-plan operating persistence.
-- Run after `supabase db reset` via `npm run smoke:life-plan-sql`.

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

create or replace function pg_temp.assert_owner_count(table_name text, owner_id uuid, expected_count bigint)
returns void
language plpgsql
as $$
declare
  actual_count bigint;
begin
  execute format(
    'select count(*) from public.%I where owner_user_id = %L',
    table_name,
    owner_id
  ) into actual_count;

  if actual_count <> expected_count then
    raise exception
      'Unexpected row count for public.%. Expected %, got %.',
      table_name,
      expected_count,
      actual_count;
  end if;
end;
$$;

create or replace function pg_temp.assert_hidden_and_immutable(table_name text, owner_id uuid)
returns void
language plpgsql
as $$
declare
  visible_rows bigint;
  affected_rows bigint;
begin
  execute format(
    'select count(*) from public.%I where owner_user_id = %L',
    table_name,
    owner_id
  ) into visible_rows;

  if visible_rows <> 0 then
    raise exception 'Cross-owner read leaked rows from public.%. Visible rows: %.', table_name, visible_rows;
  end if;

  execute format('delete from public.%I where owner_user_id = %L', table_name, owner_id);
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'Cross-owner delete touched rows in public.%. Deleted rows: %.', table_name, affected_rows;
  end if;
end;
$$;

create or replace function pg_temp.expect_failure(statement_sql text, description text)
returns void
language plpgsql
as $$
begin
  execute statement_sql;
  raise exception 'SMOKE_EXPECTED_FAILURE_NOT_RAISED: %', description;
exception
  when others then
    if position('SMOKE_EXPECTED_FAILURE_NOT_RAISED:' in SQLERRM) = 1 then
      raise;
    end if;
end;
$$;

create or replace function pg_temp.set_authenticated_context(user_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', user_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', user_id::text,
      'role', 'authenticated',
      'aud', 'authenticated'
    )::text,
    true
  );
end;
$$;

do $$
declare
  table_name text;
  required_tables constant text[] := array[
    'life_plan_months',
    'life_plan_debt_accounts',
    'life_plan_recurring_templates',
    'life_plan_month_entries',
    'life_plan_entry_status_history',
    'life_plan_debt_payment_events'
  ];
  rls_enabled boolean;
begin
  foreach table_name in array required_tables loop
    perform pg_temp.assert_true(
      to_regclass(format('public.%I', table_name)) is not null,
      format('Missing required table public.%I.', table_name)
    );

    select c.relrowsecurity
    into rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = table_name;

    perform pg_temp.assert_true(
      rls_enabled is true,
      format('Row level security is not enabled on public.%I.', table_name)
    );
  end loop;
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
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-4000-8000-0000000000a1',
    'authenticated',
    'authenticated',
    'life-plan-smoke-owner-a@example.com',
    crypt('life-plan-smoke-password', gen_salt('bf')),
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
    '00000000-0000-4000-8000-0000000000b1',
    'authenticated',
    'authenticated',
    'life-plan-smoke-owner-b@example.com',
    crypt('life-plan-smoke-password', gen_salt('bf')),
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

insert into public.profiles (id, display_name, role)
values
  ('00000000-0000-4000-8000-0000000000a1', 'Life Plan Smoke Owner A', 'user'),
  ('00000000-0000-4000-8000-0000000000b1', 'Life Plan Smoke Owner B', 'user')
on conflict (id) do update set
  display_name = excluded.display_name,
  role = excluded.role;

set local role authenticated;

select pg_temp.set_authenticated_context('00000000-0000-4000-8000-0000000000a1');

insert into public.life_plan_months (id, owner_user_id, month_key)
values ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1', '2026-05');

insert into public.life_plan_debt_accounts (
  id,
  owner_user_id,
  creditor,
  label,
  balance_usd,
  minimum_payment_usd,
  apr_assumption_decimal,
  confidence,
  balance_confidence,
  apr_confidence,
  minimum_payment_confidence,
  priority
) values (
  '20000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-0000000000a1',
  'Banco A',
  'Card A',
  1200.00,
  75.00,
  0.250000,
  'verified',
  'verified',
  'estimated',
  'verified',
  1
);

insert into public.life_plan_recurring_templates (
  id,
  owner_user_id,
  debt_account_id,
  label,
  category,
  cadence,
  amount_usd,
  scheduled_day,
  confidence
) values (
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-0000000000a1',
  '20000000-0000-4000-8000-000000000001',
  'Card Payment A',
  'debtPayment',
  'monthly',
  75.00,
  5,
  'verified'
);

insert into public.life_plan_month_entries (
  id,
  owner_user_id,
  month_id,
  template_id,
  debt_account_id,
  kind,
  status,
  label,
  category,
  amount_usd,
  entry_date,
  confidence,
  source_kind
) values (
  '40000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-0000000000a1',
  '10000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'debt',
  'planned',
  'Payment A',
  'debtPayment',
  75.00,
  date '2026-05-05',
  'verified',
  'manual'
);

insert into public.life_plan_entry_status_history (
  id,
  owner_user_id,
  entry_id,
  from_status,
  to_status,
  reason
) values (
  '50000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-0000000000a1',
  '40000000-0000-4000-8000-000000000001',
  'planned',
  'done',
  'Smoke verification owner A'
);

insert into public.life_plan_debt_payment_events (
  id,
  owner_user_id,
  entry_id,
  debt_account_id,
  amount_usd,
  payment_date,
  balance_after_usd,
  notes
) values (
  '60000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-0000000000a1',
  '40000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  75.00,
  date '2026-05-05',
  1125.00,
  'Smoke verification owner A'
);

select pg_temp.assert_owner_count('life_plan_months', '00000000-0000-4000-8000-0000000000a1', 1);
select pg_temp.assert_owner_count('life_plan_debt_accounts', '00000000-0000-4000-8000-0000000000a1', 1);
select pg_temp.assert_owner_count('life_plan_recurring_templates', '00000000-0000-4000-8000-0000000000a1', 1);
select pg_temp.assert_owner_count('life_plan_month_entries', '00000000-0000-4000-8000-0000000000a1', 1);
select pg_temp.assert_owner_count('life_plan_entry_status_history', '00000000-0000-4000-8000-0000000000a1', 1);
select pg_temp.assert_owner_count('life_plan_debt_payment_events', '00000000-0000-4000-8000-0000000000a1', 1);

select pg_temp.set_authenticated_context('00000000-0000-4000-8000-0000000000b1');

select pg_temp.assert_hidden_and_immutable('life_plan_months', '00000000-0000-4000-8000-0000000000a1');
select pg_temp.assert_hidden_and_immutable('life_plan_debt_accounts', '00000000-0000-4000-8000-0000000000a1');
select pg_temp.assert_hidden_and_immutable('life_plan_recurring_templates', '00000000-0000-4000-8000-0000000000a1');
select pg_temp.assert_hidden_and_immutable('life_plan_month_entries', '00000000-0000-4000-8000-0000000000a1');
select pg_temp.assert_hidden_and_immutable('life_plan_entry_status_history', '00000000-0000-4000-8000-0000000000a1');
select pg_temp.assert_hidden_and_immutable('life_plan_debt_payment_events', '00000000-0000-4000-8000-0000000000a1');

insert into public.life_plan_months (id, owner_user_id, month_key)
values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000b1', '2026-06');

insert into public.life_plan_debt_accounts (
  id,
  owner_user_id,
  creditor,
  label,
  balance_usd,
  minimum_payment_usd,
  apr_assumption_decimal,
  confidence,
  balance_confidence,
  apr_confidence,
  minimum_payment_confidence,
  priority
) values (
  '20000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-0000000000b1',
  'Banco B',
  'Card B',
  800.00,
  50.00,
  0.180000,
  'verified',
  'verified',
  'verified',
  'verified',
  1
);

insert into public.life_plan_recurring_templates (
  id,
  owner_user_id,
  debt_account_id,
  label,
  category,
  cadence,
  amount_usd,
  scheduled_day,
  confidence
) values (
  '30000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-0000000000b1',
  '20000000-0000-4000-8000-000000000002',
  'Card Payment B',
  'debtPayment',
  'monthly',
  50.00,
  10,
  'verified'
);

insert into public.life_plan_month_entries (
  id,
  owner_user_id,
  month_id,
  template_id,
  debt_account_id,
  kind,
  status,
  label,
  category,
  amount_usd,
  entry_date,
  confidence,
  source_kind
) values (
  '40000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-0000000000b1',
  '10000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000002',
  'debt',
  'planned',
  'Payment B',
  'debtPayment',
  50.00,
  date '2026-06-10',
  'verified',
  'manual'
);

select pg_temp.expect_failure(
  $$
    insert into public.life_plan_recurring_templates (
      id,
      owner_user_id,
      debt_account_id,
      label,
      category,
      cadence,
      amount_usd,
      scheduled_day,
      confidence
    ) values (
      '30000000-0000-4000-8000-000000000012',
      '00000000-0000-4000-8000-0000000000b1',
      '20000000-0000-4000-8000-000000000001',
      'Cross Owner Template Debt',
      'debtPayment',
      'monthly',
      50.00,
      15,
      'verified'
    )
  $$,
  'Cross-owner recurring template debt-account reference'
);

select pg_temp.expect_failure(
  $$
    insert into public.life_plan_month_entries (
      id,
      owner_user_id,
      month_id,
      kind,
      status,
      label,
      category,
      amount_usd,
      entry_date,
      confidence,
      source_kind
    ) values (
      '40000000-0000-4000-8000-000000000012',
      '00000000-0000-4000-8000-0000000000b1',
      '10000000-0000-4000-8000-000000000001',
      'expense',
      'planned',
      'Cross Owner Month Reference',
      'other',
      10.00,
      date '2026-06-11',
      'verified',
      'manual'
    )
  $$,
  'Cross-owner month reference'
);

select pg_temp.expect_failure(
  $$
    insert into public.life_plan_month_entries (
      id,
      owner_user_id,
      month_id,
      template_id,
      kind,
      status,
      label,
      category,
      amount_usd,
      entry_date,
      confidence,
      source_kind
    ) values (
      '40000000-0000-4000-8000-000000000013',
      '00000000-0000-4000-8000-0000000000b1',
      '10000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000001',
      'expense',
      'planned',
      'Cross Owner Template Reference',
      'other',
      10.00,
      date '2026-06-12',
      'verified',
      'manual'
    )
  $$,
  'Cross-owner template reference'
);

select pg_temp.expect_failure(
  $$
    insert into public.life_plan_month_entries (
      id,
      owner_user_id,
      month_id,
      debt_account_id,
      kind,
      status,
      label,
      category,
      amount_usd,
      entry_date,
      confidence,
      source_kind
    ) values (
      '40000000-0000-4000-8000-000000000014',
      '00000000-0000-4000-8000-0000000000b1',
      '10000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000001',
      'expense',
      'planned',
      'Cross Owner Debt Account Reference',
      'other',
      10.00,
      date '2026-06-13',
      'verified',
      'manual'
    )
  $$,
  'Cross-owner month-entry debt-account reference'
);

select pg_temp.expect_failure(
  $$
    insert into public.life_plan_entry_status_history (
      id,
      owner_user_id,
      entry_id,
      from_status,
      to_status,
      reason
    ) values (
      '50000000-0000-4000-8000-000000000012',
      '00000000-0000-4000-8000-0000000000b1',
      '40000000-0000-4000-8000-000000000001',
      'planned',
      'done',
      'Cross owner history reference'
    )
  $$,
  'Cross-owner status-history entry reference'
);

select pg_temp.expect_failure(
  $$
    insert into public.life_plan_debt_payment_events (
      id,
      owner_user_id,
      entry_id,
      debt_account_id,
      amount_usd,
      payment_date
    ) values (
      '60000000-0000-4000-8000-000000000012',
      '00000000-0000-4000-8000-0000000000b1',
      '40000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000002',
      50.00,
      date '2026-06-14'
    )
  $$,
  'Cross-owner debt-payment entry reference'
);

select pg_temp.expect_failure(
  $$
    insert into public.life_plan_debt_payment_events (
      id,
      owner_user_id,
      entry_id,
      debt_account_id,
      amount_usd,
      payment_date
    ) values (
      '60000000-0000-4000-8000-000000000013',
      '00000000-0000-4000-8000-0000000000b1',
      '40000000-0000-4000-8000-000000000002',
      '20000000-0000-4000-8000-000000000001',
      50.00,
      date '2026-06-15'
    )
  $$,
  'Cross-owner debt-payment debt-account reference'
);

rollback;
