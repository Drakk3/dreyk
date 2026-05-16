import { describe, expect, it } from 'vitest';

import type {
  LifePlanDebtAccountRow,
  LifePlanDebtPaymentEventRow,
  LifePlanEntryStatusHistoryRow,
  LifePlanMonthEntryRow,
  LifePlanMonthRow,
  LifePlanRecurringTemplateRow,
} from '@dreyk/shared/types/database';

import {
  mapMonthRecord,
  mapOperatingMonthToWritePayload,
  mapPersistenceRecordToOperatingMonth,
} from './lifePlanPersistence';

const OWNER_USER_ID = 'owner-user-id';

function createMonthRow(): LifePlanMonthRow {
  return {
    created_at: '2026-05-01T00:00:00.000Z',
    currency_code: 'USD',
    id: 'month-2026-05',
    month_key: '2026-05',
    owner_user_id: OWNER_USER_ID,
    seeded_from_month_id: null,
  };
}

function createDebtAccountRows(): LifePlanDebtAccountRow[] {
  return [
    {
      apr_assumption_decimal: null,
      apr_confidence: 'estimated',
      apr_source_context: {},
      balance_confidence: 'verified',
      balance_usd: 912.55,
      confidence: 'verified',
      created_at: '2026-05-01T00:00:00.000Z',
      creditor: 'Caja Social',
      id: 'debt-secondary',
      is_excluded_from_payoff_line: false,
      label: 'Moto loan',
      minimum_payment_confidence: 'needsReview',
      minimum_payment_usd: null,
      notes: null,
      owner_user_id: OWNER_USER_ID,
      priority: 2,
      source_metadata: {
        capturedOn: '2026-05-01',
        kind: 'statement',
        label: 'Moto statement',
      },
    },
    {
      apr_assumption_decimal: 0.1875,
      apr_confidence: 'verified',
      apr_source_context: { note: 'from lender disclosure' },
      balance_confidence: 'verified',
      balance_usd: 1450.12,
      confidence: 'verified',
      created_at: '2026-05-01T00:00:00.000Z',
      creditor: 'Davivienda',
      id: 'debt-primary',
      is_excluded_from_payoff_line: false,
      label: 'Credit card',
      minimum_payment_confidence: 'verified',
      minimum_payment_usd: 120,
      notes: 'Snowball first',
      owner_user_id: OWNER_USER_ID,
      priority: 1,
      source_metadata: {
        capturedOn: '2026-05-01',
        kind: 'statement',
        label: 'Card statement',
        notes: 'Imported from PDF',
      },
    },
  ];
}

function createRecurringTemplateRows(): LifePlanRecurringTemplateRow[] {
  return [
    {
      amount_usd: 120,
      cadence: 'monthly',
      category: 'debtPayment',
      confidence: 'verified',
      created_at: '2026-05-01T00:00:00.000Z',
      debt_account_id: 'debt-primary',
      id: 'template-debt',
      is_active: true,
      label: 'Credit card payment',
      notes: null,
      owner_user_id: OWNER_USER_ID,
      scheduled_day: 15,
      source_metadata: {
        capturedOn: '2026-05-01',
        kind: 'manual',
        label: 'Payment plan',
      },
    },
    {
      amount_usd: 45.32,
      cadence: 'monthly',
      category: 'foodAndFuel',
      confidence: 'estimated',
      created_at: '2026-05-01T00:00:00.000Z',
      debt_account_id: null,
      id: 'template-food',
      is_active: true,
      label: 'Weekly groceries bucket',
      notes: 'Keep flexible',
      owner_user_id: OWNER_USER_ID,
      scheduled_day: 20,
      source_metadata: {
        capturedOn: '2026-05-01',
        kind: 'spreadsheet',
        label: 'Budget sheet',
      },
    },
  ];
}

function createEntryRows(): LifePlanMonthEntryRow[] {
  return [
    {
      amount_usd: 120,
      category: 'debtPayment',
      confidence: 'verified',
      created_at: '2026-05-01T00:00:00.000Z',
      debt_account_id: 'debt-primary',
      entry_date: '2026-05-15',
      id: 'entry-debt',
      kind: 'debt',
      label: 'Credit card payment',
      month_id: 'month-2026-05',
      notes: 'Paid from checking',
      owner_user_id: OWNER_USER_ID,
      source_kind: 'manual',
      source_metadata: {
        capturedOn: '2026-05-15',
        kind: 'statement',
        label: 'Card statement',
      },
      status: 'done',
      template_id: 'template-debt',
    },
    {
      amount_usd: 980.75,
      category: 'income',
      confidence: 'verified',
      created_at: '2026-05-01T00:00:00.000Z',
      debt_account_id: null,
      entry_date: '2026-05-15',
      id: 'entry-income',
      kind: 'income',
      label: 'Teaching paycheck',
      month_id: 'month-2026-05',
      notes: null,
      owner_user_id: OWNER_USER_ID,
      source_kind: 'manual',
      source_metadata: {
        capturedOn: '2026-05-15',
        kind: 'payStub',
        label: 'May paystub',
      },
      status: 'done',
      template_id: null,
    },
  ];
}

function createStatusHistoryRows(): LifePlanEntryStatusHistoryRow[] {
  return [
    {
      changed_at: '2026-05-15T12:00:00.000Z',
      entry_id: 'entry-debt',
      from_status: 'planned',
      id: 'history-entry-debt',
      owner_user_id: OWNER_USER_ID,
      reason: null,
      to_status: 'done',
    },
  ];
}

function createDebtPaymentEventRows(): LifePlanDebtPaymentEventRow[] {
  return [
    {
      amount_usd: 120,
      balance_after_usd: 1330.12,
      created_at: '2026-05-15T12:01:00.000Z',
      debt_account_id: 'debt-primary',
      entry_id: 'entry-debt',
      id: 'payment-event-1',
      notes: null,
      owner_user_id: OWNER_USER_ID,
      payment_date: '2026-05-15',
    },
  ];
}

describe('lifePlanPersistence mappers', () => {
  it('maps persisted records into an operating month and back into write payloads', () => {
    const record = mapMonthRecord(
      createMonthRow(),
      createEntryRows(),
      createStatusHistoryRows(),
      createDebtAccountRows(),
      createRecurringTemplateRows(),
      createDebtPaymentEventRows(),
    );

    const month = mapPersistenceRecordToOperatingMonth(record);

    expect(month.month).toBe('2026-05');
    expect(month.debtTracks.map((debtTrack) => debtTrack.id)).toEqual(['debt-primary', 'debt-secondary']);
    expect(month.entries.map((entry) => entry.id)).toEqual(['entry-income', 'entry-debt']);
    expect(month.recurringQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'incorporated', templateId: 'template-debt' }),
        expect.objectContaining({ status: 'pending', templateId: 'template-food' }),
      ]),
    );

    const incomeEntry = month.entries.find((entry) => entry.id === 'entry-income');
    const paymentEntry = month.entries.find((entry) => entry.id === 'entry-debt');

    expect(incomeEntry).toBeDefined();
    expect(paymentEntry).toBeDefined();

    if (incomeEntry === undefined || paymentEntry === undefined) {
      throw new Error('Expected mapped entries to exist.');
    }

    expect(Object.hasOwn(incomeEntry, 'debtId')).toBe(false);
    expect(Object.hasOwn(incomeEntry, 'notes')).toBe(false);
    expect(Object.hasOwn(incomeEntry, 'templateId')).toBe(false);
    expect(paymentEntry.templateId).toBe('template-debt');

    const writePayload = mapOperatingMonthToWritePayload(OWNER_USER_ID, month);
    const incomeEntryRow = writePayload.entryRows.find((entryRow) => entryRow.id === 'entry-income');

    expect(incomeEntryRow).toBeDefined();

    if (incomeEntryRow === undefined) {
      throw new Error('Expected income entry row to exist.');
    }

    expect(writePayload.monthRow).toMatchObject({
      currency_code: 'USD',
      id: 'month-2026-05',
      month_key: '2026-05',
      seeded_from_month_id: null,
    });
    expect(writePayload.recurringTemplateRows).toHaveLength(2);
    expect(writePayload.debtPaymentEventRows).toHaveLength(1);
    expect(incomeEntryRow.debt_account_id).toBeNull();
    expect(incomeEntryRow.notes).toBeNull();
    expect(incomeEntryRow.template_id).toBeNull();
  });

  it('preserves nullable APR assumptions instead of rewriting them to zero', () => {
    const record = mapMonthRecord(
      createMonthRow(),
      createEntryRows(),
      createStatusHistoryRows(),
      createDebtAccountRows(),
      createRecurringTemplateRows(),
      createDebtPaymentEventRows(),
    );

    const month = mapPersistenceRecordToOperatingMonth(record);
    const nullableAprDebt = month.debtTracks.find((debtTrack) => debtTrack.id === 'debt-secondary');

    expect(nullableAprDebt).toBeDefined();

    if (nullableAprDebt === undefined) {
      throw new Error('Expected nullable APR debt track to exist.');
    }

    expect(nullableAprDebt.apr).toBe(0);
    expect(nullableAprDebt.aprAssumptionDecimal).toBeNull();

    const writePayload = mapOperatingMonthToWritePayload(OWNER_USER_ID, month);
    const nullableAprDebtRow = writePayload.debtAccountRows.find((debtRow) => debtRow.id === 'debt-secondary');

    expect(nullableAprDebtRow).toBeDefined();

    if (nullableAprDebtRow === undefined) {
      throw new Error('Expected nullable APR debt row to exist.');
    }

    expect(nullableAprDebtRow.apr_assumption_decimal).toBeNull();
    expect(nullableAprDebtRow.minimum_payment_usd).toBeNull();
  });
});
