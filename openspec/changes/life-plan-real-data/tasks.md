# life-plan real data tasks

## 1. Domain contracts

- [x] 1.1 Extend `CurrencyCode` to support `USD` while preserving existing `COP` usage.
- [x] 1.2 Add confidence typing for `verified`, `estimated`, and `needsReview` financial values.
- [x] 1.3 Add typed interfaces for dated cash-flow events and weekly checkpoints.
- [x] 1.4 Add debt source metadata that avoids sensitive identifiers.

## 2. Real-data snapshot

- [x] 2.1 Create a feature-owned real-data snapshot for May 2026.
- [x] 2.2 Encode verified spreadsheet totals: income `$4,920`, outflow `$3,346`, free margin `$1,574`.
- [x] 2.3 Map payroll/income entries from the spreadsheet with dates and amounts.
- [x] 2.4 Map scheduled obligations from the spreadsheet with dates, labels, amounts, and confidence.
- [x] 2.5 Map verified debts from Capital One, U.S. Bank, Affirm, America First, and DR Bank/TilaNotice sources.
- [x] 2.6 Mark uncertain rows and manually named obligations as `needsReview` instead of silently trusting them.

## 3. Pure services

- [x] 3.1 Add a `cashFlowCalendar` service for sorting and grouping dated events.
- [x] 3.2 Calculate total inflow, total outflow, and free margin from events.
- [x] 3.3 Calculate weekly checkpoints with running balance support.
- [x] 3.4 Return validation issues when computed totals disagree with declared source totals.

## 4. Integration boundary

- [x] 4.1 Keep the existing mock-first dashboard behavior stable.
- [x] 4.2 Export the real-data foundation without forcing UI adoption in this change.
- [x] 4.3 Add comments only where they explain financial assumptions or source ambiguity.

## 5. Verification

- [x] 5.1 Run targeted typecheck: `npm run typecheck -w @dreyk/web`.
- [ ] 5.2 Run targeted lint: `npm run lint -w @dreyk/web`.
- [x] 5.3 Do not run build commands unless explicitly approved.

### Verification notes

- `npm run typecheck -w @dreyk/web` passed after tasks 1.1-1.4.
- `npm run lint -w @dreyk/web` is blocked by a pre-existing unrelated lint configuration issue in `apps/web/components/thegridcn/progress-ring.tsx`: missing rule definition for `react-hooks/exhaustive-deps`.
- Targeted lint on the touched file passed: `npx eslint apps/web/features/life-plan/types.ts --max-warnings=0`.
- `npm run typecheck -w @dreyk/web` should be rerun after tasks 3.1-4.3.
- Targeted lint for the new real-data foundation files should use `npx eslint apps/web/features/life-plan/realDataSnapshot.ts apps/web/features/life-plan/services/cashFlowCalendar.ts --max-warnings=0` because full workspace lint is still blocked by the unrelated rule-definition issue above.

## Next backlog handoff

- [x] Plan the separate `life-plan-dashboard-tools` change for the spreadsheet replacement UI after this foundation is implemented.

### Handoff notes

- Build commands were intentionally not run in this change.
- The follow-up dashboard replacement work is already captured in `BACKLOG.md` under `life-plan-dashboard-tools`.
