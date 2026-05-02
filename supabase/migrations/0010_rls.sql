alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.user_permissions enable row level security;
alter table public.zones enable row level security;
alter table public.alexa_triggers enable row level security;
alter table public.location_events enable row level security;
alter table public.modules enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.requester_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = target_group_id and user_id = auth.uid()
  );
$$;

create or replace function public.can_access_zone(target_zone_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.zones
    where id = target_zone_id and public.is_group_member(group_id)
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.requester_role() to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.can_access_zone(uuid) to authenticated;

create policy "profiles: own read"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles: admin read all"
  on public.profiles
  for select
  using (public.is_admin());

create policy "profiles: own update"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.requester_role());

create policy "profiles: admin update all"
  on public.profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "groups: members read"
  on public.groups
  for select
  using (public.is_admin() or public.is_group_member(id));

create policy "groups: admin manage"
  on public.groups
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "group_members: own or admin read"
  on public.group_members
  for select
  using (public.is_admin() or auth.uid() = user_id);

create policy "group_members: admin manage"
  on public.group_members
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "user_permissions: own or admin read"
  on public.user_permissions
  for select
  using (public.is_admin() or auth.uid() = user_id);

create policy "user_permissions: admin manage"
  on public.user_permissions
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "zones: group members read"
  on public.zones
  for select
  using (public.is_admin() or public.is_group_member(group_id));

create policy "zones: admin manage"
  on public.zones
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "alexa_triggers: zone readers or admin read"
  on public.alexa_triggers
  for select
  using (public.is_admin() or public.can_access_zone(zone_id));

create policy "alexa_triggers: admin manage"
  on public.alexa_triggers
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "location_events: own read"
  on public.location_events
  for select
  using (auth.uid() = user_id);

create policy "location_events: admin read all"
  on public.location_events
  for select
  using (public.is_admin());

create policy "location_events: insert own"
  on public.location_events
  for insert
  with check (auth.uid() = user_id);

create policy "location_events: admin manage"
  on public.location_events
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "modules: authenticated read"
  on public.modules
  for select
  using (auth.role() = 'authenticated');

create policy "modules: admin manage"
  on public.modules
  for all
  using (public.is_admin())
  with check (public.is_admin());
