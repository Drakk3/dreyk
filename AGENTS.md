# dreyk — Agent & Code Review Rules

This file is used by Gentleman Guardian Angel (GGA) as the `RULES_FILE` for automated code review,
and by AI agents as the project conventions index.

---

## Code Review Rules

### 1. TypeScript

- **REJECT** any use of `any` — use `unknown` and narrow with type guards
- **REJECT** type assertions (`as T`) without prior validation
- **REJECT** untyped function parameters or missing return types
- **REQUIRE** `strict: true` and `noImplicitAny: true` to remain in all tsconfigs
- **REQUIRE** `interface` for object shapes — `type` only for unions, primitives, utility types
- **REJECT** barrel `index.ts` files that re-export everything — import the file directly

### 2. Architecture Boundaries

- **REJECT** any import from `apps/web` inside `apps/companion` or vice versa
- **REJECT** any import from `apps/*` inside `packages/shared`
- **REJECT** any cross-feature import (e.g., `features/geofencing` importing from `features/notifications`)
- **REQUIRE** shared code to live in `packages/shared` (cross-app) or `apps/[app]/shared/` (within-app)
- **REJECT** `supabase/functions` importing from `packages/shared` — Edge Functions are standalone Deno

### 3. Components

- **REQUIRE** named exports — no default exports for components
  - **Exception**: Next.js App Router requires default exports for `page.tsx` and `layout.tsx` — this rule does NOT apply to those files (framework constraint)
- **REJECT** direct `supabase` calls inside components — always go through hooks or services
- **REJECT** `async` functions directly in event handlers — extract to hook
- **REJECT** `console.log` — use `handleError` from `shared/lib/errors.ts` or remove before commit
- **REJECT** hardcoded colors inline — always use theme tokens
- **REQUIRE** every component to have a typed `Props` interface

### 4. Hooks

Hooks MUST follow this exact 5-step structure (order matters):

```ts
export function useXxx() {
  // 1. External dependencies (store, supabase, theme)
  // 2. Local state
  // 3. Derived values (useMemo)
  // 4. Handlers and effects (useCallback, useEffect)
  // 5. Single return object — NEVER return an array from a hook
}
```

- **REJECT** hooks that return arrays
- **REJECT** hooks with direct supabase calls outside a try/catch
- **REQUIRE** `handleError(err, 'hookName.fnName')` in every catch block

### 5. Services

- **REQUIRE** services to be pure functions — no React, no state, no side effects
- **REJECT** React hooks inside service files
- **REJECT** Supabase client calls in service files — those belong in hooks
- **REQUIRE** all parameters and return types to be explicitly typed

### 6. Zustand Stores

- **REQUIRE** stores to hold state only — no side effects, no async operations, no API calls
- **REQUIRE** all action names to start with a verb (`setZones`, `markEntered`, `clearState`)
- **REJECT** computed values inside the store — derive them in hooks with `useMemo`

### 7. Error Handling

- **REQUIRE** `try/catch` for all async operations
- **REJECT** `.catch()` chaining — always use `try/catch`
- **REQUIRE** `handleError(err, 'context.operation')` in every catch block
- **REJECT** swallowed errors (empty catch blocks)

### 8. Naming Conventions

| What | Required Pattern | Example |
|------|-----------------|---------|
| Component files | PascalCase | `ZoneCard.tsx` |
| Hook files | `use` + camelCase | `useGeofencing.ts` |
| Service files | camelCase | `zoneEngine.ts` |
| Store files | camelCase + `Store` | `geofencingStore.ts` |
| Constants | SCREAMING_SNAKE_CASE | `LOCATION_TASK_NAME` |
| Boolean vars | `is` / `has` / `can` prefix | `isActive`, `hasEntered` |
| Event handlers | `handle` prefix | `handleZoneEnter` |

### 9. Feature Structure

Every feature MUST follow this exact internal layout — no extra directories:

```
features/[name]/
├── components/   ← presentational only
├── hooks/        ← business logic
├── services/     ← pure functions
├── store/        ← Zustand state slice
└── types.ts      ← feature-scoped types
```

- **REJECT** business logic directly in `components/`
- **REJECT** React code in `services/`
- **REJECT** API calls in `store/`

### 10. Design System (PWA only)

- **REQUIRE** the PWA/frontend to use **TheGridCN end-to-end** as the only design-system language
- **REJECT** building custom PWA components from scratch without first asking the user explicitly
- **REQUIRE** that any request for a custom PWA component explains why TheGridCN/shadcn coverage is insufficient and what the maintenance/design implications are
- **REJECT** inline shadows — elevation is done via background layers only
- **REJECT** borders thicker than `0.5px` except for focus states (`1px accent`)
- **REJECT** center-aligned text — always flush-left
- **REJECT** entrance animations — elements must snap into existence
- **REJECT** gradients outside GridCN's built-in glow system
- **REJECT** corner radii larger than `14px`
- **REQUIRE** numerical values to be labeled with their unit (e.g., `150MS`, `500M`, `1.2KM`)

### 11. Motion & Transitions

- **REQUIRE** `duration: 150ms` for all transitions
- **REJECT** bounce or elastic easing curves
- **REJECT** entrance animations on any element

### 12. Commit Format

- **REQUIRE** conventional commits: `type(scope): description`
- **REJECT** `Co-Authored-By` trailers or AI attribution in commits
- Valid types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`, `perf`, `build`, `ci`

### 13. Build Verification

- **REJECT** running build commands automatically after changes
- **REQUIRE** explicit user approval before running any build command
- **ALLOW** agents to suggest build verification at integration checkpoints, before PRs, before releases, or after structural changes such as package exports, tsconfig, bundler, dependency, or monorepo configuration changes
- **REQUIRE** agents to explain why a build is suggested and what command would run before asking for approval
- **REQUIRE** non-build verification first when possible — lint, type-check, tests, import smoke checks, or targeted CLI checks

---

## Skills Index

Skills available to AI agents in this project:

| Skill | Trigger | Path |
|-------|---------|------|
| `go-testing` | Writing Go tests, teatest, coverage | [SKILL.md](~/.claude/skills/go-testing/SKILL.md) |
| `skill-creator` | Creating a new skill, documenting AI patterns | [SKILL.md](~/.claude/skills/skill-creator/SKILL.md) |
| `branch-pr` | Creating a PR, preparing changes for review | [SKILL.md](~/.claude/skills/branch-pr/SKILL.md) |
| `issue-creation` | Creating a GitHub issue, reporting a bug | [SKILL.md](~/.claude/skills/issue-creation/SKILL.md) |
| `judgment-day` | Adversarial dual review, "juzgar", "dual review" | [SKILL.md](~/.claude/skills/judgment-day/SKILL.md) |

---

## Project Conventions Index

| Document | What it covers |
|----------|----------------|
| [01-architecture.md](01-architecture.md) | Monorepo structure, tech stack, dependency rules, auth flow, GPS pipeline |
| [02-data-model.md](02-data-model.md) | SQL tables, indexes, RLS policies, TypeScript types |
| [03-design-system.md](03-design-system.md) | TheGridCN, tokens, typography, component strategy, motion rules |
| [04-code-conventions.md](04-code-conventions.md) | Naming, TypeScript rules, hook/service/store patterns, error handling |
| [05-development-phases.md](05-development-phases.md) | Phase 0–14 with exit criteria and critical dependency order |
