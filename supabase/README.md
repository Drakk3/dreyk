# Supabase backend bootstrap

Phase 1 is backend-only. This directory owns Supabase config, SQL migrations, seed data, and the manual bootstrap/verification steps required before any app or shared-package work can continue.

## Layout

- `config.toml` — local Supabase CLI config with seed enabled.
- `migrations/0000` → `0010` — ordered schema, compatibility migration, indexes, and RLS.
- `seed.sql` — canonical module bootstrap data.

## Migration order

Apply migrations in numeric order:

1. `0000_profiles.sql`
2. `0001_groups.sql`
3. `0002_group_members.sql`
4. `0003_user_permissions.sql`
5. `0004_zones.sql`
6. `0005_alexa_triggers.sql`
7. `0006_location_events.sql`
8. `0007_modules.sql`
9. `0008_gridcn_theme_preference.sql`
10. `0009_indexes.sql`
11. `0010_rls.sql`

### Life-plan operating persistence rollout

- `0011_life_plan_operating.sql` adds the month ledger, entries, status history, debt accounts, debt payment events, and recurring templates.
- `0012_life_plan_operating_rls.sql` locks every life-plan row to `owner_user_id = auth.uid()`.
- `smoke/life_plan_operating.sql` is the local post-reset smoke verification for schema presence, RLS enablement, owner-only access, and same-owner/cross-owner FK behavior.
- The first remote month is bootstrapped from the May 2026 snapshot in the web feature.
- Future recurring pay stays DERIVED from recurring templates plus month entries; there is no separate persisted recurring-queue table.

## Suggested CLI flow

### Local validation

1. Install the Supabase CLI.
2. Run `supabase start`.
3. Run `supabase db reset` to apply all migrations plus `seed.sql`.
4. Run `npm run smoke:life-plan-sql` to verify the life-plan tables, RLS, and owner-coupled foreign keys.

The smoke script uses `psql` against the local Supabase Postgres instance, impersonates two deterministic local authenticated users entirely inside one transaction, raises on the first failed check, and ends with `ROLLBACK` so it does not leave fixtures behind.

### Remote project setup

1. Create the Supabase project manually in the dashboard.
2. Update `project_id` in `config.toml` with the real project ref when it exists.
3. Run `supabase link --project-ref <project-ref>`.
4. Run `supabase db push`.

Do not add app env wiring, shared generated types, or Edge Function business logic in this phase.

## Admin bootstrap

Because Phase 1 does not add signup/profile automation yet, the first admin must be bootstrapped manually.

1. In **Supabase Auth**, create the first user.
2. In the SQL editor, ensure a matching profile row exists:

```sql
insert into public.profiles (id, display_name, role)
values ('<AUTH_USER_ID>', 'Initial Admin', 'admin')
on conflict (id)
do update set
  display_name = excluded.display_name,
  role = 'admin';
```

3. If the profile already exists with `role = 'user'`, promote it manually:

```sql
update public.profiles
set role = 'admin'
where id = '<AUTH_USER_ID>';
```

## Manual verification checklist

Phase 1 is not complete until this checklist is executed against real JWTs from the Supabase dashboard or an equivalent trusted tool.

### Seed and schema

- [ ] All 8 tables exist in `public`.
- [ ] `profiles.theme_preference` respects its database constraint.
- [ ] The six secondary indexes from `0009_indexes.sql` exist.
- [ ] `public.modules` contains `('geofencing', 'Geofencing', true)`.

### RLS matrix

Use one admin JWT and one non-admin authenticated JWT.

| Table | Admin JWT | Non-admin JWT |
|---|---|---|
| `profiles` | Read all, update all | Read own row, update own non-role fields only |
| `groups` | Read/write | Read only groups where the user is a member |
| `group_members` | Read/write | Read only memberships where `user_id = auth.uid()` |
| `user_permissions` | Read/write | Read only rows where `user_id = auth.uid()` |
| `zones` | Read/write | Read only zones linked to one of the user's groups |
| `alexa_triggers` | Read/write | Read only triggers for accessible zones |
| `location_events` | Read/write | Read own rows, insert own rows only |
| `modules` | Read/write | Read all module rows because policy is `authenticated`-readable |

### Deny checks

- [ ] Non-admin cannot read another user's `profiles` row.
- [ ] Non-admin cannot promote their own `profiles.role`.
- [ ] Non-admin cannot insert/update/delete `groups`, `group_members`, `user_permissions`, `zones`, `alexa_triggers`, or `modules`.
- [ ] Non-admin cannot read `location_events` for another user.
- [ ] Anonymous access cannot read `modules`.

## Notes

- `0008_gridcn_theme_preference.sql` intentionally normalizes invalid stored values before enforcing the column constraint.
- `0010_rls.sql` uses helper SQL functions so policies can check admin/group access without recursive RLS failures.
