# Life-plan real data design

The change introduces a normalized real-data layer for `life-plan` while keeping raw personal finance files outside runtime code.

## Decision summary

| Decision | Rationale |
|----------|-----------|
| Use a typed TypeScript snapshot first | Faster, reviewable, and consistent with current mock-first architecture. |
| Do not parse Excel/PDF at runtime | Avoids heavy dependencies, privacy leakage, brittle document parsing, and client bundle risk. |
| Add USD support before real data | Current `CurrencyCode` only allows `COP`; forcing USD through it would be lying to the type system. |
| Model review confidence | Real documents contain verified values, estimates, and manual labels. The UI must know the difference. |
| Keep dashboard replacement tools separate | This change builds the foundation; the spreadsheet-like UI is the next backlog item. |

## Target architecture

```txt
apps/web/features/life-plan/
├── types.ts                         ← domain contracts extended for USD and dated events
├── mockData.ts                      ← existing demo snapshot remains available
├── realDataSnapshot.ts              ← normalized real May 2026 snapshot
└── services/
    ├── financialPlan.ts             ← existing monthly/debt projection logic
    └── cashFlowCalendar.ts          ← pure weekly/date-based summarization
```

`realData/` remains outside the app feature and acts as source evidence only.

## Data concepts

| Concept | Purpose |
|---------|---------|
| `FinancialDataConfidence` | `verified`, `estimated`, or `needsReview`. |
| `CashFlowEvent` | A dated inflow/outflow from payroll, bills, subscriptions, debt payments, or manual obligations. |
| `RecurringObligation` | A repeated bill pattern such as rent, fuel/food, phone, utilities, or debt minimums. |
| `DebtSourceMetadata` | Where a debt value came from without exposing sensitive account details. |
| `WeeklyCashFlowCheckpoint` | Weekly totals and running balance for dashboard rendering later. |

## Source mapping

| Source | Use |
|--------|-----|
| `Personaldec.xlsx` | May 2026 date-based cash-flow baseline. |
| `payment-stub (40).pdf` | Verified hourly rate `$24.00`, period hours `37.77`, net pay `$770.29`. |
| Capital One statement | Credit card balance, minimum payment, APR. |
| U.S. Bank statement | Credit card balance, minimum payment, promo APR context. |
| Affirm verification | Installment loan balance and APR. |
| America First statement | Auto loan balance, due amount, APR. |
| TilaNotice / DR Bank | Personal loan principal, APR, monthly payment. |

## Service behavior

`cashFlowCalendar.ts` should expose pure functions only:

- sort events by date and stable order;
- calculate total inflow, total outflow, and free margin;
- group events by week/checkpoint;
- flag mismatches between declared summary totals and computed totals;
- avoid React, Supabase, browser APIs, and side effects.

## Privacy boundary

UI copy may say “Capital One statement” or “U.S. Bank statement”, but MUST NOT expose full account numbers, addresses, employment IDs, bank account numbers, or document identifiers unless the user explicitly approves a later secure view.

## Verification strategy

No test runner is currently installed. Verification for this change should use:

1. `npm run typecheck -w @dreyk/web`
2. `npm run lint -w @dreyk/web`

Do not run build commands automatically.
