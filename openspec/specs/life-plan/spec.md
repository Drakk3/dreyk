# life-plan real data delta spec

## ADDED Requirements

### Requirement: USD life-plan snapshots

The life-plan domain MUST support USD financial snapshots in addition to the existing COP snapshot.

#### Scenario: real-data snapshot uses USD

- **Given** the real financial data describes U.S.-based income, bills, and debts
- **When** the data is represented in the life-plan domain
- **Then** the snapshot currency MUST be `USD`
- **And** the existing COP mock snapshot MUST remain valid until explicitly replaced by UI wiring

### Requirement: normalized real-data source

The life-plan feature MUST represent real financial inputs as typed domain data, not as runtime Excel or PDF parsing.

#### Scenario: raw files are evidence only

- **Given** source files exist in `realData/`
- **When** the dashboard loads life-plan data
- **Then** it MUST NOT import or parse `.xlsx` or `.pdf` files at runtime
- **And** it SHOULD read from a normalized TypeScript snapshot or adapter

### Requirement: May 2026 cash-flow baseline

The normalized real-data snapshot MUST preserve the verified May 2026 spreadsheet totals.

#### Scenario: baseline totals match source spreadsheet

- **Given** the May 2026 spreadsheet contains total income `$4,920`
- **And** total outflow `$3,346`
- **When** the real-data cash-flow summary is calculated
- **Then** the expected free margin MUST be `$1,574`
- **And** any mismatch MUST be surfaced as a validation issue, not silently ignored

### Requirement: dated cash-flow events

The domain MUST model dated inflow and outflow events so the dashboard can later replace the spreadsheet calendar.

#### Scenario: weekly payroll timing is preserved

- **Given** income appears on multiple May 2026 dates
- **When** the real-data adapter maps those entries
- **Then** each income item MUST keep its date and amount
- **And** weekly summaries MUST be derivable without losing date-level detail

### Requirement: real debt reconciliation

The real-data foundation MUST include debt records from supporting PDFs when balance, minimum payment, or APR is verifiable.

#### Scenario: verified debt source is represented safely

- **Given** a statement exposes a debt balance, APR, and/or minimum payment
- **When** the debt is mapped into life-plan
- **Then** the mapped debt MUST include the creditor label, balance, APR when known, minimum payment when known, and source confidence
- **And** it MUST NOT include full account numbers or sensitive personal identifiers

### Requirement: confidence states

The real-data model MUST distinguish verified, estimated, and review-needed values.

#### Scenario: ambiguous manual bill is not treated as verified

- **Given** a spreadsheet row has a label or amount that cannot be reconciled to a source document
- **When** it is normalized
- **Then** the item MUST be marked `needsReview` or `estimated`
- **And** downstream summaries MAY include it only with confidence metadata intact

### Requirement: pure financial services

Cash-flow and debt summarization services MUST remain pure functions.

#### Scenario: cash-flow summary is calculated without side effects

- **Given** a list of typed cash-flow events
- **When** the summary service runs
- **Then** it MUST return totals, weekly checkpoints, and validation issues
- **And** it MUST NOT use React hooks, Supabase clients, browser APIs, mutable global state, or network calls
