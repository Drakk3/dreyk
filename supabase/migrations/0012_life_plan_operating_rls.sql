alter table public.life_plan_months enable row level security;
alter table public.life_plan_debt_accounts enable row level security;
alter table public.life_plan_recurring_templates enable row level security;
alter table public.life_plan_month_entries enable row level security;
alter table public.life_plan_entry_status_history enable row level security;
alter table public.life_plan_debt_payment_events enable row level security;

create policy "life_plan_months: owner manage"
  on public.life_plan_months
  for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "life_plan_debt_accounts: owner manage"
  on public.life_plan_debt_accounts
  for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "life_plan_recurring_templates: owner manage"
  on public.life_plan_recurring_templates
  for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "life_plan_month_entries: owner manage"
  on public.life_plan_month_entries
  for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "life_plan_entry_status_history: owner manage"
  on public.life_plan_entry_status_history
  for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "life_plan_debt_payment_events: owner manage"
  on public.life_plan_debt_payment_events
  for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());
