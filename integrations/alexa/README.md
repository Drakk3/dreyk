# Alexa integration foundation

Phase 11 release 1 uses an **installable custom Alexa skill + Proactive Events**.

## Quick path

1. Install the Dreyk Alexa skill in the Amazon developer/test flow.
2. Complete account linking and notification permission/opt-in.
3. Let Dreyk persist linkage readiness before any zone trigger is treated as voice-ready.

## Product shape

| Decision | Choice | Why |
|---|---|---|
| Skill type | Custom skill | Required to ship an installable Alexa skill artifact set. |
| Backend-driven delivery | Proactive Events | Alexa custom skills alone are user-invoked; Dreyk needs backend event fan-out from `location_events`. |
| First-release exclusions | Alexa Routines custom triggers | Deferred because the routines trigger path is still developer preview. |

## Required Amazon setup

- Alexa skill manifest with the Proactive Events capability enabled.
- Notification permission in the skill configuration (`alexa::devices:all:notifications:write`).
- Account linking so Dreyk can map a Dreyk profile to an Alexa installation identity.
- Developer/test installation path for the initial locale.

## Dreyk boundaries

| Boundary | Role |
|---|---|
| `supabase/functions/alexa-skill-runtime/` | Receives signed Alexa voice-runtime envelopes and binds `alexa_user_reference` on the first linked request. |
| `supabase/functions/alexa-skill-webhook/` | Receives Alexa skill/subscription events and updates linkage readiness. |
| `supabase/functions/alexa-trigger/` | Sends outbound Proactive Events after eligible `location_events`. |
| `apps/web/app/api/alexa/account-linking/*` | Hosts the browser-driven OAuth authorize/token endpoints used by Alexa account linking. |
| `supabase/migrations/0017_voice_integrations.sql` | Persists linkage, readiness, delivery status, and idempotency. |

## Readiness rules

A zone is NOT voice-ready just because `alexa_triggers` exists.

The zone becomes voice-ready only when all of the following are true:

- the trigger is active
- the trigger resolves a linked Alexa user
- account linking is active
- notification permission is granted
- subscription status is active for Proactive Events delivery

## Initial persistence model

| Table / field | Purpose |
|---|---|
| `public.alexa_linked_users` | Stores the Alexa-linked Dreyk profile plus permission/subscription readiness. |
| `public.alexa_delivery_attempts` | Stores delivery audit rows, retries, and idempotency keys. |
| `public.alexa_triggers.linked_user_id` | Resolves which linked Alexa identity a zone targets. |
| `public.alexa_triggers.workflow_key` | Declares which notification workflow the trigger is configured for. |

## Skill package artifacts

| File | Purpose |
|---|---|
| `integrations/alexa/skill-package/skill.json` | Custom skill manifest with runtime on `alexa-skill-runtime`, event ingress on `alexa-skill-webhook`, and production account-linking URLs. |
| `integrations/alexa/interaction-model/en-US.json` | Minimal `en-US` interaction model for install/help/readiness flows. |
| `integrations/alexa/validate_release.ts` | Deno validation entrypoint that checks manifest wiring/assets and records install/link/invoke/delivery evidence into `integrations/alexa/release-validation.json`. |
| `integrations/alexa/validate_release.node.mts` | Node fallback entrypoint for the same release validation flow when Deno is unavailable in the workspace. |

## Release readiness

### Account linking

- Amazon skill enablement MUST require OAuth account linking before Dreyk treats a linked user as eligible.
- `authorizationUrl` and `accessTokenUrl` now point at the live Next route handlers under `app.dreyk.com`.
- `clientId` is pinned to `dreyk-alexa-account-linking`; the `clientSecret` stays redacted in git and MUST be supplied from the deployment secret store when importing the manifest.
- The account-linking callback MUST map one Dreyk actor to one persisted `alexa_linked_users` row for the first release.

### Notification opt-in

- The manifest already requests `alexa::devices:all:notifications:write`, but that alone is NOT readiness.
- Readiness still depends on Alexa sending granted permission plus active subscription state through the `alexa-skill-webhook` boundary.
- The voice runtime itself lives on `alexa-skill-runtime` and only handles safe Alexa envelopes plus first-link binding.
- Operators should test both the happy path and opt-out/revoked-permission paths before calling a zone voice-ready.

### Secrets and console configuration

- Store the account-linking secret outside git; `ALEXA_ACCOUNT_LINKING_CLIENT_SECRET_FROM_SECRET_STORE` is a redacted marker only.
- The manifest now separates the custom runtime endpoint from the event webhook endpoint; confirm the deployed Supabase hostname matches the chosen environment before console import.
- Amazon Proactive Events credentials, OAuth client credentials, and webhook validation secrets belong in the deployment secret store, not in skill-package files.

### Amazon validation checkpoints

- Confirm the imported skill keeps `en-US` as the initial locale and exposes the Dreyk help/readiness intents.
- Confirm the manifest publishes `AMAZON.MessageAlert.Activated` and `AMAZON.MessageAlert.Updated` and requests notification write permission.
- Run `deno run --allow-read --allow-write --allow-env integrations/alexa/validate_release.ts` when Deno is available.
- If Deno is unavailable in the workspace, run `npm run validate:alexa-release` with the same evidence env vars for an equivalent validation result.
- Routines custom triggers stay OUT of this first release package on purpose.

## Notes

- `alexa_device_id` remains in `alexa_triggers` as legacy metadata until the later admin/configuration work fully migrates UI usage.
- `supabase/smoke/voice_integrations.sql` now emits release evidence notices for linking/runtime/delivery gating after the SQL smoke passes.
- The current manifest keeps the client secret redacted on purpose; release validation fails until the real secret and manual evidence env vars are provided.
