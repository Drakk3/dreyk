create index idx_location_events_user on public.location_events(user_id);
create index idx_location_events_zone on public.location_events(zone_id);
create index idx_location_events_time on public.location_events(triggered_at desc);

create index idx_zones_group_active on public.zones(group_id, is_active);

create index idx_group_members_user on public.group_members(user_id);

create index idx_permissions_user_module on public.user_permissions(user_id, module_key);
