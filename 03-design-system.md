# dreyk — Design System

> **Document version:** 1.4
> **Status:** Phase 2 aligned — future GridCN target
>
> ### Update policy
> This document may be updated once the codebase is running.
> **No changes may be applied without explicit confirmation from @drakk3 (David).**
> Proposed updates must be presented as a diff of the affected section,
> with a reason for the change. Update is only valid after verbal or written approval.

---

## Current project state

The repository is currently reset to **Phase 2 — `packages/shared`**.

At this point:

- `apps/web` exists as a basic Next.js app scaffold.
- `packages/shared` contains typed database/domain contracts and shared utilities.
- Supabase schema and RLS migrations exist.
- Tailwind, shadcn/ui, TheGridCN, `components.json`, and GridCN theme files are **not installed yet**.

This document is therefore a **target design contract for Phase 3+**, not proof that the current Phase 2 code already contains the design system.

---

## Core principle

**Use TheGridCN literally, completely, and end-to-end for the PWA/frontend once Phase 3 starts.**

- Do not create a second design language on top of GridCN.
- Do not treat shadcn/ui as an alternate frontend path; it is only acceptable as the underlying compatible layer required by TheGridCN.
- Do not override GridCN component internals.
- Do not fork GridCN visual primitives.
- Do not introduce custom local themes.
- Use stock GridCN identities only.
- If TheGridCN does not cover a need, stop and escalate to the user before creating anything from scratch.

Before writing or installing any PWA component:

```bash
npx shadcn@latest list @thegridcn
```

---

## Custom component authorization rule

**Building a custom PWA component is prohibited without explicit written approval from the user/@drakk3 (David).**

Required workflow when TheGridCN or its compatible shadcn/ui layer does not provide the needed component:

1. Stop. Do not build the component.
2. Document the gap: required component, target screen, and why GridCN/shadcn do not cover it.
3. Explain explicitly what creating the component from scratch would imply: maintenance cost, design-system drift risk, accessibility/testing burden, and future upgrade impact.
4. Present the gap and implications to the user/@drakk3.
5. Wait for explicit written approval.

No approval = no custom component.

Approved custom components must live in `apps/web/shared/components/` and must be domain-specific compositions, not design primitives.

Examples of acceptable compositions after approval: `ZoneCard`, `AlexaTriggerForm`, `UserAssignmentPanel`.

Examples of prohibited primitives: `Button`, `Card`, `Input`, `Badge`, `Sidebar`, `Dialog`, `ThemeProvider`.

---

## Phase alignment

### Phase 2 — current state

No design-system implementation work is required in Phase 2.

Phase 2 owns:

- shared TypeScript contracts
- database/domain types
- Supabase client boundaries
- pure utilities such as Haversine

Do not add GridCN, shadcn/ui, Tailwind, or web-only theme implementation to `packages/shared` during Phase 2.

### Phase 3 — PWA auth and base structure

Phase 3 starts the real PWA design implementation.

The frontend rule from this phase onward is absolute: the PWA must be built **100% end-to-end with TheGridCN as its design-system language**. shadcn/ui may exist only as a dependency path required by TheGridCN, never as an independent visual direction.

Target setup:

- Next.js App Router in `apps/web`
- shadcn/ui initialized in `apps/web`
- TheGridCN registry registered in `apps/web/components.json`
- Tailwind configured in `apps/web`
- ARES installed as the default GridCN theme
- login/auth screens built from GridCN/shadcn primitives

### Phase 4 — admin dashboard and profile

Phase 4 adds the first profile-level theme preference UI.

The selector must expose only approved **stock GridCN identities**:

- `ares`
- `tron`
- `clu`
- `athena`
- `aphrodite`
- `poseidon`

Any non-canonical theme context is deprecated and must not be expanded.

---

## Setup target for Phase 3

### 1. Prerequisites

- Next.js 14+ with App Router
- Tailwind configured inside `apps/web`
- `components.json` initialized inside `apps/web` via `npx shadcn@latest init`
- shadcn/ui base color: `neutral`
- CSS variables enabled

Tailwind version must be selected based on TheGridCN compatibility at implementation time. If TheGridCN requires Tailwind 4, Phase 3 must include the Tailwind upgrade explicitly as a tooling task.

### 2. Register the GridCN namespace

```json
// apps/web/components.json
{
  "registries": {
    "@thegridcn": "https://thegridcn.com/r/{name}.json"
  }
}
```

### 3. Install the default theme

ARES is the default PWA theme.

```bash
npx shadcn@latest add @thegridcn/theme-ares
```

Expected web stylesheet location:

```css
/* apps/web/app/globals.css */
@import "tailwindcss";
@import "../styles/thegridcn-theme.css";
```

If the installer writes the token file to a different location, keep the generated GridCN path and document it in the Phase 3 implementation notes. Do not create a second token layer to hide the generated file.

### 4. Install ThemeProvider

Use the ThemeProvider generated or provided by TheGridCN/shadcn. Do not create a custom provider unless explicitly approved.

```tsx
// apps/web/app/layout.tsx
import { ThemeProvider } from "@/components/theme";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="ares">{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Theme system

### Canonical PWA theme identities

The PWA theme identity list is exactly:

```ts
export type GridCNTheme =
  | 'ares'
  | 'tron'
  | 'clu'
  | 'athena'
  | 'aphrodite'
  | 'poseidon';
```

Default: `ares`.

### Glow intensity

Glow intensity is a UI preference, not a custom theme.

```ts
export type GlowIntensity = 'off' | 'light' | 'medium' | 'heavy';

export interface ThemePreference {
  identity: GridCNTheme;
  intensity: GlowIntensity;
}
```

### Persistence boundary

`profiles.theme_preference` is the canonical backend persistence field for GridCN theme identities.

Phase 2 now persists only the canonical GridCN identity list with `ares` as the default.

Before the Phase 4 profile UI ships:

- Write only canonical GridCN identities through the shared database contract.
- Do not introduce any alternate persistence contract for theme identity.
- Local-only UI experiments may use `localStorage`, but must not replace the canonical backend contract.

---

## Component strategy

### Rule: TheGridCN end-to-end, shadcn only as compatible dependency, custom only by approval

Resolution order:

1. Check TheGridCN first.
2. If absent, check whether the compatible shadcn/ui layer is required/allowed by the TheGridCN workflow.
3. If still absent, document the gap and ask the user explicitly before building anything.
4. In that request, explain why TheGridCN coverage is insufficient and what the custom-build implications are.
5. Build only after approval.

```bash
npx shadcn@latest list @thegridcn
npx shadcn@latest search @thegridcn --query "card"
npx shadcn@latest search @thegridcn --query "status"
npx shadcn@latest search @thegridcn --query "nav"
```

### Components by phase

#### Phase 3 — Auth and base structure

```bash
npx shadcn@latest add @thegridcn/button
npx shadcn@latest add @thegridcn/input
npx shadcn@latest add @thegridcn/card
npx shadcn@latest add @thegridcn/label
npx shadcn@latest add @thegridcn/theme-ares
```

#### Phase 4 — Admin shell and profile

```bash
npx shadcn@latest add @thegridcn/sidebar
npx shadcn@latest add @thegridcn/navigation-menu
npx shadcn@latest add @thegridcn/stat-card
npx shadcn@latest add @thegridcn/data-card
npx shadcn@latest add @thegridcn/badge
npx shadcn@latest add @thegridcn/avatar
npx shadcn@latest add @thegridcn/select
npx shadcn@latest add @thegridcn/separator
npx shadcn@latest add @thegridcn/theme-tron @thegridcn/theme-clu @thegridcn/theme-athena @thegridcn/theme-aphrodite @thegridcn/theme-poseidon
```

#### Phase 5 — Base map

```bash
npx shadcn@latest add @thegridcn/hud
```

#### Phase 6 — Zone management

```bash
npx shadcn@latest add @thegridcn/dialog
npx shadcn@latest add @thegridcn/form
npx shadcn@latest add @thegridcn/table
npx shadcn@latest add @thegridcn/switch
npx shadcn@latest add @thegridcn/radar
```

#### Phase 10 — Live map

```bash
npx shadcn@latest add @thegridcn/status-dot
npx shadcn@latest add @thegridcn/timeline
npx shadcn@latest add @thegridcn/alert
npx shadcn@latest add @thegridcn/scroll-area
```

#### Phase 13 — User and group management

```bash
npx shadcn@latest add @thegridcn/tabs
npx shadcn@latest add @thegridcn/dropdown-menu
npx shadcn@latest add @thegridcn/tooltip
npx shadcn@latest add @thegridcn/popover
```

Some GridCN components may use a `thegridcn-` prefix to disambiguate from shadcn base components. Always confirm exact package names with `npx shadcn@latest list @thegridcn` before installing.

---

## 3D components

GridCN Three.js-powered components such as `grid`, `tunnel`, and `grid-floor` must be dynamically imported with `ssr: false` in Next.js.

```tsx
import dynamic from "next/dynamic";

const Grid3D = dynamic(
  () => import("@/components/thegridcn/grid").then((module) => module.Grid),
  { ssr: false }
);
```

Use 3D components sparingly:

- allowed in hero/splash contexts
- prohibited in data-dense admin views
- prohibited when they block auth, map, or realtime workflows

---

## Companion app

The companion app is Expo React Native and does not use GridCN directly.

Companion UI must stay minimal and utility-focused. It may reuse broad visual references from the PWA, but it must not import GridCN components, GridCN theme providers, or web-only CSS.

If companion needs shared theme values, define a separate companion UI contract. Do not force web GridCN implementation details into `packages/shared` unless the value is a true persisted product preference.

---

## Motion

Use GridCN's built-in transition system as-is.

- Duration: 150ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Elements snap into existence
- No bounce or elastic easing
- Haptic feedback is companion-only and belongs to zone enter/exit events

---

## Do's and Don'ts

### Do

- Keep Phase 2 free of web-only design-system implementation.
- Install GridCN per phase, not upfront.
- Keep the frontend 100% aligned to TheGridCN end-to-end.
- Use stock GridCN identities.
- Keep theme persistence aligned with the database constraint.
- Keep 3D components SSR-safe with `dynamic(..., { ssr: false })`.

### Don't

- Do not create custom design primitives.
- Do not build frontend components from scratch without first asking the user explicitly and explaining the reasons and implications.
- Do not build a second token/theme layer on top of GridCN.
- Do not override GridCN component internals.
- Do not store GridCN theme values in Supabase until the backend constraint allows them.
