# dreyk — Development Phases

> **Document version:** 2.0
> **Status:** Functional sequencing only

---

## Core principle

Build in layers. Each layer must be stable before touching the next.

---

## Phase 0 — Monorepo setup

- Initialize repository structure.
- Configure workspaces, Turborepo, TypeScript, ESLint, and Prettier.
- Verify the apps can boot in parallel without conflicts.

**Exit criteria:** repo runs and reports zero TypeScript errors.

---

## Phase 1 — Backend: Supabase

- Create the Supabase project.
- Apply migrations in order.
- Verify indexes and RLS manually.
- Seed required module data.
- Create the initial admin user.

**Exit criteria:** tables, policies, and seed data are correct under real JWT checks.

---

## Phase 2 — `packages/shared`

- Publish shared types and utilities.
- Add Supabase client helpers and database contracts.
- Verify both apps can consume the package.

**Exit criteria:** shared package imports cleanly from app workspaces.

---

## Phase 3 — Web auth and route foundations

- Initialize the web app runtime.
- Connect shared auth/data boundaries.
- Implement sign-in, sign-out, session persistence, and role guards.
- Establish `(auth)`, `(admin)`, and `(user)` routing behavior.

**Exit criteria:** authenticated users reach the correct protected area and unauthenticated users are redirected safely.

---

## Phase 4 — Web authenticated shells

- Add basic protected admin and user landing routes.
- Add profile/account route scaffolding if needed.
- Keep scope limited to navigation and role-safe entry points.

**Exit criteria:** protected routes exist and role restrictions behave correctly.

---

## Phase 5 — Geospatial workspace baseline

- Establish the first navigable map workspace.
- Verify map loading, pan, and zoom behavior.

**Exit criteria:** the geospatial workspace loads reliably.

---

## Phase 6 — Zone management

- Create, list, update, activate, deactivate, and delete zones.
- Persist zone data through the backend.
- Verify role restrictions for write access.

**Exit criteria:** admins can manage zones end-to-end.

---

## Phase 7 — Companion auth setup

- Initialize the companion runtime.
- Connect shared auth/data boundaries.
- Verify companion sign-in resolves the same user identity model.

**Exit criteria:** companion authentication is stable and consistent with the web app.

---

## Phase 8 — Companion tracking

- Implement background tracking.
- Send coordinates to the backend with authenticated requests.
- Support pause/resume tracking.

**Exit criteria:** tracking continues reliably in background conditions.

---

## Phase 9 — Detection engine

- Implement server-side zone evaluation and state-change detection.
- Persist location events.
- Trigger downstream workflows.

**Exit criteria:** valid coordinate changes create correct location events.

---

## Phase 10 — Live operational updates

- Subscribe web surfaces to real-time updates.
- Reflect location events and status changes from backend activity.

**Exit criteria:** operational updates appear without manual refresh.

---

## Phase 11 — Voice integrations

- Implement Alexa-triggered workflows from valid events.

**Exit criteria:** supported voice workflows trigger correctly from backend events.

---

## Phase 12 — Push notifications

- Implement mobile push notification delivery.
- Verify delivery to the intended audience.

**Exit criteria:** supported push flows deliver correctly.

---

## Phase 13 — User and group management

- Manage users, invites, groups, and permissions.
- Verify RLS behavior under group membership changes.

**Exit criteria:** admins can manage users and groups safely.

---

## Phase 14 — Installability and polish

- Configure installable web app metadata.
- Add offline-safe basics where appropriate.
- Review performance and deployment readiness.

**Exit criteria:** the web app is installable and operationally ready.

---

## Critical dependency order

1. Backend before apps
2. `packages/shared` before app feature work
3. Detection engine before live operational updates and downstream integrations
