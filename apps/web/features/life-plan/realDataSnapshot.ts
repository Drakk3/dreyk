import type {
  CashFlowEvent,
  CurrencyCode,
  DebtSourceMetadata,
  FinancialDataConfidence,
  FinancialSourceMetadata,
  RecurringObligation,
} from './types';
import {
  buildCashFlowCalendar,
  type CashFlowCalendarSummary,
} from './services/cashFlowCalendar';

export interface DeclaredCashFlowTotals {
  confidence: FinancialDataConfidence;
  currencyCode: CurrencyCode;
  freeMargin: number;
  source: FinancialSourceMetadata;
  totalIncome: number;
  totalOutflow: number;
}

export interface ScheduledObligation extends RecurringObligation {
  scheduledDate: string;
}

export interface RealDebtRecord {
  apr?: number;
  confidence: FinancialDataConfidence;
  creditor: string;
  currencyCode: CurrencyCode;
  id: string;
  label: string;
  balance: number;
  minimumPayment?: number;
  notes?: string;
  source: DebtSourceMetadata;
}

export interface RealDataSnapshot {
  currencyCode: CurrencyCode;
  debtRecords: RealDebtRecord[];
  declaredTotals: DeclaredCashFlowTotals;
  id: string;
  incomeEvents: CashFlowEvent[];
  month: string;
  needsReviewItemIds: string[];
  scheduledObligations: ScheduledObligation[];
}

const USD_CURRENCY_CODE: CurrencyCode = 'USD';

const SPREADSHEET_SOURCE: FinancialSourceMetadata = {
  label: 'Personaldec.xlsx · May 2026 sheet',
  kind: 'spreadsheet',
  capturedOn: '2026-05-13',
  notes: 'Normalized from the workbook; runtime code must not import the raw spreadsheet.',
};

const CAPITAL_ONE_SOURCE: DebtSourceMetadata = {
  label: 'Capital One statement',
  kind: 'statement',
  capturedOn: '2026-05-13',
  balanceConfidence: 'verified',
  aprConfidence: 'verified',
  minimumPaymentConfidence: 'verified',
};

const US_BANK_SOURCE: DebtSourceMetadata = {
  label: 'U.S. Bank statement',
  kind: 'statement',
  capturedOn: '2026-04-13',
  notes: 'Statement shows promo purchases APR 0% through 06/2026 and cash advances APR 30.49%; the blended balance mix still needs review.',
  balanceConfidence: 'verified',
  aprConfidence: 'needsReview',
  minimumPaymentConfidence: 'verified',
};

const AFFIRM_SOURCE: DebtSourceMetadata = {
  label: 'Affirm loan verification',
  kind: 'statement',
  capturedOn: '2026-05-13',
  notes: 'The verification confirms balance and APR, but it does not expose a monthly installment amount in the reviewed summary.',
  balanceConfidence: 'verified',
  aprConfidence: 'verified',
  minimumPaymentConfidence: 'needsReview',
};

const AMERICA_FIRST_SOURCE: DebtSourceMetadata = {
  label: 'America First statement',
  kind: 'statement',
  capturedOn: '2026-05-01',
  balanceConfidence: 'verified',
  aprConfidence: 'verified',
  minimumPaymentConfidence: 'verified',
};

const DR_BANK_SOURCE: DebtSourceMetadata = {
  label: 'DR Bank / TILA notice',
  kind: 'loanDisclosure',
  capturedOn: '2026-05-13',
  notes: 'The disclosure exposes an approximate principal around $2,925 rather than a live payoff balance.',
  balanceConfidence: 'estimated',
  aprConfidence: 'verified',
  minimumPaymentConfidence: 'verified',
};

function createMay2026Date(day: number): string {
  return `2026-05-${String(day).padStart(2, '0')}`;
}

function createIncomeEvent(
  id: string,
  day: number,
  amount: number,
  confidence: FinancialDataConfidence,
  label: string,
  notes?: string,
): CashFlowEvent {
  return {
    id,
    date: createMay2026Date(day),
    label,
    direction: 'inflow',
    category: 'income',
    amount,
    currencyCode: USD_CURRENCY_CODE,
    confidence,
    source: SPREADSHEET_SOURCE,
    ...(notes === undefined ? {} : { notes }),
  };
}

function createScheduledObligation(
  id: string,
  day: number,
  label: string,
  amount: number,
  category: ScheduledObligation['category'],
  cadence: ScheduledObligation['cadence'],
  confidence: FinancialDataConfidence,
  notes?: string,
): ScheduledObligation {
  return {
    id,
    label,
    category,
    cadence,
    expectedAmount: amount,
    currencyCode: USD_CURRENCY_CODE,
    confidence,
    source: SPREADSHEET_SOURCE,
    nextDueDate: createMay2026Date(day),
    scheduledDate: createMay2026Date(day),
    ...(notes === undefined ? {} : { notes }),
  };
}

export const MAY_2026_REAL_DATA_SNAPSHOT: RealDataSnapshot = {
  id: 'life-plan-real-data-2026-05',
  month: '2026-05',
  currencyCode: USD_CURRENCY_CODE,
  declaredTotals: {
    totalIncome: 4920,
    totalOutflow: 3346,
    freeMargin: 1574,
    currencyCode: USD_CURRENCY_CODE,
    confidence: 'verified',
    source: SPREADSHEET_SOURCE,
  },
  incomeEvents: [
    createIncomeEvent('income-2026-05-01-payroll', 1, 880, 'verified', 'Payroll deposit'),
    createIncomeEvent('income-2026-05-08-payroll', 8, 980, 'verified', 'Payroll deposit'),
    createIncomeEvent(
      'income-2026-05-08-supplemental',
      8,
      120,
      'verified',
      'Supplemental inflow',
      'The spreadsheet records the amount but does not label the source beyond the dated inflow cell.',
    ),
    createIncomeEvent('income-2026-05-15-payroll', 15, 980, 'verified', 'Payroll deposit'),
    createIncomeEvent(
      'income-2026-05-15-supplemental',
      15,
      120,
      'verified',
      'Supplemental inflow',
      'The spreadsheet records the amount but does not label the source beyond the dated inflow cell.',
    ),
    createIncomeEvent('income-2026-05-22-payroll', 22, 800, 'verified', 'Payroll deposit'),
    createIncomeEvent(
      'income-2026-05-22-usbank',
      22,
      120,
      'needsReview',
      'U.S. Bank inflow',
      'The row carries a manual "usbank" label, so the inflow stays visible without being treated as fully trusted payroll income.',
    ),
    createIncomeEvent('income-2026-05-29-payroll', 29, 800, 'verified', 'Payroll deposit'),
    createIncomeEvent(
      'income-2026-05-29-supplemental',
      29,
      120,
      'verified',
      'Supplemental inflow',
      'The spreadsheet records the amount but does not label the source beyond the dated inflow cell.',
    ),
  ],
  scheduledObligations: [
    createScheduledObligation('obligation-2026-05-04-mazda-seguro', 4, 'Mazda Seguro', 300, 'insurance', 'monthly', 'verified'),
    createScheduledObligation(
      'obligation-2026-05-05-us-bank-card',
      5,
      'Credit Card USBank',
      170,
      'debtPayment',
      'monthly',
      'estimated',
      'The spreadsheet amount appears to be a planned payment, not the statement minimum of $40.',
    ),
    createScheduledObligation('obligation-2026-05-05-utel', 5, 'Utel', 263, 'tuition', 'monthly', 'verified'),
    createScheduledObligation(
      'obligation-2026-05-05-gas-food',
      5,
      'Gasolina y Comida',
      120,
      'foodAndFuel',
      'weekly',
      'needsReview',
      'Manual bucket label that blends multiple spending categories.',
    ),
    createScheduledObligation('obligation-2026-05-09-crunchyroll', 9, 'Crunchyroll', 16, 'subscription', 'monthly', 'verified'),
    createScheduledObligation('obligation-2026-05-10-claude', 10, 'Claude', 30, 'subscription', 'monthly', 'verified'),
    createScheduledObligation('obligation-2026-05-11-t-mobile', 11, 'T Mobile', 156, 'utility', 'monthly', 'verified'),
    createScheduledObligation(
      'obligation-2026-05-12-gas-food',
      12,
      'Gasolina y Comida',
      120,
      'foodAndFuel',
      'weekly',
      'needsReview',
      'Manual bucket label that blends multiple spending categories.',
    ),
    createScheduledObligation('obligation-2026-05-13-energy', 13, 'Energy', 56, 'utility', 'monthly', 'verified'),
    createScheduledObligation(
      'obligation-2026-05-15-mazda-loan',
      15,
      'Mazda',
      309,
      'debtPayment',
      'monthly',
      'verified',
      'Rounded from the America First statement payment amount of $308.78.',
    ),
    createScheduledObligation('obligation-2026-05-16-cox', 16, 'Cox', 70, 'utility', 'monthly', 'verified'),
    createScheduledObligation(
      'obligation-2026-05-19-gas-food',
      19,
      'Gasolina y Comida',
      120,
      'foodAndFuel',
      'weekly',
      'needsReview',
      'Manual bucket label that blends multiple spending categories.',
    ),
    createScheduledObligation(
      'obligation-2026-05-19-dilan',
      19,
      'Dilan',
      130,
      'familySupport',
      'oneTime',
      'needsReview',
      'The spreadsheet label is a personal shorthand rather than a reconciled vendor or debt source.',
    ),
    createScheduledObligation(
      'obligation-2026-05-19-colombia',
      19,
      'Colombia',
      400,
      'familySupport',
      'oneTime',
      'needsReview',
      'The spreadsheet label indicates destination intent, but the exact obligation type still needs manual confirmation.',
    ),
    createScheduledObligation(
      'obligation-2026-05-22-upstart',
      22,
      'UpStart',
      104,
      'debtPayment',
      'monthly',
      'verified',
      'Mapped from the DR Bank / TILA-backed personal loan payment.',
    ),
    createScheduledObligation(
      'obligation-2026-05-23-capital-one-card',
      23,
      'Credit Card Cap One',
      0,
      'debtPayment',
      'monthly',
      'needsReview',
      'The spreadsheet contains the row label but no amount, so the placeholder remains zero until the payment plan is clarified.',
    ),
    createScheduledObligation('obligation-2026-05-26-microsoft', 26, 'Microsoft', 12, 'subscription', 'monthly', 'verified'),
    createScheduledObligation(
      'obligation-2026-05-26-gas-food',
      26,
      'Gasolina y Comida',
      20,
      'foodAndFuel',
      'weekly',
      'needsReview',
      'Manual bucket label that blends multiple spending categories.',
    ),
    createScheduledObligation('obligation-2026-05-26-rent', 26, 'Renta', 800, 'housing', 'monthly', 'verified'),
    createScheduledObligation(
      'obligation-2026-05-30-affirm',
      30,
      'Affirm',
      30,
      'debtPayment',
      'monthly',
      'estimated',
      'The spreadsheet plans a $30 payment, but the reviewed verification summary did not confirm the installment amount.',
    ),
    createScheduledObligation(
      'obligation-2026-05-30-yt-music-gas',
      30,
      'YT Music & Gas',
      120,
      'other',
      'oneTime',
      'needsReview',
      'Manual mixed-purpose label that combines subscription and fuel spending in one row.',
    ),
  ],
  debtRecords: [
    {
      id: 'debt-capital-one',
      label: 'Credit card',
      creditor: 'Capital One',
      balance: 422.07,
      apr: 0.2899,
      minimumPayment: 25,
      currencyCode: USD_CURRENCY_CODE,
      confidence: 'verified',
      source: CAPITAL_ONE_SOURCE,
    },
    {
      id: 'debt-us-bank',
      label: 'Credit card',
      creditor: 'U.S. Bank',
      balance: 597.34,
      apr: 0,
      minimumPayment: 40,
      currencyCode: USD_CURRENCY_CODE,
      confidence: 'needsReview',
      source: US_BANK_SOURCE,
      notes: 'The statement confirms the balance and minimum payment, but the effective APR requires manual review because promo purchases and advances use different rates.',
    },
    {
      id: 'debt-affirm',
      label: 'Installment loan',
      creditor: 'Affirm',
      balance: 280.05,
      apr: 0.3561,
      currencyCode: USD_CURRENCY_CODE,
      confidence: 'estimated',
      source: AFFIRM_SOURCE,
      notes: 'The reviewed source confirms a 12-month installment loan with verified balance and APR but no verified minimum payment in the extracted summary.',
    },
    {
      id: 'debt-america-first-auto',
      label: 'Auto loan',
      creditor: 'America First',
      balance: 15402.96,
      apr: 0.0674,
      minimumPayment: 308.78,
      currencyCode: USD_CURRENCY_CODE,
      confidence: 'verified',
      source: AMERICA_FIRST_SOURCE,
    },
    {
      id: 'debt-dr-bank',
      label: 'Personal loan',
      creditor: 'DR Bank',
      balance: 2925,
      apr: 0.1618,
      minimumPayment: 103.13,
      currencyCode: USD_CURRENCY_CODE,
      confidence: 'estimated',
      source: DR_BANK_SOURCE,
      notes: 'The TILA notice exposes approximate principal instead of a live payoff statement, so the balance stays estimated until a current statement is reviewed.',
    },
  ],
  needsReviewItemIds: [
    'income-2026-05-22-usbank',
    'obligation-2026-05-05-gas-food',
    'obligation-2026-05-12-gas-food',
    'obligation-2026-05-19-gas-food',
    'obligation-2026-05-19-dilan',
    'obligation-2026-05-19-colombia',
    'obligation-2026-05-23-capital-one-card',
    'obligation-2026-05-26-gas-food',
    'obligation-2026-05-30-yt-music-gas',
    'debt-us-bank',
  ],
};

export const MAY_2026_REAL_DATA_CASH_FLOW_CALENDAR: CashFlowCalendarSummary = buildCashFlowCalendar(
  MAY_2026_REAL_DATA_SNAPSHOT,
);
