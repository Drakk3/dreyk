import { describe, expect, it } from 'vitest';

import type { OperatingMonth, SafeExtraPaymentSummary } from '../types';
import { buildOperatingDebtTimeline } from './operatingDebtTimeline';

function createSafeExtraPayment(amount: number): SafeExtraPaymentSummary {
  return {
    amount,
    basedOnWeekStartDate: '2026-05-12',
    blockingReasons: [],
    confidence: 'verified',
    currencyCode: 'USD',
    explanation: 'Test fixture',
    minimumFutureEndingBalance: amount,
  };
}

function createOperatingMonth(): OperatingMonth {
  return {
    currencyCode: 'USD',
    debtPaymentEvents: [],
    debtTracks: [
      {
        apr: 0.24,
        balanceUsd: 400,
        confidence: 'verified',
        creditor: 'Capital One',
        id: 'debt-core',
        isExcludedFromPayoffLine: false,
        label: 'Savor card',
        minimumPaymentUsd: 40,
        priority: 1,
        source: {
          aprConfidence: 'verified',
          balanceConfidence: 'verified',
          capturedOn: '2026-05-01',
          kind: 'statement',
          label: 'Capital One statement',
          minimumPaymentConfidence: 'verified',
        },
      },
      {
        apr: 0.08,
        balanceUsd: 1200,
        confidence: 'verified',
        creditor: 'Mazda',
        id: 'debt-mazda',
        isExcludedFromPayoffLine: true,
        label: 'CX-5 loan',
        minimumPaymentUsd: 120,
        priority: 2,
        source: {
          aprConfidence: 'verified',
          balanceConfidence: 'verified',
          capturedOn: '2026-05-01',
          kind: 'statement',
          label: 'Mazda statement',
          minimumPaymentConfidence: 'verified',
        },
      },
    ],
    entries: [
      {
        amountUsd: 40,
        category: 'debtPayment',
        confidence: 'verified',
        date: '2026-05-15',
        debtId: 'debt-core',
        id: 'entry-core-payment',
        kind: 'debt',
        label: 'Capital One payment',
        source: {
          capturedOn: '2026-05-15',
          kind: 'manual',
          label: 'Manual plan',
        },
        sourceKind: 'manual',
        status: 'planned',
        weekId: 'week-2',
      },
      {
        amountUsd: 120,
        category: 'debtPayment',
        confidence: 'verified',
        date: '2026-05-16',
        debtId: 'debt-mazda',
        id: 'entry-mazda-payment',
        kind: 'debt',
        label: 'Mazda payment',
        source: {
          capturedOn: '2026-05-16',
          kind: 'manual',
          label: 'Manual plan',
        },
        sourceKind: 'manual',
        status: 'planned',
        weekId: 'week-2',
      },
    ],
    id: 'month-2026-05',
    month: '2026-05',
    recurringQueue: [],
    recurringTemplates: [],
    statusHistory: [],
    weeks: [
      {
        entryIds: ['entry-core-payment', 'entry-mazda-payment'],
        endDate: '2026-05-18',
        id: 'week-2',
        index: 2,
        label: 'Week 2',
        monthId: 'month-2026-05',
        startDate: '2026-05-12',
      },
    ],
  };
}

describe('buildOperatingDebtTimeline', () => {
  it('keeps Mazda outside accelerated payoff guidance while still tracking its balance', () => {
    const summary = buildOperatingDebtTimeline(createOperatingMonth(), createSafeExtraPayment(200), 1);
    const firstStep = summary.steps[0];

    expect(firstStep).toBeDefined();

    if (firstStep === undefined) {
      throw new Error('Expected the first timeline step to exist.');
    }

    const mazdaAllocation = firstStep.allocations.find((allocation) => allocation.debtId === 'debt-mazda');
    const coreAllocation = firstStep.allocations.find((allocation) => allocation.debtId === 'debt-core');

    expect(firstStep.focusDebtId).toBe('debt-core');
    expect(coreAllocation?.extraPaymentAppliedUsd).toBeGreaterThan(0);
    expect(mazdaAllocation?.scheduledPaymentAppliedUsd).toBe(120);
    expect(mazdaAllocation?.extraPaymentAppliedUsd).toBe(0);
    expect(mazdaAllocation?.isExcludedFromPayoffLine).toBe(true);
    expect(summary.remainingExcludedDebtBalanceUsd).toBeLessThan(1200);
    expect(summary.payoffSummary.scopeLabel).toContain('Mazda stays visible as mobility context');
  });
});
