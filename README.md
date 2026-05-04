# dreyk

Phase 0 scaffolding only.

## Current scope

- Root npm workspaces, Turbo metadata, and strict TypeScript baseline
- Shared lint and format configuration at the repository root
- Empty workspace shells for `apps/web`, `apps/companion`, `packages/shared`, and `supabase/`

## Explicitly out of scope in Phase 0

- Backend integration, Supabase project setup, migrations, RLS, auth, or functions
- Shared domain contracts, Supabase clients, or business utilities
- Application-layer implementation details, routes, screens, or feature delivery
- Any feature folders, business logic, or app-to-app imports

## Verification policy

`lint`, `typecheck`, and `turbo dev` are defined as approval-gated next steps.
No build or verification command should run automatically.
