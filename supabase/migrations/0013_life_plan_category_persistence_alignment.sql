begin;

update public.life_plan_recurring_templates
set category = 'food'
where category = 'foodAndFuel';

update public.life_plan_recurring_templates
set category = 'education'
where category = 'tuition';

update public.life_plan_month_entries
set category = 'food'
where category = 'foodAndFuel';

update public.life_plan_month_entries
set category = 'education'
where category = 'tuition';

alter table public.life_plan_recurring_templates
  drop constraint if exists life_plan_recurring_templates_category_check,
  add constraint life_plan_recurring_templates_category_check
    check (
      category in (
        'debtPayment',
        'familySupport',
        'food',
        'gas',
        'housing',
        'income',
        'insurance',
        'investing',
        'savings',
        'subscription',
        'education',
        'utility',
        'other'
      )
    );

alter table public.life_plan_month_entries
  drop constraint if exists life_plan_month_entries_category_check,
  add constraint life_plan_month_entries_category_check
    check (
      category in (
        'debtPayment',
        'familySupport',
        'food',
        'gas',
        'housing',
        'income',
        'insurance',
        'investing',
        'savings',
        'subscription',
        'education',
        'utility',
        'other'
      )
    );

commit;
