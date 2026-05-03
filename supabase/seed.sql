insert into public.modules (key, name, is_enabled)
values ('geofencing', 'Geofencing', true)
on conflict (key)
do update set
  name = excluded.name,
  is_enabled = excluded.is_enabled;