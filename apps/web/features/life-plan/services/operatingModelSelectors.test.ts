import { describe, expect, it } from 'vitest';

import type {
  LifePlanSnapshot,
  OperatingMonth,
  OperatingOverviewDateContext,
  OperatingPayoffSummary,
} from '../types';
import { buildOperatingOverviewModel } from './operatingModelSelectors';
import { buildWeeklyCashFlowWorkspace } from './weeklyCashFlowWorkspace';

function createSnapshot(): LifePlanSnapshot {
  return {
    cashFlow: {
      currentEmergencyReserve: 0,
      debtBudget: 0,
      emergencyTarget: 0,
      fixedCosts: 0,
      netSalaryIncome: 0,
      supplementalIncome: 0,
      variableCosts: 0,
    },
    contingencies: [],
    currencyCode: 'USD',
    debts: [],
    handle: '@dreyk',
    locationLabel: 'Bogotá, Colombia',
    milestones: [],
    personName: 'Dreyk',
    priorityActions: [],
    profileSummary: 'Test profile',
    roleGoal: 'English Teacher',
    scenarios: [],
  };
}

function createDateContext(): OperatingOverviewDateContext {
  return {
    freshnessLabel: 'Current month loaded',
    isCurrentMonthAvailable: true,
    overviewMonthId: 'month-2026-05',
    overviewMonthLabel: 'May 2026',
    overviewWeekId: 'week-current',
    overviewWeekLabel: 'Week of May 12',
    todayIsoDate: '2026-05-16',
  };
}

function createPayoffSummary(): OperatingPayoffSummary {
  return {
    budgetLabel: 'Recurring pay in plan: $380.00 / month',
    extraPaymentLabel: 'Safe extra pay available now: $250.00',
    progressLabel: 'Debt payoff line clears in about 4 months at the current pace.',
    remainingBalanceLabel: 'Debt still targeted for payoff: $2100.00',
    scopeLabel: 'Mazda stays visible as mobility context with $5400.00 kept outside accelerated payoff guidance.',
  };
}

function createOperatingMonth(): OperatingMonth {
  return {
    currencyCode: 'USD',
    debtPaymentEvents: [],
    debtTracks: [
      {
        apr: 0,
        balanceUsd: 2100,
        confidence: 'verified',
        creditor: 'U.S. Bank',
        id: 'debt-us-bank',
        isExcludedFromPayoffLine: false,
        label: 'Visa Platinum',
        minimumPaymentUsd: 80,
        notes: 'Promo purchases and cash advances still use different rates.',
        priority: 1,
        source: {
          aprConfidence: 'verified',
          balanceConfidence: 'verified',
          capturedOn: '2026-05-01',
          kind: 'statement',
          label: 'U.S. Bank statement',
          minimumPaymentConfidence: 'verified',
        },
      },
      {
        apr: 0.07,
        balanceUsd: 5400,
        confidence: 'verified',
        creditor: 'Mazda',
        id: 'debt-mazda',
        isExcludedFromPayoffLine: true,
        label: 'Mazda 3',
        minimumPaymentUsd: 300,
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
        amountUsd: 1000,
        category: 'income',
        confidence: 'verified',
        date: '2026-05-13',
        id: 'entry-income',
        kind: 'income',
        label: 'Teaching paycheck',
        source: {
          capturedOn: '2026-05-13',
          kind: 'payStub',
          label: 'Paystub',
        },
        sourceKind: 'manual',
        status: 'done',
        weekId: 'week-current',
      },
      {
        amountUsd: 80,
        category: 'debtPayment',
        confidence: 'verified',
        date: '2026-05-14',
        debtId: 'debt-us-bank',
        id: 'entry-us-bank-payment',
        kind: 'debt',
        label: 'U.S. Bank payment',
        source: {
          capturedOn: '2026-05-14',
          kind: 'manual',
          label: 'Manual plan',
        },
        sourceKind: 'manual',
        status: 'done',
        weekId: 'week-current',
      },
      {
        amountUsd: 40,
        category: 'food',
        confidence: 'verified',
        date: '2026-05-16',
        id: 'entry-groceries',
        kind: 'expense',
        label: 'Groceries',
        source: {
          capturedOn: '2026-05-16',
          kind: 'manual',
          label: 'Manual capture',
        },
        sourceKind: 'manual',
        status: 'planned',
        weekId: 'week-current',
      },
      {
        amountUsd: 300,
        category: 'debtPayment',
        confidence: 'verified',
        date: '2026-05-17',
        debtId: 'debt-mazda',
        id: 'entry-mazda-payment',
        kind: 'debt',
        label: 'Mazda payment',
        source: {
          capturedOn: '2026-05-17',
          kind: 'manual',
          label: 'Manual plan',
        },
        sourceKind: 'manual',
        status: 'planned',
        weekId: 'week-current',
      },
      {
        amountUsd: 120,
        category: 'debtPayment',
        confidence: 'verified',
        date: '2026-05-20',
        debtId: 'debt-us-bank',
        id: 'entry-later-payment',
        kind: 'debt',
        label: 'Later payment',
        source: {
          capturedOn: '2026-05-20',
          kind: 'manual',
          label: 'Manual plan',
        },
        sourceKind: 'manual',
        status: 'planned',
        weekId: 'week-later',
      },
    ],
    id: 'month-2026-05',
    month: '2026-05',
    recurringQueue: [
      {
        amountUsd: 80,
        cadence: 'monthly',
        category: 'debtPayment',
        confidence: 'verified',
        debtId: 'debt-us-bank',
        id: 'queue-us-bank',
        label: 'U.S. Bank recurring pay',
        scheduledDate: '2026-05-18',
        source: {
          capturedOn: '2026-05-10',
          kind: 'manual',
          label: 'Recurring plan',
        },
        sourceKind: 'generated',
        status: 'pending',
        templateId: 'template-us-bank',
        weekId: 'week-current',
      },
    ],
    recurringTemplates: [],
    statusHistory: [],
    weeks: [
      {
        entryIds: ['entry-income', 'entry-us-bank-payment', 'entry-groceries', 'entry-mazda-payment'],
        endDate: '2026-05-18',
        id: 'week-current',
        index: 2,
        label: 'Week 2',
        monthId: 'month-2026-05',
        startDate: '2026-05-12',
      },
      {
        entryIds: ['entry-later-payment'],
        endDate: '2026-05-25',
        id: 'week-later',
        index: 3,
        label: 'Week 3',
        monthId: 'month-2026-05',
        startDate: '2026-05-19',
      },
    ],
  };
}

describe('buildOperatingOverviewModel', () => {
  it('keeps current-week execution visible and preserves U.S. Bank APR nuance in debt cards', () => {
    const month = createOperatingMonth();
    const workspace = buildWeeklyCashFlowWorkspace(month, { asOfWeekId: 'week-current' });

    const model = buildOperatingOverviewModel(
      month,
      workspace,
      createDateContext(),
      createSnapshot(),
      createPayoffSummary(),
    );

    expect(model.currentWeek.doneEntryCount).toBe(2);
    expect(model.currentWeek.plannedEntryCount).toBe(2);
    expect(model.currentWeek.debtPaymentUsd).toBe(380);
    expect(model.pendingWeekItems.map((item) => item.label)).toEqual(['Groceries', 'Mazda payment']);
    expect(model.protocoloColombia.badgeLabel).toBe('Protocolo Colombia');

    const usBankCard = model.debtCards.find((card) => card.id === 'debt-us-bank');

    expect(usBankCard).toBeDefined();

    if (usBankCard === undefined) {
      throw new Error('Expected U.S. Bank debt card to exist.');
    }

    expect(usBankCard.aprLabel).toBe('APR under review');
    expect(usBankCard.aprContextLabel).toContain('different rates');
    expect(usBankCard.recurringPay.label).toBe('Monthly recurring pay');
    expect(usBankCard.recurringPay.scheduledDateLabel).toContain('Next May 18');
  });
});
