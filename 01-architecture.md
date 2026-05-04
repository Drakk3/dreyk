# dreyk — Architecture

> **Document version:** 1.2
> **Status:** Phase 3 active — feature-first architecture applied
>
> ### Update policy
> This document may be updated once the codebase is running.
> **No changes may be applied without explicit confirmation from @drakk3 (David).**
> Proposed updates must be presented as a diff of the affected section,
> with a reason for the change. Update is only valid after verbal or written approval.

---

## System overview

dreyk is split into two apps sharing one backend:

- **PWA (`apps/web`)** — Next.js web app installable from the browser. Handles authenticated web workflows, admin routes, user routes, map operations, zone management, and module logic.
- **Companion (`apps/companion`)** — Minimal Expo React Native app. Single responsibility: capture GPS in background and POST coordinates to the API. Also receives push notifications.
- **Supabase** — Shared backend for both apps. Same project, same JWT, same database.

---

## Monorepo structure

One GitHub repository, two independent deploys.

```
dreyk/
├── apps/
│   ├── web/                        ← Next.js PWA → deploy: Vercel
│   │   ├── app/                    ← Next.js App Router
│   │   │   ├── (auth)/             ← auth routes
│   │   │   ├── (admin)/            ← admin-only routes
│   │   │   └── (user)/             ← authenticated user routes
│   │   ├── features/
│   │   │   ├── geofencing/         ← Module 1 (active — Phase 3+)
│   │   │   │   ├── components/     ← OpsDashboard, ZoneMap, ZoneRoster,
│   │   │   │   │                      KpiStrip, EventsTable, MembersPanel,
│   │   │   │   │                      ActivityChart, ModuleStatus, EventTicker,
│   │   │   │   │                      NetworkStatusCard, KpiCard
│   │   │   │   ├── config/
│   │   │   │   │   └── nav.ts      ← nav items del feature (key, label, icon, badge)
│   │   │   │   ├── data/
│   │   │   │   │   └── mockData.ts ← mock data hasta que Realtime esté activo
│   │   │   │   ├── hooks/          ← (vacío — Phase 10+)
│   │   │   │   ├── services/       ← (vacío — Phase 9+)
│   │   │   │   └── types.ts        ← DashboardZone, DashboardProfile, etc.
│   │   │   └── [future-module]/    ← mismo patrón; registrar nav en config/navigation.ts
│   │   ├── config/
│   │   │   └── navigation.ts       ← registro central de nav; combina nav de todos los features
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   └── shell/          ← Sidebar, Topbar (app shell, no específico de feature)
│   │   │   ├── hooks/              ← useAuthSignIn, useAuthSignOut
│   │   │   └── lib/                ← errors, utils
│   │   ├── components/
│   │   │   └── ui/                 ← componentes TheGridCN instalados vía CLI
│   │   └── lib/                    ← auth context, supabase client, env, utils
│   │
│   └── companion/                  ← Expo React Native → deploy: EAS
│       ├── app/
│       │   ├── (auth)/             ← login screen
│       │   └── (main)/             ← tracking, alerts, profile tabs
│       ├── features/
│       │   ├── tracking/           ← GPS background task + POST to API
│       │   └── notifications/      ← push notification handler + log
│       └── shared/
│           └── types/              ← re-exports from packages/shared
│
├── packages/
│   └── shared/                     ← shared across both apps
│       ├── supabase/               ← singleton client (browser + server)
│       ├── types/                  ← Database, Zone, Profile, ThemePreference, etc.
│       └── utils/                  ← haversine
│
├── supabase/
│   ├── migrations/                 ← SQL migration files
│   └── functions/                  ← Edge Functions (Deno)
│       ├── alexa-trigger/
│       └── push-notify/
│
├── package.json                    ← workspace root (npm workspaces)
└── turbo.json                      ← Turborepo build orchestration
```

**Golden rule:** features never import from each other. Anything shared moves to `packages/shared` (cross-app) or `apps/web/shared/` (within-app). The `apps/web/shared/` directory is reserved for true cross-feature code — app shell, auth hooks, error utilities. Feature-specific code lives exclusively in `features/[name]/`.

---

## Tech stack

### Web app — `apps/web`

| Layer | Tool | Role |
|---|---|---|
| Framework | Next.js 14 (App Router) | pages, routing, SSR |
| UI system | TheGridCN | mandatory end-to-end design system (installed via CLI into `components/ui/`) |
| UI dependency | shadcn/ui | underlying registry required by TheGridCN; not a parallel design path |
| Map | mapcn (MapLibre) | zone map, live user markers |
| Styling | Tailwind CSS | utility-first styling |
| State | Zustand | global state per feature slice |
| Server/cache | React Query (TanStack) | data fetching, cache, sync |
| Language | TypeScript strict | |

### Companion — `apps/companion`

| Layer | Tool | Role |
|---|---|---|
| Framework | Expo React Native + Expo Router | screens, navigation |
| GPS | expo-location + expo-task-manager | background location tracking |
| Notifications | Expo Notifications | FCM + APNs push |
| State | Zustand | minimal local state |
| Language | TypeScript strict | |

### Backend — Supabase (shared)

| Layer | Tool | Role |
|---|---|---|
| Auth | Supabase Auth (JWT) | login, session, RLS enforcement |
| Database | PostgreSQL | all persistent data |
| Realtime | Supabase Realtime | live user positions on map |
| Functions | Edge Functions (Deno) | Alexa trigger, push notify |
| Security | Row Level Security | data access per user/role |

### External services

| Service | Role |
|---|---|
| Alexa Skills Kit (ASK) | voice notifications per zone |
| Turf.js | geospatial calculations in Edge Functions |
| Vercel | PWA deploy |
| EAS Build | companion app builds + store distribution |

### Tooling

- TypeScript, ESLint, Prettier (shared config at root)
- Turborepo for build orchestration
- GitHub — single monorepo

---

## Feature navigation pattern

Each feature owns its nav items. The Sidebar knows nothing about specific features.

```
features/[name]/config/nav.ts     ← define NavItem[] for this feature
        ↓ imported by
apps/web/config/navigation.ts     ← PRIMARY_NAV = [...geofencingNav, ...futureNav]
        ↓ imported by
features/[name]/components/[Shell].tsx  ← passes navItems={PRIMARY_NAV} to Sidebar
        ↓ prop
shared/components/shell/Sidebar.tsx     ← renders navItems, no feature knowledge
```

Adding a new feature (`myFinances`, `notifications`, etc.):
1. Create `features/[name]/config/nav.ts` with the feature's nav items.
2. Import and spread into `PRIMARY_NAV` in `config/navigation.ts`.
3. The Sidebar picks it up automatically — no Sidebar changes needed.

---

## Dependency rules

```
apps/web/features/X    → can import from: apps/web/shared/, packages/shared/
apps/companion/features/X → can import from: apps/companion/shared/, packages/shared/
packages/shared        → can import from: nothing (zero dependencies on apps)
supabase/functions     → standalone Deno — no imports from packages/
```

Apps never import from each other. `packages/shared` never imports from apps.

---

## Auth flow — how both apps share identity

Both apps log in with the same Supabase credentials. Supabase returns the same JWT and `user_id` regardless of which app is used.

```
User logs in on PWA          → Supabase session (JWT stored in localStorage)
User logs in on companion    → same session (JWT stored in AsyncStorage)
Companion POSTs GPS coords   → Authorization: Bearer <JWT> → backend resolves user_id
PWA reads coords via Realtime → same user_id, same Supabase project
```

No bridge, no sync layer — Supabase is the single source of truth for both apps.

---

## Route protection

| Group | App | Access | Guard |
|---|---|---|---|
| `(auth)` | both | public | redirect if session exists |
| `(admin)` | web | admin only | redirect if role !== 'admin' |
| `(user)` | web | authenticated | redirect if no session |
| `(main)` | companion | authenticated | redirect if no session |

---

## Companion app — GPS pipeline

```
expo-task-manager background task
  ↓ receives GPS coords every ~30s
  ↓ POST /api/location  { lat, lng, userId }
  ↓ Authorization: Bearer <JWT>
Supabase Edge Function
  ↓ runs Haversine against active zones for user's group
  ↓ detects enter/exit state change
  ↓ inserts location_event
  ↓ triggers alexa-trigger or push-notify function
```

State change logic (enter/exit deduplication) runs server-side in the Edge Function — not on the device.

---

## Edge Functions — when to use

| Use case | Where |
|---|---|
| Trigger Alexa notification | Edge Function `alexa-trigger` |
| Send push to group members | Edge Function `push-notify` |
| Validate zone entry + deduplication | Edge Function |
| Read/write DB directly | Client via Supabase SDK (RLS handles security) |
| Format display data | Client |
