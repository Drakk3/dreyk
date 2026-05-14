# Life-plan real data foundation

Normalize the real financial context from `realData/` into the `life-plan` domain without making the dashboard parse Excel or PDFs at runtime.

## Why

The current `life-plan` dashboard is mock-first and COP-only. The newly supplied real data describes a USD-based monthly/weekly cash-flow plan for May 2026 plus real debt documents. If we wire those numbers directly into the existing mock snapshot, we mix currencies, personas, and assumptions. That is fragile, and you know why? Because finance dashboards are decision tools: bad assumptions become bad decisions.

## What changes

| Area | Change |
|------|--------|
| Currency | Extend life-plan types to support USD snapshots. |
| Data model | Add typed concepts for income events, scheduled obligations, weekly checkpoints, debt source metadata, and review confidence. |
| Real snapshot | Add a normalized TypeScript snapshot based on `realData/Personaldec.xlsx` and supporting PDFs. |
| Services | Add pure functions that summarize real cash-flow data without React or Supabase. |
| Dashboard handoff | Keep UI changes minimal in this change; dashboard tools come later from backlog. |

## In scope

- Preserve `realData/` as source evidence only.
- Introduce a feature-owned real-data snapshot or adapter under `apps/web/features/life-plan/` using strict TypeScript.
- Model the verified May 2026 baseline:
  - income: `$4,920`
  - outflow: `$3,346`
  - expected free margin: `$1,574`
- Reconcile real debt records from PDFs where the source is clear.
- Flag uncertain/manual obligations as `needsReview` instead of pretending certainty.
- Add non-build verification instructions.

## Out of scope

- Runtime XLSX/PDF parsing.
- Database persistence.
- Import UI.
- Full spreadsheet replacement dashboard tools.
- Financial advice automation beyond deterministic calculations and clearly labeled scenarios.

## Affected modules

- `apps/web/features/life-plan/types.ts`
- `apps/web/features/life-plan/mockData.ts`
- `apps/web/features/life-plan/services/financialPlan.ts`
- New feature-owned support files under `apps/web/features/life-plan/` or `services/`.

## Rollback plan

Revert the added real-data types, snapshot, and services. The existing mock-first dashboard should continue to work because the current `LIFE_PLAN_SNAPSHOT` contract remains available until a later UI migration deliberately switches data sources.

## Review path

1. Review `specs/life-plan/spec.md` for expected behavior.
2. Review `design.md` for boundary decisions.
3. Review `tasks.md` for implementation sequencing.
