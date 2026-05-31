create extension if not exists pg_cron;

create or replace function public.cleanup_tracking_points()
returns table (
  deleted_processed_count integer,
  deleted_expired_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_processed_count_value integer := 0;
  deleted_expired_count_value integer := 0;
begin
  delete from public.tracking_points
  where processed_at is not null
    and processed_at <= now() - interval '1 hour';

  get diagnostics deleted_processed_count_value = row_count;

  delete from public.tracking_points
  where captured_at <= now() - interval '7 days';

  get diagnostics deleted_expired_count_value = row_count;

  return query
  select deleted_processed_count_value, deleted_expired_count_value;
end;
$$;

revoke all on function public.cleanup_tracking_points() from public, anon, authenticated, service_role;

comment on table public.tracking_points is
  'Transient Phase 8 raw coordinates for future Phase 9 processing only; cleanup deletes processed rows quickly and hard-deletes every row within 7 days.';

comment on function public.cleanup_tracking_points() is
  'Database-owned retention cleanup for transient tracking_points only; deletes processed rows after 1 hour, deletes every raw row after 7 days, and never derives location_events.';

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'tracking-points-retention-every-15-minutes'
  ) then
    perform cron.unschedule('tracking-points-retention-every-15-minutes');
  end if;
end;
$$;

select cron.schedule(
  'tracking-points-retention-every-15-minutes',
  '*/15 * * * *',
  $$select public.cleanup_tracking_points();$$
);
