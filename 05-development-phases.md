# dreyk — Development Phases

> **Document version:** 1.0
> **Status:** Pre-development planning
>
> ### Update policy
> This document may be updated once the codebase is running.
> **No changes may be applied without explicit confirmation from @drakk3 (David).**
> Proposed updates must be presented as a diff of the affected section,
> with a reason for the change. Update is only valid after verbal or written approval.

---

## Core principle

Build in layers. Each layer must be stable before touching the next.
No features until infrastructure does not fail.

---

## Phase 0 — Monorepo setup

Everything that needs to exist before writing a single line of business logic.

- Initialize repository with workspace structure — `apps/web`, `apps/companion`, `packages/shared`, `supabase/`
- Configure Turborepo with build pipelines
- Install and configure strict TypeScript with a base `tsconfig` at root extended by each workspace
- ESLint and Prettier with shared config from root
- Verify `turbo dev` runs both apps in parallel without conflicts

**Exit criteria:** repo runs, both apps boot empty, TypeScript reports zero errors.

---

## Phase 1 — Backend: Supabase

Before touching the client, the backend must be complete and tested.

- Create Supabase project
- Run migrations in order — all 8 tables with constraints, indexes, RLS policies, and the forward canonical theme-preference migration defined in `02-data-model`
- Manually verify each RLS policy from the Supabase dashboard before continuing
- Insert `modules` table seed with the geofencing record
- Create the initial admin user directly in Supabase Auth

**Exit criteria:** all tables exist, RLS policies are active, a query from the dashboard using the admin JWT returns correct data.

---

## Phase 2 — packages/shared

The shared package consumed by both apps. Built before any app because both depend on it.

- Configure the package with its own `tsconfig`
- Create all TypeScript types from `02-data-model` — `Profile`, `Zone`, `Group`, `LocationEvent`, and the canonical `ThemePreference` contract.
- Create the Supabase singleton client with the `Database` type
- Create Haversine utility as pure functions
- Verify the package exports everything correctly and both apps can import it without errors

**Exit criteria:** package builds cleanly, types are importable from both `apps/web` and `apps/companion`.

---

## Phase 3 — PWA: auth and base structure

The first real screen. No features yet — only that the user can sign in and out.

- Initialize Next.js with App Router
- Install TheGridCN and verify components render correctly
- Keep the PWA/frontend 100% end-to-end on TheGridCN from the first screen onward; do not introduce a parallel design path
- Connect Supabase client from `packages/shared`
- Build login screen with email and password
- Implement route guards — `(auth)`, `(admin)`, `(user)` with redirects based on session and role
- Verify admin can log in and reach the empty dashboard

**Exit criteria:** login works, session persists, route guard redirects correctly by role.

---

## Phase 4 — PWA: admin dashboard and profile

The admin home and personal settings screen. No real data yet — only structure and navigation.

- Build admin layout with GridCN `Sidebar Nav`
- Build dashboard screen with GridCN `Stat Card` and `Data Card` in empty/placeholder state
- Build profile screen with theme selector — GridCN identity grid, glow intensity selector
- Implement theme persistence in Supabase and localStorage using only the canonical GridCN identities from Phase 2
- Verify that changing the theme updates the entire UI instantly

**Exit criteria:** navigation works, theme switcher persists the canonical selection, all GridCN identities are selectable.

---

## Phase 5 — PWA: base map

Empty map with no users or zones yet. Only that the map loads and displays correctly.

- Install mapcn
- Configure MapLibre with a dark map style compatible with dreyk aesthetic
- Build map screen inside the `(admin)` group
- Verify map loads, zooms, and pans without issues
- Apply GridCN `HUD Frame` as map overlay

**Exit criteria:** map renders correctly with dark style, HUD overlay is visible.

---

## Phase 6 — PWA: zone management

The first real feature. Admin can create, view, and delete zones.

- Build zone creation form — name, lat/lng, radius in meters, Alexa message
- On zone creation, automatically draw it on the map as a circle
- List active zones in a side panel using GridCN `Data Card`
- Implement zone activate/deactivate
- Implement zone delete
- Verify RLS — only admin can write

**Exit criteria:** admin can create a zone, it appears on the map as a circle, and persists after page reload.

---

## Phase 7 — Companion: setup and auth

The mobile app from scratch.

- Initialize Expo with Expo Router
- Install dependencies — `expo-location`, `expo-task-manager`, `expo-notifications`, Zustand
- Connect `packages/shared` for types and Supabase client
- Build login screen — same email/password as PWA, same Supabase session
- Verify the companion JWT is the same as the PWA JWT

**Exit criteria:** user can log in on companion with the same credentials as the PWA, session resolves the same `user_id`.

---

## Phase 8 — Companion: GPS tracking

The core of the companion app.

- Implement background task with `expo-task-manager` that captures coordinates periodically
- Implement POST of coordinates to the API with JWT in the Authorization header
- Build main screen with active tracking indicator — animated pulse, last ping, battery status
- Implement pause/resume tracking
- Verify the task survives with the app in background and with the screen locked

**Exit criteria:** background task runs, coordinates are POSTed to the API, task survives screen lock.

---

## Phase 9 — Backend: detection engine

The Edge Function that processes coordinates arriving from the companion.

- Build Edge Function `location-processor` in Deno
- Receives `{ lat, lng }` + JWT
- Resolves `user_id` from JWT
- Loads active zones for the user's group
- Runs Haversine against each zone
- Detects state change (enter/exit) by comparing against the last recorded event in `location_events`
- Inserts the event into `location_events`
- Triggers the appropriate downstream function (Alexa or push)
- Verify with manual tests from Postman or Supabase dashboard

**Exit criteria:** POSTing coordinates that cross a zone boundary creates a `location_event` record with the correct `event_type`.

---

## Phase 10 — PWA: live map

Connect the map with real data.

- Subscribe the map to the Supabase Realtime channel listening to inserts on `location_events`
- Show user markers in real time with position and status
- Apply GridCN `Status Dot` and `Signal Indicator` on markers and side panel
- Show event history in GridCN `Timeline`

**Exit criteria:** when the companion posts a location, the marker on the admin map updates in real time without page reload.

---

## Phase 11 — Alexa integration

The voice trigger on zone entry.

- Register the Skill in Amazon Developer Console
- Configure the Alexa Notifications API
- Build Edge Function `alexa-trigger` — receives entry event, loads the zone's `alexa_trigger`, interpolates the user's name into `message_template`, calls the Alexa API
- Connect this function as downstream of the Phase 9 detection engine
- Test the full flow — companion in hand, walk toward the zone, hear Alexa respond

**Exit criteria:** crossing a zone boundary triggers an Alexa announcement with the correct message and user name.

---

## Phase 12 — Push notifications

Push notifications to group members.

- Configure Expo Notifications in the companion with FCM (Android) and APNs (iOS)
- Build Edge Function `push-notify` that identifies affected group members and sends push to each
- Build Alerts screen in the companion with received notification log
- Verify that multiple users in the same group receive the notification correctly

**Exit criteria:** when a user enters a zone, all other members of the same group receive a push notification on their companion app.

---

## Phase 13 — User and group management

Admin can invite users and organize them into groups.

- Build user management screen in the PWA
- Implement manual invite flow — admin generates an invite link via Supabase Auth
- Build group management — create group, assign users, assign zones to groups
- Verify RLS policies respect group membership correctly

**Exit criteria:** admin can invite a new user, assign them to a group, and that user receives notifications only for zones belonging to their group.

---

## Phase 14 — Polish and PWA installable

The PWA must be installable from the browser.

- Configure `manifest.json` with dreyk name, icons, and colors
- Configure Service Worker for basic offline functionality
- Verify Chrome and Safari show the install prompt
- Verify the app installed from homescreen works the same as in browser
- Review performance — Lighthouse score, load times, bundle size

**Exit criteria:** PWA installs from browser, works offline for basic navigation, Lighthouse performance score above 85.

---

## Critical dependency order

Three hard dependencies that cannot be skipped:

1. Backend (Phase 1) must exist before any app
2. `packages/shared` (Phase 2) must exist before web or companion
3. Detection engine (Phase 9) must exist before live map (Phase 10) and Alexa (Phase 11)

Everything else can be parallelized if two people are working simultaneously.
