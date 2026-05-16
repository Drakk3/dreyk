create table public.life_plan_months (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  month_key text not null check (month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  currency_code text not null default 'USD' check (currency_code = 'USD'),
  seeded_from_month_id uuid references public.life_plan_months(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (id, owner_user_id),
  unique (owner_user_id, month_key)
);

create table public.life_plan_debt_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  creditor text not null,
  label text not null,
  balance_usd numeric(12, 2) not null check (balance_usd >= 0),
  minimum_payment_usd numeric(12, 2) check (minimum_payment_usd is null or minimum_payment_usd >= 0),
  apr_assumption_decimal numeric(9, 6) check (
    apr_assumption_decimal is null
    or (apr_assumption_decimal >= 0 and apr_assumption_decimal <= 1)
  ),
  confidence text not null check (confidence in ('verified', 'estimated', 'needsReview')),
  balance_confidence text not null check (balance_confidence in ('verified', 'estimated', 'needsReview')),
  apr_confidence text not null check (apr_confidence in ('verified', 'estimated', 'needsReview')),
  minimum_payment_confidence text not null check (
    minimum_payment_confidence in ('verified', 'estimated', 'needsReview')
  ),
  source_metadata jsonb not null default '{}'::jsonb,
  apr_source_context jsonb not null default '{}'::jsonb,
  is_excluded_from_payoff_line boolean not null default false,
  priority integer not null default 1 check (priority > 0),
  notes text,
  created_at timestamptz not null default now(),
  unique (id, owner_user_id)
);

create table public.life_plan_recurring_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  debt_account_id uuid,
  label text not null,
  category text not null check (
    category in (
      'debtPayment',
      'familySupport',
      'foodAndFuel',
      'housing',
      'income',
      'insurance',
      'subscription',
      'tuition',
      'utility',
      'other'
    )
  ),
  cadence text not null check (cadence in ('weekly', 'biweekly', 'monthly')),
  amount_usd numeric(12, 2) not null check (amount_usd > 0),
  scheduled_day integer not null check (scheduled_day >= 1 and scheduled_day <= 31),
  confidence text not null check (confidence in ('verified', 'estimated', 'needsReview')),
  source_metadata jsonb not null default '{}'::jsonb,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, owner_user_id),
  constraint life_plan_recurring_templates_debt_account_owner_fkey
    foreign key (debt_account_id, owner_user_id)
    references public.life_plan_debt_accounts(id, owner_user_id)
    on delete set null
);

create table public.life_plan_month_entries (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  month_id uuid not null,
  template_id uuid,
  debt_account_id uuid,
  kind text not null check (kind in ('income', 'expense', 'debt')),
  status text not null check (status in ('planned', 'done', 'skipped')),
  label text not null,
  category text not null check (
    category in (
      'debtPayment',
      'familySupport',
      'foodAndFuel',
      'housing',
      'income',
      'insurance',
      'subscription',
      'tuition',
      'utility',
      'other'
    )
  ),
  amount_usd numeric(12, 2) not null check (amount_usd > 0),
  entry_date date not null,
  confidence text not null check (confidence in ('verified', 'estimated', 'needsReview')),
  source_kind text not null check (source_kind in ('seed', 'generated', 'manual')),
  source_metadata jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  unique (id, owner_user_id),
  constraint life_plan_month_entries_month_owner_fkey
    foreign key (month_id, owner_user_id)
    references public.life_plan_months(id, owner_user_id)
    on delete cascade,
  constraint life_plan_month_entries_template_owner_fkey
    foreign key (template_id, owner_user_id)
    references public.life_plan_recurring_templates(id, owner_user_id)
    on delete set null,
  constraint life_plan_month_entries_debt_account_owner_fkey
    foreign key (debt_account_id, owner_user_id)
    references public.life_plan_debt_accounts(id, owner_user_id)
    on delete set null
);

create table public.life_plan_entry_status_history (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  entry_id uuid not null,
  from_status text not null check (from_status in ('planned', 'done', 'skipped')),
  to_status text not null check (to_status in ('planned', 'done', 'skipped')),
  reason text,
  changed_at timestamptz not null default now(),
  check (from_status <> to_status),
  constraint life_plan_entry_status_history_entry_owner_fkey
    foreign key (entry_id, owner_user_id)
    references public.life_plan_month_entries(id, owner_user_id)
    on delete cascade
);

create table public.life_plan_debt_payment_events (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  entry_id uuid not null,
  debt_account_id uuid not null,
  amount_usd numeric(12, 2) not null check (amount_usd > 0),
  payment_date date not null,
  balance_after_usd numeric(12, 2) check (balance_after_usd is null or balance_after_usd >= 0),
  notes text,
  created_at timestamptz not null default now(),
  unique (entry_id),
  constraint life_plan_debt_payment_events_entry_owner_fkey
    foreign key (entry_id, owner_user_id)
    references public.life_plan_month_entries(id, owner_user_id)
    on delete cascade,
  constraint life_plan_debt_payment_events_debt_account_owner_fkey
    foreign key (debt_account_id, owner_user_id)
    references public.life_plan_debt_accounts(id, owner_user_id)
    on delete cascade
);

create index idx_life_plan_months_owner_month
  on public.life_plan_months(owner_user_id, month_key);

create index idx_life_plan_debt_accounts_owner_priority
  on public.life_plan_debt_accounts(owner_user_id, priority);

create index idx_life_plan_recurring_templates_owner_active
  on public.life_plan_recurring_templates(owner_user_id, is_active);

create index idx_life_plan_month_entries_month_date
  on public.life_plan_month_entries(month_id, entry_date);

create index idx_life_plan_month_entries_owner_status
  on public.life_plan_month_entries(owner_user_id, status);

create index idx_life_plan_entry_status_history_entry_changed
  on public.life_plan_entry_status_history(entry_id, changed_at desc);

create index idx_life_plan_debt_payment_events_debt_account_date
  on public.life_plan_debt_payment_events(debt_account_id, payment_date desc);
