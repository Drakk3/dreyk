import { createElement } from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type {
  OperatingDebtTimelineSummary,
  OperatingOverviewModel,
  PlanningHorizonMonths,
} from '../types';
import { FinancialProjectionCard } from './FinancialProjectionCard';

vi.mock('@/components/thegridcn/select', () => {
  function MockSelect({
    label,
    onChange,
    options,
    value,
  }: {
    label: string;
    onChange: (value: string) => void;
    options: Array<{ label: string; value: string }>;
    value: string;
  }): JSX.Element {
    return createElement(
      'label',
      undefined,
      createElement('span', undefined, label),
      createElement(
        'select',
        {
          'aria-label': label,
          onChange: (event: Event) => {
            const target = event.target;

            if (!(target instanceof HTMLSelectElement)) {
              throw new Error('Expected a select element target.');
            }

            onChange(target.value);
          },
          value,
        },
        ...options.map((option) => createElement('option', { key: option.value, value: option.value }, option.label)),
      ),
    );
  }

  return { Select: MockSelect };
});

function createOperatingOverview(): OperatingOverviewModel {
  return {
    copContext: {
      locationLabel: 'Bogotá, Colombia',
      operationalCurrencyLabel: 'USD is the operating default.',
      teacherSalaryContextLabel: 'COP stays only as teacher-salary context in Colombia.',
    },
    currentWeek: {
      debtPaymentUsd: 80,
      doneEntryCount: 1,
      endingBalanceUsd: 620,
      freeMarginUsd: 460,
      label: 'Week 2',
      plannedEntryCount: 2,
      skippedEntryCount: 0,
      startingBalanceUsd: 200,
      totalInflowUsd: 1000,
      totalOutflowUsd: 540,
      weekEndDate: '2026-05-18',
      weekId: 'week-current',
      weekStartDate: '2026-05-12',
    },
    dateContext: {
      freshnessLabel: 'Current month loaded',
      isCurrentMonthAvailable: true,
      overviewMonthId: 'month-2026-05',
      overviewMonthLabel: 'May 2026',
      overviewWeekId: 'week-current',
      overviewWeekLabel: 'Week of May 12',
      todayIsoDate: '2026-05-16',
    },
    debtCards: [
      {
        amountUsd: 2100,
        aprContextLabel: 'Promo purchases and cash advances still use different rates.',
        aprLabel: 'APR under review',
        description: 'Tracked in USD so weekly execution can keep the debt payoff line honest.',
        id: 'debt-us-bank',
        name: 'U.S. Bank · Visa Platinum',
        payoffLabel: 'Included in accelerated payoff guidance.',
        projectedPayoffLabel: 'Planned pay already loaded this month: $80.00',
        recurringPay: {
          amountUsd: 80,
          cadenceLabel: 'Monthly',
          label: 'Monthly recurring pay',
          scheduledDateLabel: 'Next May 18',
        },
      },
    ],
    payoffSummary: {
      budgetLabel: 'Recurring pay in plan: $380.00 / month',
      extraPaymentLabel: 'Safe extra pay available now: $250.00',
      progressLabel: 'Debt payoff line clears in about 4 months at the current pace.',
      remainingBalanceLabel: 'Debt still targeted for payoff: $2100.00',
      scopeLabel: 'Mazda stays visible as mobility context with $5400.00 kept outside accelerated payoff guidance.',
    },
    pendingWeekItems: [
      {
        amountUsd: 40,
        id: 'pending-groceries',
        label: 'Groceries',
        scheduledDateLabel: 'May 16',
      },
    ],
    protocoloColombia: {
      badgeLabel: 'Protocolo Colombia',
      description:
        'Run the plan in USD for debt execution, keep Colombia visible for the teaching path, and use the current real week to decide what gets done now.',
      title: 'English Teacher · Bogotá, Colombia',
    },
    totals: {
      coreDebtBalanceUsd: 2100,
      currencyCode: 'USD',
      debtPaymentUsd: 380,
      excludedDebtBalanceUsd: 5400,
      netUsd: 580,
      nonDebtExpenseUsd: 40,
      safeExtraPaymentUsd: 250,
      totalIncomeUsd: 1000,
      totalOutflowUsd: 420,
    },
  };
}

function createDebtTimeline(): OperatingDebtTimelineSummary {
  return {
    assumptionLabel:
      'Reactive USD payoff guidance uses planned debt payments plus safe extra cash, while Mazda stays visible as mobility context outside acceleration.',
    currencyCode: 'USD',
    isDebtFreeWithinHorizon: false,
    monthlyBaseDebtBudgetUsd: 380,
    monthsSimulated: 2,
    monthsToDebtFree: 4,
    payoffSummary: {
      budgetLabel: 'Recurring pay in plan: $380.00 / month',
      extraPaymentLabel: 'Safe extra pay available now: $250.00',
      progressLabel: 'Debt payoff line clears in about 4 months at the current pace.',
      remainingBalanceLabel: 'Debt still targeted for payoff: $2100.00',
      scopeLabel: 'Mazda stays visible as mobility context with $5400.00 kept outside accelerated payoff guidance.',
    },
    remainingCoreDebtBalanceUsd: 2100,
    remainingExcludedDebtBalanceUsd: 5400,
    safeExtraPaymentUsd: 250,
    steps: [
      {
        allocations: [],
        clearedDebtIds: [],
        focusDebtId: 'debt-us-bank',
        focusDebtName: 'U.S. Bank · Visa Platinum',
        monthIndex: 1,
        monthLabel: 'May 2026',
        remainingBudgetUsd: 0,
        totalBudgetAppliedUsd: 630,
      },
      {
        allocations: [],
        clearedDebtIds: [],
        focusDebtId: 'debt-us-bank',
        focusDebtName: 'U.S. Bank · Visa Platinum',
        monthIndex: 2,
        monthLabel: 'Jun 2026',
        remainingBudgetUsd: 0,
        totalBudgetAppliedUsd: 630,
      },
    ],
  };
}

describe('FinancialProjectionCard', () => {
  it('renders product-facing debt overview copy without internal table vocabulary', () => {
    const handleHorizonChange = vi.fn<(value: PlanningHorizonMonths) => void>();

    render(
      createElement(FinancialProjectionCard, {
        debtTimeline: createDebtTimeline(),
        handleHorizonChange,
        horizonOptions: [6, 12],
        operatingOverview: createOperatingOverview(),
        selectedHorizonMonths: 6,
      }),
    );

    expect(screen.getByText('Protocolo Colombia')).toBeInTheDocument();
    expect(screen.getByText('English Teacher · Bogotá, Colombia')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('U.S. Bank · Visa Platinum')).toBeInTheDocument();
    expect(screen.getByText('APR under review')).toBeInTheDocument();
    expect(screen.getByText(/Monthly recurring pay/i)).toBeInTheDocument();
    expect(screen.getByText('Included in accelerated payoff guidance.')).toBeInTheDocument();
    expect(screen.queryByText(/minimum payment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^core$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^status$/i)).not.toBeInTheDocument();
  });
});
