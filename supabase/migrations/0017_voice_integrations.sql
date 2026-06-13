create type public.alexa_linkage_status as enum ('pending', 'linked', 'unlinked');

create type public.alexa_notification_permission_status as enum ('unknown', 'granted', 'denied');

create type public.alexa_notification_subscription_status as enum ('unknown', 'subscribed', 'unsubscribed');

create type public.alexa_readiness_status as enum ('pending', 'ready', 'permission_missing', 'unsubscribed', 'unlinked', 'failed');

create type public.alexa_workflow_key as enum ('zone-enter-notification', 'zone-exit-notification');

create type public.alexa_delivery_status as enum ('pending', 'sent', 'failed', 'skipped');

create table public.alexa_linked_users (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  alexa_user_reference text not null unique,
  linkage_status public.alexa_linkage_status not null default 'pending',
  notification_permission_status public.alexa_notification_permission_status not null default 'unknown',
  notification_subscription_status public.alexa_notification_subscription_status not null default 'unknown',
  readiness_status public.alexa_readiness_status not null default 'pending',
  locale text null,
  last_skill_event_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.alexa_triggers
  add column linked_user_id uuid null references public.alexa_linked_users(id) on delete set null,
  add column workflow_key public.alexa_workflow_key not null default 'zone-enter-notification';

create table public.alexa_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  alexa_trigger_id uuid not null references public.alexa_triggers(id) on delete cascade,
  alexa_linked_user_id uuid not null references public.alexa_linked_users(id) on delete cascade,
  location_event_id uuid not null references public.location_events(id) on delete cascade,
  workflow_key public.alexa_workflow_key not null,
  idempotency_key text not null unique,
  status public.alexa_delivery_status not null default 'pending',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  provider_message_id text null,
  failure_reason text null,
  last_attempted_at timestamptz null,
  delivered_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_event_id, alexa_linked_user_id, workflow_key)
);

create index idx_alexa_triggers_linked_user
  on public.alexa_triggers (linked_user_id)
  where linked_user_id is not null;

create index idx_alexa_linked_users_readiness
  on public.alexa_linked_users (readiness_status, updated_at desc);

create index idx_alexa_delivery_attempts_status_created
  on public.alexa_delivery_attempts (status, created_at desc);

create index idx_alexa_delivery_attempts_location_event
  on public.alexa_delivery_attempts (location_event_id, workflow_key);

alter table public.alexa_linked_users enable row level security;
alter table public.alexa_delivery_attempts enable row level security;

revoke all on table public.alexa_linked_users from anon, authenticated;
revoke all on table public.alexa_delivery_attempts from anon, authenticated;

grant select, insert, update, delete on table public.alexa_linked_users to service_role;
grant select, insert, update, delete on table public.alexa_delivery_attempts to service_role;

create policy "alexa_linked_users: own read"
  on public.alexa_linked_users
  for select
  using (auth.uid() = profile_id);

create policy "alexa_linked_users: admin read all"
  on public.alexa_linked_users
  for select
  using (public.is_admin());

create policy "alexa_linked_users: admin manage"
  on public.alexa_linked_users
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "alexa_delivery_attempts: admin read all"
  on public.alexa_delivery_attempts
  for select
  using (public.is_admin());

create policy "alexa_delivery_attempts: admin manage"
  on public.alexa_delivery_attempts
  for all
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.alexa_linked_users is
  'Phase 11 Alexa linkage state for installable skill users, including notification permission and subscription readiness.';

comment on table public.alexa_delivery_attempts is
  'Phase 11 delivery audit log for Alexa Proactive Events, including retries, failure visibility, and idempotency.';

comment on column public.alexa_linked_users.alexa_user_reference is
  'Provider-facing Alexa user reference persisted after account linking or subscription events.';

comment on column public.alexa_linked_users.readiness_status is
  'Operator-facing Alexa readiness state used to decide whether a zone can receive Proactive Events delivery.';

comment on column public.alexa_triggers.linked_user_id is
  'Linked Alexa identity targeted by this zone trigger for the first Phase 11 release.';

comment on column public.alexa_triggers.workflow_key is
  'Configured Alexa workflow for this trigger; starts with zone enter/exit notification variants.';

comment on column public.alexa_delivery_attempts.idempotency_key is
  'Stable key derived from location event plus workflow intent to suppress duplicate Amazon delivery attempts.';
