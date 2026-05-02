# dreyk — Code Conventions

> **Document version:** 1.0
> **Status:** Base definition — pre-code
>
> ### Update policy
> This document may be updated once the codebase is running.
> **No changes may be applied without explicit confirmation from @drakk3 (David).**
> Proposed updates must be presented as a diff of the affected section,
> with a reason for the change. Update is only valid after verbal or written approval.

---

## Naming conventions

| What | Convention | Example |
|---|---|---|
| Files — components | PascalCase | `ZoneCard.tsx` |
| Files — hooks | camelCase + `use` prefix | `useGeofencing.ts` |
| Files — services | camelCase | `zoneEngine.ts` |
| Files — stores | camelCase + `Store` suffix | `geofencingStore.ts` |
| Files — types | camelCase | `types.ts` |
| Files — config | camelCase | `themes.ts` |
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

```ts
// PROHIBITED
const data: any = ...;                    // no any — ever
const user = data as User;               // no type assertions without validation
function fn(x) { ... }                   // no untyped parameters
```

```ts
// REQUIRED
const data: unknown = ...;               // use unknown, then narrow
if (!isZone(data)) throw new Error();    // type guards for external data
function fn(x: string): number { ... }  // always type params and return
```

Additional rules:
- `strict: true` in `tsconfig.json` — no exceptions
- `noImplicitAny: true`
- Prefer `interface` over `type` for object shapes
- Prefer `type` for unions, primitives, and utility types
- No barrel `index.ts` files that re-export everything — import directly

---

## Feature file structure

Every feature follows this exact internal structure:

```
features/[name]/
├── components/       # React Native UI — presentational only
│   └── ZoneCard.tsx
├── hooks/            # Business logic exposed to screens
│   ├── useGeofencing.ts
│   └── useZoneDetection.ts
├── services/         # Pure functions, API calls, external integrations
│   └── zoneEngine.ts
├── store/            # Zustand slice — state only, no side effects
│   └── geofencingStore.ts
└── types.ts          # Types scoped to this feature
```

---

## Hook pattern

```ts
// Standard hook structure
export function useZoneDetection() {
  // 1. External dependencies (store, supabase, theme)
  const zones = useGeofencingStore(s => s.zones);

  // 2. Local state
  const [isChecking, setIsChecking] = useState(false);

  // 3. Derived values
  const activeZones = useMemo(() => zones.filter(z => z.is_active), [zones]);

  // 4. Handlers / effects
  const checkEntry = useCallback(async (coords: Coords) => {
    setIsChecking(true);
    try {
      const result = await detectEntry(coords, activeZones);
      return result;
    } catch (err) {
      handleError(err, 'useZoneDetection.checkEntry');
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [activeZones]);

  // 5. Single return object — never return arrays from hooks
  return { isChecking, activeZones, checkEntry };
}
```

---

## Service pattern

```ts
// Pure functions — no React, no state, no side effects
// services/zoneEngine.ts

import { haversineDistance } from '../../shared/lib/haversine';
import type { Zone, Coords } from '../types';

export function isInsideZone(coords: Coords, zone: Zone): boolean {
  const distance = haversineDistance(coords, {
    latitude:  zone.latitude,
    longitude: zone.longitude,
  });
  return distance <= zone.radius_meters;
}

export function detectEntry(
  coords: Coords,
  zones: Zone[],
  previousState: Map<string, boolean>
): Zone[] {
  return zones.filter(zone => {
    const inside = isInsideZone(coords, zone);
    const wasInside = previousState.get(zone.id) ?? false;
    return inside && !wasInside;  // only new entries
  });
}
```

---

## Zustand store pattern

```ts
// store/geofencingStore.ts
import { create } from 'zustand';
import type { Zone, LocationEvent } from '../types';

interface GeofencingState {
  // State
  zones:          Zone[];
  activeZoneIds:  Set<string>;
  lastEvent:      LocationEvent | null;

  // Actions — always verbs
  setZones:       (zones: Zone[]) => void;
  markEntered:    (zoneId: string) => void;
  markExited:     (zoneId: string) => void;
  setLastEvent:   (event: LocationEvent) => void;
}

export const useGeofencingStore = create<GeofencingState>((set) => ({
  zones:         [],
  activeZoneIds: new Set(),
  lastEvent:     null,

  setZones: (zones) => set({ zones }),

  markEntered: (zoneId) =>
    set(state => ({
      activeZoneIds: new Set([...state.activeZoneIds, zoneId]),
    })),

  markExited: (zoneId) =>
    set(state => {
      const next = new Set(state.activeZoneIds);
      next.delete(zoneId);
      return { activeZoneIds: next };
    }),

  setLastEvent: (event) => set({ lastEvent: event }),
}));
```

---

## Error handling pattern

```ts
// shared/lib/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public readonly context: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(err: unknown, context: string): void {
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error(`[${context}]`, message, err);
  // Future: send to error tracking (Sentry, etc.)
}
```

```ts
// Standard async pattern — always try/catch, never .catch()
async function fetchZones(groupId: string): Promise<Zone[]> {
  try {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (error) throw new AppError(error.message, 'fetchZones');
    return data ?? [];
  } catch (err) {
    handleError(err, 'fetchZones');
    return [];
  }
}
```

---

## Component rules

```tsx
// REQUIRED structure for every component
interface ZoneCardProps {
  zone:     Zone;
  onPress?: () => void;
}

// Named export — no default exports for components
export function ZoneCard({ zone, onPress }: ZoneCardProps) {
  const { theme } = useTheme();

  // No inline logic — extract to hooks
  // No direct supabase calls — go through hooks/services
  // StyleSheet.create outside render, or inline for theme-dependent styles

  return (
    <Card>
      {/* ... */}
    </Card>
  );
}
```

Prohibited in components:
- Direct `supabase` calls
- `async` functions in event handlers (extract to hook)
- Inline `StyleSheet.create` with hardcoded colors (use theme tokens)
- `console.log` (use `handleError` or remove before commit)

---

## Full feature example — minimal geofencing slice

This is the reference pattern. Every new feature follows this exact shape.

```
features/geofencing/
├── types.ts               # Coords, ZoneState
├── services/
│   └── zoneEngine.ts      # isInsideZone, detectEntry (pure)
├── store/
│   └── geofencingStore.ts # Zustand — zones, activeZoneIds
├── hooks/
│   └── useZoneDetection.ts # Wires store + service + supabase
└── components/
    └── ZoneCircle.tsx      # MapView <Circle> wrapper
```

Each file has one responsibility. A screen imports one hook.
The hook composes store + service + supabase. Services are pure.
The store holds state only. Components render only.
