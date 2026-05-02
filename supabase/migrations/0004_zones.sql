create table public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null check (radius_meters > 0),
  is_active boolean not null default true,
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
