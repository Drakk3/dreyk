create table public.alexa_triggers (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null unique references public.zones(id) on delete cascade,
  message_template text not null,
  alexa_device_id text not null,
  is_active boolean not null default true
);
