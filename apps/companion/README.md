# Companion build-path validation

Use THIS document to choose the correct companion build lane before testing. Expo Go is NOT a valid acceptance target for background-location enter/exit testing.

## Which path should I use?

| Need | Command(s) | Metro required? | Use this for |
| --- | --- | --- | --- |
| Debugging the companion with live code reload | `npm run build:dev:android --workspace @dreyk/companion` or `npm run build:dev:ios --workspace @dreyk/companion`, then `npm run dev --workspace @dreyk/companion` | Yes | Development-client debugging |
| Installing a field-test binary that runs by itself | `npm run build:preview:android --workspace @dreyk/companion` or `npm run build:preview:ios --workspace @dreyk/companion` | No | Outdoor validation and Metro-free preview testing |

## Shared setup checklist

### Required env

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Required accounts and tools

- Node/npm dependencies installed from repo root.
- `eas-cli` access through `npx eas ...` or a global install.
- An Expo/EAS account with permission to link or build `apps/companion`.
- A physical device or simulator that supports installable Expo builds.

### Native identity

- Android package: `com.dreyk.companion`
- iOS bundle identifier: `com.dreyk.companion`

If EAS project linkage or signing credentials are still missing, stop there and resolve that BEFORE trying either validation path.

## Acceptance boundary

- ✅ In scope: build-path selection, installable preview setup, dev-client setup, env clarity, repeatable enter/exit validation.
- ❌ Out of scope: store submission automation, release-channel management, credential-ownership changes, new tracking logic, detection-rule changes, map UX changes, notification behavior.

## Development runbook (dev client + Metro)

Choose this path when you need debugger tooling, live reload, or to iterate on code while testing.

### Happy path

| Step | Command / action | Why it matters |
| --- | --- | --- |
| 1 | `cp apps/companion/.env.example apps/companion/.env.local` | Seeds the only required public runtime env vars. |
| 2 | Fill `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `getPublicEnv()` fails fast without them. |
| 3 | `npm run build:dev:android --workspace @dreyk/companion` or `npm run build:dev:ios --workspace @dreyk/companion` | Produces the installable development client. |
| 4 | Install the build on a device or simulator | Background validation must run in an installable client. |
| 5 | `npm run dev --workspace @dreyk/companion` | Starts Metro in dev-client mode for the installed app. |

### Metro requirement

- **Metro required:** Yes.
- If Metro is not running, this is STILL the dev-client/debug path and not a standalone preview build.

## Preview runbook (standalone + no Metro)

Choose this path when you need a self-contained installable binary for outdoor validation or any test away from your dev machine.

### Happy path

| Step | Command / action | Why it matters |
| --- | --- | --- |
| 1 | `cp apps/companion/.env.example apps/companion/.env.local` | Uses the same public runtime env vars as the dev-client path. |
| 2 | Fill `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` | The installed app still needs backend connectivity. |
| 3 | `npm run build:preview:android --workspace @dreyk/companion` or `npm run build:preview:ios --workspace @dreyk/companion` | Produces the standalone preview build. |
| 4 | Install the preview build on a device | This binary is meant to launch on its own for field tests. |
| 5 | Open the installed app directly | Confirms the preview path works without Metro. |

### Metro requirement

- **Metro required:** No.
- Do NOT start `npm run dev` for this lane unless you are intentionally switching back to the dev-client workflow.

## Enter/exit validation runbook

These checks apply after either build path is installed and the app is signed in.

### 1. Prepare the system

- Sign in with a user that already belongs to the validation workspace.
- Open the installed build.
- Start tracking and confirm the app stays in its active tracking state.

### 2. Perform the movement sequence

- Capture a baseline point outside the target zone.
- Move or mock location to INSIDE the zone and wait for the app to upload points.
- Move or mock location back OUTSIDE the zone and wait for another upload.

### 3. Verify the pipeline in order

1. **Raw uploads first**: confirm new rows arrive in `tracking_points` for the test user.
2. **Derived events second**: wait for `location_events` to appear only after backend processing.
3. **Web confirmation last**: verify the same enter/exit events appear in `/geofencing`.

The detector cron runs every minute in `supabase/migrations/0016_detection_engine.sql`. Wait up to 3 minutes after the latest raw upload before marking enter/exit as failed.

### 4. SQL spot checks

```sql
select id, user_id, captured_at, received_at, processed_at
from public.tracking_points
where user_id = '<user-id>'
order by captured_at desc, received_at desc, id desc
limit 20;
```

```sql
select id, user_id, zone_id, event_type, triggered_at
from public.location_events
where user_id = '<user-id>'
order by triggered_at desc, id desc
limit 20;
```

## Pass/fail checklist

- [ ] Correct build path chosen before installation.
- [ ] Installed build launches in the expected mode (dev client with Metro, or standalone preview without Metro).
- [ ] Sign-in succeeds in the installed client.
- [ ] Tracking starts without missing-env errors.
- [ ] New `tracking_points` rows appear for the user.
- [ ] Expected `location_events` enter/exit rows appear within 3 minutes.
- [ ] `/geofencing` reflects the same recent events.

If raw points arrive but derived events do not, treat that as a backend-processing failure after the full wait window expires — NOT as a companion build failure.
