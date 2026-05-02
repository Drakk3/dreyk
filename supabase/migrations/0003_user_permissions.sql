create table public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_key text not null,
  can_view boolean not null default false,
  can_interact boolean not null default false,
  granted_at timestamptz not null default now(),
  unique (user_id, module_key)
);
