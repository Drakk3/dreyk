create table public.tracking_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ingest_order integer not null default 0,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters double precision,
  altitude_meters double precision,
  heading_degrees double precision,
  speed_meters_per_second double precision,
  captured_at timestamptz not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index tracking_points_user_captured_idx
  on public.tracking_points (user_id, captured_at desc, received_at desc, ingest_order desc, id desc);

create index tracking_points_unprocessed_idx
  on public.tracking_points (processed_at, captured_at, received_at, ingest_order, id);

alter table public.tracking_points enable row level security;

create policy "tracking_points: own read"
  on public.tracking_points
  for select
  using (auth.uid() = user_id);

create policy "tracking_points: admin read all"
  on public.tracking_points
  for select
  using (public.is_admin());
