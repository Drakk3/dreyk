create table public.location_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  zone_id uuid not null references public.zones(id) on delete cascade,
  event_type text not null check (event_type in ('enter', 'exit')),
  latitude double precision not null,
  longitude double precision not null,
  distance_meters integer not null,
  triggered_at timestamptz not null default now()
);
