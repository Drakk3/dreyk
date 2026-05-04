# dreyk — Code Conventions

> **Document version:** 2.0
> **Status:** Engineering-only conventions

---

## Scope

This document defines engineering conventions only.

It does not define presentation direction, product interaction design, or frontend visual rules.

---

## Naming conventions

| What | Convention | Example |
|---|---|---|
| Files — components | PascalCase | `ZoneCard.tsx` |
| Files — hooks | camelCase + `use` prefix | `useGeofencing.ts` |
| Files — services | camelCase | `zoneEngine.ts` |
| Files — stores | camelCase + `Store` suffix | `geofencingStore.ts` |
| Files — types | camelCase | `types.ts` |
| Files — config | camelCase | `env.ts` |
| React components | PascalCase | `UserMarker` |
| Hooks | `use` + PascalCase | `useZoneDetection` |
| Functions | camelCase, verb-first | `fetchZones`, `detectEntry` |
| Constants | SCREAMING_SNAKE_CASE | `LOCATION_TASK_NAME` |
| Types / Interfaces | PascalCase, no `I` prefix | `Zone`, `LocationEvent` |
| Zustand stores | camelCase + `Store` | `useGeofencingStore` |
| Boolean variables | `is` / `has` / `can` prefix | `isActive`, `hasEntered` |
| Event handlers | `handle` prefix | `handleZoneEnter` |

---

## TypeScript rules

- Keep `strict: true` and `noImplicitAny: true`.
- Use `unknown` plus narrowing instead of `any`.
- Avoid unchecked assertions.
- Type function parameters and return values explicitly.
- Prefer `interface` for object shapes.
- Prefer direct imports over barrel re-exports.

---

## Feature file structure

Every feature follows this internal structure:

```txt
features/[name]/
├── components/
├── hooks/
├── services/
├── store/
└── types.ts
```

---

## Hook pattern

```ts
export function useExample() {
  // 1. External dependencies (store, router, clients)
  // 2. Local state
  // 3. Derived values
  // 4. Handlers and effects
  // 5. Single return object
}
```

Rules:

- Hooks return a single object, never an array.
- Async work must use `try/catch`.
- Catch blocks must call `handleError(err, 'context.operation')`.

---

## Service pattern

- Services are pure functions.
- No React hooks in service files.
- No component state in services.
- Parameters and return values must be typed.

---

## Zustand store pattern

- Stores hold state only.
- No side effects, API calls, or async workflows in the store.
- Action names must be verb-first.
- Derived values belong outside the store.

---

## Error handling pattern

- Use `try/catch` for async work.
- Do not use `.catch()` chaining as control flow.
- Do not swallow errors.
- Standardize error reporting through `handleError`.

---

## Component rules

- Use typed `Props` interfaces.
- Prefer named exports for components.
- Do not call Supabase directly from components.
- Do not place `async` directly on JSX event handlers.
- Move non-trivial behavior into hooks or services.
