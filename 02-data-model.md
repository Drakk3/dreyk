# dreyk — Data Model

> **Document version:** 1.0
> **Status:** Base definition — pre-code
>
> ### Update policy
> This document may be updated once the codebase is running.
> **No changes may be applied without explicit confirmation from @drakk3 (David).**
> Proposed updates must be presented as a diff of the affected section,
> with a reason for the change. Update is only valid after verbal or written approval.

---

## Table creation order

Create in this order to satisfy FK dependencies:

1. `profiles`
2. `groups`
3. `group_members`
4. `user_permissions`
5. `zones`
6. `alexa_triggers`
7. `location_events`
8. `modules`

---

## SQL — table definitions

```sql
-- 1. profiles (extends auth.users)
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  role          text not null default 'user' check (role in ('admin', 'user')),
  avatar_url    text,
  theme_preference text not null default 'ares' check (theme_preference in ('ares', 'tron', 'clu', 'athena', 'aphrodite', 'poseidon')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- 2. groups
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- 3. group_members
create table public.group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

-- 4. user_permissions
create table public.user_permissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  module_key    text not null,
  can_view      boolean not null default false,
  can_interact  boolean not null default false,
  granted_at    timestamptz not null default now(),
  unique (user_id, module_key)
);

-- 5. zones
create table public.zones (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  latitude       double precision not null,
  longitude      double precision not null,
  radius_meters  integer not null check (radius_meters > 0),
  is_active      boolean not null default true,
  group_id       uuid not null references public.groups(id) on delete cascade,
  created_by     uuid not null references public.profiles(id),
  created_at     timestamptz not null default now()
);

-- 6. alexa_triggers
create table public.alexa_triggers (
  id               uuid primary key default gen_random_uuid(),
  zone_id          uuid not null unique references public.zones(id) on delete cascade,
  message_template text not null,
  alexa_device_id  text not null,
  is_active        boolean not null default true
);

-- 7. location_events
create table public.location_events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  zone_id          uuid not null references public.zones(id) on delete cascade,
  event_type       text not null check (event_type in ('enter', 'exit')),
  latitude         double precision not null,
  longitude        double precision not null,
  distance_meters  integer not null,
  triggered_at     timestamptz not null default now()
);

-- 8. modules
create table public.modules (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  name        text not null,
  is_enabled  boolean not null default true,
  config      jsonb not null default '{}'
);

-- Seed: geofencing module
insert into public.modules (key, name, is_enabled)
values ('geofencing', 'Geofencing', true);
```

Forward migration `supabase/migrations/0008_gridcn_theme_preference.sql` normalizes any persisted `profiles.theme_preference` value outside the canonical set to `ares` before reapplying the canonical constraint.

---

## Indexes

```sql
-- location_events — most frequent query pattern
create index idx_location_events_user    on public.location_events(user_id);
create index idx_location_events_zone    on public.location_events(zone_id);
create index idx_location_events_time    on public.location_events(triggered_at desc);

-- zones — active zones for a group (called on every GPS update)
create index idx_zones_group_active      on public.zones(group_id, is_active);

-- group_members — find groups for a user
create index idx_group_members_user      on public.group_members(user_id);

-- user_permissions — check permissions by user + module
create index idx_permissions_user_module on public.user_permissions(user_id, module_key);
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
alter table public.profiles         enable row level security;
alter table public.groups           enable row level security;
alter table public.group_members    enable row level security;
alter table public.user_permissions enable row level security;
alter table public.zones            enable row level security;
alter table public.alexa_triggers   enable row level security;
alter table public.location_events  enable row level security;
alter table public.modules          enable row level security;

-- profiles: users can read their own, admin reads all
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: admin read all"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id);

-- zones: members of the group can read, admin can write
create policy "zones: group members read"
  on public.zones for select
  using (exists (
    select 1 from public.group_members
    where group_id = zones.group_id and user_id = auth.uid()
  ));

create policy "zones: admin write"
  on public.zones for all
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

-- location_events: own events only, admin reads all
create policy "location_events: own read"
  on public.location_events for select
  using (auth.uid() = user_id);

create policy "location_events: admin read all"
  on public.location_events for select
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "location_events: insert own"
  on public.location_events for insert
  with check (auth.uid() = user_id);
```

---

## TypeScript types

```ts
// shared/types/database.ts
// Manually maintained until Supabase CLI type generation is set up

export type Role = 'admin' | 'user';
export type ThemeName = 'ares' | 'tron' | 'clu' | 'athena' | 'aphrodite' | 'poseidon';
export type EventType = 'enter' | 'exit';

export interface Profile {
  id:                 string;
  display_name:       string;
  role:               Role;
  avatar_url:         string | null;
  theme_preference:   ThemeName;
  is_active:          boolean;
  created_at:         string;
}

export interface Group {
  id:          string;
  name:        string;
  description: string | null;
  created_by:  string;
  created_at:  string;
}

export interface GroupMember {
  id:        string;
  group_id:  string;
  user_id:   string;
  joined_at: string;
}

export interface UserPermission {
  id:           string;
  user_id:      string;
  module_key:   string;
  can_view:     boolean;
  can_interact: boolean;
  granted_at:   string;
}

export interface Zone {
  id:             string;
  name:           string;
  latitude:       number;
  longitude:      number;
  radius_meters:  number;
  is_active:      boolean;
  group_id:       string;
  created_by:     string;
  created_at:     string;
}

export interface AlexaTrigger {
  id:               string;
  zone_id:          string;
  message_template: string;
  alexa_device_id:  string;
  is_active:        boolean;
}

export interface LocationEvent {
  id:              string;
  user_id:         string;
  zone_id:         string;
  event_type:      EventType;
  latitude:        number;
  longitude:       number;
  distance_meters: number;
  triggered_at:    string;
}

export interface Module {
  id:         string;
  key:        string;
  name:       string;
  is_enabled: boolean;
  config:     Record<string, unknown>;
}
```
