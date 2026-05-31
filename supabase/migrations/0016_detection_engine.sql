create extension if not exists pg_cron;

create table public.tracking_user_cursors (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_captured_at timestamptz not null,
  last_received_at timestamptz not null,
  last_ingest_order integer not null,
  last_point_id uuid not null,
  updated_at timestamptz not null default now()
);

create table public.user_zone_presence (
  user_id uuid not null references public.profiles(id) on delete cascade,
  zone_id uuid not null references public.zones(id) on delete cascade,
  entered_at timestamptz not null,
  last_point_id uuid not null,
  primary key (user_id, zone_id)
);

create index tracking_user_cursors_updated_idx
  on public.tracking_user_cursors (updated_at desc, user_id);

create index user_zone_presence_zone_user_idx
  on public.user_zone_presence (zone_id, user_id);

create index tracking_points_unprocessed_claim_idx
  on public.tracking_points (captured_at asc, received_at asc, ingest_order asc, id asc, user_id)
  where processed_at is null;

create index tracking_points_unprocessed_user_order_idx
  on public.tracking_points (user_id, captured_at asc, received_at asc, ingest_order asc, id asc)
  where processed_at is null;

revoke all on table public.tracking_user_cursors from anon, authenticated;
revoke all on table public.user_zone_presence from anon, authenticated;

grant select, insert, update, delete on table public.tracking_user_cursors to service_role;
grant select, insert, update, delete on table public.user_zone_presence to service_role;

comment on table public.tracking_user_cursors is
  'Internal Phase 9 detection engine cursor state; keeps each user on a monotonic captured_at + received_at + ingest_order + point-id boundary while leaving location_events unchanged.';

comment on table public.user_zone_presence is
  'Internal Phase 9 detection engine zone-membership cache; stores only the current user-zone presence state needed to derive transition-only location_events.';

comment on column public.tracking_user_cursors.last_point_id is
  'Last successfully processed tracking_points.id for the user cursor; stored without a foreign key so raw-point retention can delete old rows safely.';

comment on column public.tracking_user_cursors.last_received_at is
  'Last successfully processed tracking_points.received_at for the user cursor; breaks captured_at ties before consulting ingest_order and point id.';

comment on column public.tracking_user_cursors.last_ingest_order is
  'Last successfully processed tracking_points.ingest_order for the user cursor; preserves client batch order when captured_at and received_at are identical.';

comment on column public.user_zone_presence.last_point_id is
  'Most recent tracking_points.id that confirmed the user-zone presence state; stored without a foreign key so retention cleanup cannot block deletes.';

create or replace function public.calculate_zone_distance_meters(
  point_latitude double precision,
  point_longitude double precision,
  zone_latitude double precision,
  zone_longitude double precision
)
returns integer
language sql
immutable
strict
as $$
  select round(
    6371000::double precision
    * 2
    * asin(
      least(
        1::double precision,
        sqrt(
          power(sin(radians(zone_latitude - point_latitude) / 2), 2)
          + cos(radians(point_latitude))
          * cos(radians(zone_latitude))
          * power(sin(radians(zone_longitude - point_longitude) / 2), 2)
        )
      )
    )
  )::integer;
$$;

create or replace function public.process_tracking_points_batch(
  user_batch_limit integer default 25,
  point_batch_limit integer default 200
)
returns table (
  claimed_user_count integer,
  processed_point_count integer,
  created_event_count integer,
  stale_point_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_user_count_value integer := 0;
  processed_point_count_value integer := 0;
  created_event_count_value integer := 0;
  stale_point_count_value integer := 0;
  processed_at_value timestamptz := now();
  candidate_user record;
  tracking_point_row record;
  zone_row record;
  cursor_row public.tracking_user_cursors%rowtype;
  distance_meters_value integer;
  is_inside_zone boolean;
  was_inside_zone boolean;
begin
  for candidate_user in
    select candidate.user_id
    from (
      select distinct on (tracking_point.user_id)
        tracking_point.user_id,
        tracking_point.captured_at,
        tracking_point.received_at,
        tracking_point.ingest_order,
        tracking_point.id
      from public.tracking_points as tracking_point
      where tracking_point.processed_at is null
      order by tracking_point.user_id, tracking_point.captured_at asc, tracking_point.received_at asc, tracking_point.ingest_order asc, tracking_point.id asc
    ) as candidate
    order by candidate.captured_at asc, candidate.received_at asc, candidate.ingest_order asc, candidate.id asc, candidate.user_id asc
    limit greatest(coalesce(user_batch_limit, 0), 0)
  loop
    if pg_try_advisory_xact_lock(hashtext(candidate_user.user_id::text)::bigint) = false then
      continue;
    end if;

    claimed_user_count_value := claimed_user_count_value + 1;

    for tracking_point_row in
      select
        tracking_point.id,
        tracking_point.user_id,
        tracking_point.latitude,
        tracking_point.longitude,
        tracking_point.captured_at,
        tracking_point.received_at,
        tracking_point.ingest_order
      from public.tracking_points as tracking_point
      where tracking_point.user_id = candidate_user.user_id
        and tracking_point.processed_at is null
      order by tracking_point.captured_at asc, tracking_point.received_at asc, tracking_point.ingest_order asc, tracking_point.id asc
      limit greatest(coalesce(point_batch_limit, 0), 0)
    loop
      select *
      into cursor_row
      from public.tracking_user_cursors
      where user_id = tracking_point_row.user_id;

      if found
        and (
          tracking_point_row.captured_at < cursor_row.last_captured_at
          or (
            tracking_point_row.captured_at = cursor_row.last_captured_at
            and (
              tracking_point_row.received_at < cursor_row.last_received_at
              or (
                tracking_point_row.received_at = cursor_row.last_received_at
                and (
                  tracking_point_row.ingest_order < cursor_row.last_ingest_order
                  or (
                    tracking_point_row.ingest_order = cursor_row.last_ingest_order
                    and tracking_point_row.id <= cursor_row.last_point_id
                  )
                )
              )
            )
          )
        ) then
        update public.tracking_points
        set processed_at = processed_at_value
        where id = tracking_point_row.id;

        processed_point_count_value := processed_point_count_value + 1;
        stale_point_count_value := stale_point_count_value + 1;
        continue;
      end if;

      for zone_row in
        select
          zone.id,
          zone.latitude,
          zone.longitude
        from public.user_zone_presence as user_zone_presence
        inner join public.zones as zone
          on zone.id = user_zone_presence.zone_id
        left join public.group_members as group_member
          on group_member.group_id = zone.group_id
         and group_member.user_id = tracking_point_row.user_id
        where user_zone_presence.user_id = tracking_point_row.user_id
          and (zone.is_active = false or group_member.user_id is null)
        order by zone.id asc
      loop
        delete from public.user_zone_presence
        where user_id = tracking_point_row.user_id
          and zone_id = zone_row.id;
      end loop;

      for zone_row in
        select
          zone.id,
          zone.latitude,
          zone.longitude,
          zone.radius_meters
        from public.zones as zone
        inner join public.group_members as group_member
          on group_member.group_id = zone.group_id
        where group_member.user_id = tracking_point_row.user_id
          and zone.is_active = true
        order by zone.id asc
      loop
        distance_meters_value := public.calculate_zone_distance_meters(
          tracking_point_row.latitude,
          tracking_point_row.longitude,
          zone_row.latitude,
          zone_row.longitude
        );
        is_inside_zone := distance_meters_value <= zone_row.radius_meters;

        select exists (
          select 1
          from public.user_zone_presence as user_zone_presence
          where user_zone_presence.user_id = tracking_point_row.user_id
            and user_zone_presence.zone_id = zone_row.id
        )
        into was_inside_zone;

        if is_inside_zone and was_inside_zone = false then
          insert into public.location_events (
            user_id,
            zone_id,
            event_type,
            latitude,
            longitude,
            distance_meters,
            triggered_at
          )
          values (
            tracking_point_row.user_id,
            zone_row.id,
            'enter',
            tracking_point_row.latitude,
            tracking_point_row.longitude,
            distance_meters_value,
            tracking_point_row.captured_at
          );

          insert into public.user_zone_presence (
            user_id,
            zone_id,
            entered_at,
            last_point_id
          )
          values (
            tracking_point_row.user_id,
            zone_row.id,
            tracking_point_row.captured_at,
            tracking_point_row.id
          )
          on conflict (user_id, zone_id) do update
          set entered_at = excluded.entered_at,
              last_point_id = excluded.last_point_id;

          created_event_count_value := created_event_count_value + 1;
        elseif is_inside_zone = false and was_inside_zone then
          insert into public.location_events (
            user_id,
            zone_id,
            event_type,
            latitude,
            longitude,
            distance_meters,
            triggered_at
          )
          values (
            tracking_point_row.user_id,
            zone_row.id,
            'exit',
            tracking_point_row.latitude,
            tracking_point_row.longitude,
            distance_meters_value,
            tracking_point_row.captured_at
          );

          delete from public.user_zone_presence
          where user_id = tracking_point_row.user_id
            and zone_id = zone_row.id;

          created_event_count_value := created_event_count_value + 1;
        elseif is_inside_zone then
          update public.user_zone_presence
          set last_point_id = tracking_point_row.id
          where user_id = tracking_point_row.user_id
            and zone_id = zone_row.id;
        end if;
      end loop;

      insert into public.tracking_user_cursors (
        user_id,
        last_captured_at,
        last_received_at,
        last_ingest_order,
        last_point_id,
        updated_at
      )
      values (
        tracking_point_row.user_id,
        tracking_point_row.captured_at,
        tracking_point_row.received_at,
        tracking_point_row.ingest_order,
        tracking_point_row.id,
        processed_at_value
      )
      on conflict (user_id) do update
      set last_captured_at = excluded.last_captured_at,
          last_received_at = excluded.last_received_at,
          last_ingest_order = excluded.last_ingest_order,
          last_point_id = excluded.last_point_id,
          updated_at = excluded.updated_at;

      update public.tracking_points
      set processed_at = processed_at_value
      where id = tracking_point_row.id;

      processed_point_count_value := processed_point_count_value + 1;
    end loop;
  end loop;

  return query
  select
    claimed_user_count_value,
    processed_point_count_value,
    created_event_count_value,
    stale_point_count_value;
end;
$$;

revoke all on function public.calculate_zone_distance_meters(double precision, double precision, double precision, double precision) from public, anon, authenticated, service_role;
revoke all on function public.process_tracking_points_batch(integer, integer) from public, anon, authenticated, service_role;

grant execute on function public.process_tracking_points_batch(integer, integer) to service_role;

comment on function public.calculate_zone_distance_meters(double precision, double precision, double precision, double precision) is
  'Internal Phase 9 haversine helper for deriving per-zone distances from raw tracking_points without widening the location_events contract.';

comment on function public.process_tracking_points_batch(integer, integer) is
  'Internal Phase 9 ordered detector; locks work per user, skips stale/replayed raw points, derives transition-only location_events, updates helper state, and stamps tracking_points.processed_at only after success.';

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'detection-engine-every-minute'
  ) then
    perform cron.unschedule('detection-engine-every-minute');
  end if;
end;
$$;

select cron.schedule(
  'detection-engine-every-minute',
  '* * * * *',
  $$select public.process_tracking_points_batch();$$
);
