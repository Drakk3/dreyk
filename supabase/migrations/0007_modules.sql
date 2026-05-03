create table public.modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  is_enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb
);
