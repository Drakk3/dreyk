# Backlog

## feature-first-realignment

- Keep `signOut` as shared behavior in the app shell API.
- Long-term, `activeNav` should also be modeled in the shared shell contract because it represents feature navigation state rendered by a shared sidebar template.
- Short-term, keep `activeNav` wired directly from the feature while the shell is refactored.
- Follow-up refactor: instantiate a shared base `MainSideNavbar` component/template and let each feature provide its own sections via typed props.
- Expected direction: shared template, feature-owned section definitions.

## phase-4-polish

- Treat `Phase 4 — Web authenticated shells` as complete for roadmap purposes, but keep a small polish backlog for non-blocking shell hardening.
- Review role landing behavior so redirects are explicit and future module entry points do not depend on minimal fallback routing.
- Replace remaining placeholder/admin shell copy with truthful product language once the operational modules are real.
- Keep this work out of the critical path while `Phase 5+` geofencing recovery is underway.

## phase-5-post-realignment-hardening

- Create a dedicated SDD follow-up that starts only AFTER `phase-5-geofencing-contract-realignment` is implemented and archived.
- Use that SDD to resolve the risks intentionally deferred by the Phase 5 baseline:
  - confirm whether `mapcn` remains sufficient or whether the map canvas should drop to direct `MapLibre` control for future phases
  - harden event-volume strategy for the geofencing read model so larger datasets do not degrade the workspace
  - decide the first explicit admin filter surface for group/user/event slicing
  - verify there are no leftover mock assumptions or preview-era abstractions contaminating the Phase 5 baseline
- Treat this SDD as mandatory before beginning `Phase 6 — Zone management`, so CRUD does not build on an insufficiently hardened map/read-model foundation.

## life-plan-real-data

- Replace the current mock-only financial snapshot with a normalized real-data snapshot derived from `realData/Personaldec.xlsx` and the supporting financial PDFs.
- Keep the raw files in `realData/` as source evidence, but do not make the dashboard read Excel/PDF files directly at runtime.
- Introduce a typed real-data adapter that converts spreadsheet-style rows into domain concepts: income events, scheduled bills, debt obligations, weekly cash-flow checkpoints, and monthly summary totals.
- Preserve strict TypeScript boundaries: no `any`, no unvalidated type assertions, explicit return types, and object shapes modeled with `interface`.
- Add support for USD life-plan snapshots before wiring the real data, because the current feature is typed as COP-only and the real documents are in USD.
- Model the May 2026 Excel totals as the first verified baseline: total income `$4,920`, total outflow `$3,346`, expected free margin `$1,574`.
- Reconcile real debts from the PDFs into the life-plan debt cascade:
  - Capital One: balance `$422.07`, minimum payment `$25`, APR `28.99%`.
  - U.S. Bank: balance `$597.34`, minimum payment `$40`, promo purchase APR `0%` through `06/2026`.
  - Affirm: balance `$280.05`, APR `35.61%`, 12-month installment loan.
  - America First auto loan: balance `$15,402.96`, payment `$308.78`, APR `6.740%`.
  - DR Bank / Upstart-style loan: principal around `$2,925`, payment `$103.13`, APR `16.18%`.
- Keep ambiguous or manually-entered obligations flagged as `needsReview` instead of pretending the data is certain.

## life-plan-dashboard-tools

- Build an in-dashboard replacement for the spreadsheet calendar so the user can stop maintaining `Personaldec.xlsx` manually.
- Add a weekly cash-flow board that shows each planned date, bill/income label, outflow, inflow, running balance, and expected end-of-month free margin.
- Add a recurring obligation manager for weekly/monthly items such as rent, fuel/food, subscriptions, utilities, tuition, debt minimums, and family support.
- Add a debt payoff planner that compares avalanche, snowball, and manual-priority strategies using the real debt balances and APRs.
- Add a “safe extra payment” helper that calculates how much can be sent to debt without breaking upcoming rent, gas/food, utilities, or payroll timing.
- Add scenario controls for income changes, bill timing shifts, emergency expenses, and subscription cuts.
- Add review states for imported data: `verified`, `estimated`, and `needsReview`, so the dashboard teaches confidence instead of hiding uncertainty.
- Add privacy-aware source references that identify which document produced a number without exposing sensitive account details in UI copy.

## engineering-debt

- Fix the workspace lint blocker caused by the missing `react-hooks/exhaustive-deps` rule definition in `apps/web/components/thegridcn/progress-ring.tsx` so `npm run lint -w @dreyk/web` can pass end-to-end again.
- Run a focused cleanup pass on general TypeScript errors/debt across the web workspace, prioritizing strict typing regressions and cross-file contract drift before they affect future feature work.
