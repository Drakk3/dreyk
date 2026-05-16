import type { LifePlanSnapshot } from '../types';
import type {
  OperatingCurrentWeekSummary,
  OperatingDebtListItem,
  OperatingMonth,
  OperatingOverviewModel,
  OperatingOverviewTotals,
  SafeExtraPaymentSummary,
} from '../types';
import { buildWeeklyCashFlowWorkspace } from './weeklyCashFlowWorkspace';

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildCurrentWeekSummary(month: OperatingMonth, selectedWeekId: string | null): OperatingCurrentWeekSummary {
  const workspace = buildWeeklyCashFlowWorkspace(month, selectedWeekId);
  const currentWeek = workspace.weeks.find((week) => week.weekStartDate === workspace.asOfWeekStartDate) ?? workspace.weeks[0];

  if (currentWeek === undefined) {
    return {
      debtPaymentUsd: 0,
      doneEntryCount: 0,
      endingBalanceUsd: 0,
      freeMarginUsd: 0,
      label: 'No current week',
      plannedEntryCount: 0,
      skippedEntryCount: 0,
      startingBalanceUsd: 0,
      totalInflowUsd: 0,
      totalOutflowUsd: 0,
      weekEndDate: '',
      weekId: '',
      weekStartDate: '',
    };
  }

  const debtPaymentUsd = roundCurrency(
    currentWeek.events
      .filter((event) => event.category === 'debtPayment' && event.status !== 'skipped')
      .reduce((sum, event) => sum + event.amount, 0),
  );

  return {
    debtPaymentUsd,
    doneEntryCount: currentWeek.events.filter((event) => event.status === 'done').length,
    endingBalanceUsd: currentWeek.endingBalance,
    freeMarginUsd: currentWeek.freeMargin,
    label: currentWeek.label,
    plannedEntryCount: currentWeek.events.filter((event) => event.status === 'planned').length,
    skippedEntryCount: currentWeek.events.filter((event) => event.status === 'skipped').length,
    startingBalanceUsd: currentWeek.startingBalance,
    totalInflowUsd: currentWeek.totalInflow,
    totalOutflowUsd: currentWeek.totalOutflow,
    weekEndDate: currentWeek.weekEndDate,
    weekId: currentWeek.id,
    weekStartDate: currentWeek.weekStartDate,
  };
}

function buildOperatingOverviewTotals(
  month: OperatingMonth,
  safeExtraPayment: SafeExtraPaymentSummary,
): OperatingOverviewTotals {
  const activeEntries = month.entries.filter((entry) => entry.status !== 'skipped');
  const totalIncomeUsd = roundCurrency(
    activeEntries.filter((entry) => entry.kind === 'income').reduce((sum, entry) => sum + entry.amountUsd, 0),
  );
  const totalOutflowUsd = roundCurrency(
    activeEntries.filter((entry) => entry.kind !== 'income').reduce((sum, entry) => sum + entry.amountUsd, 0),
  );
  const debtPaymentUsd = roundCurrency(
    activeEntries.filter((entry) => entry.kind === 'debt').reduce((sum, entry) => sum + entry.amountUsd, 0),
  );
  const nonDebtExpenseUsd = roundCurrency(
    activeEntries.filter((entry) => entry.kind === 'expense').reduce((sum, entry) => sum + entry.amountUsd, 0),
  );
  const coreDebtBalanceUsd = roundCurrency(
    month.debtTracks
      .filter((debtTrack) => !debtTrack.isExcludedFromPayoffLine)
      .reduce((sum, debtTrack) => sum + debtTrack.balanceUsd, 0),
  );
  const excludedDebtBalanceUsd = roundCurrency(
    month.debtTracks
      .filter((debtTrack) => debtTrack.isExcludedFromPayoffLine)
      .reduce((sum, debtTrack) => sum + debtTrack.balanceUsd, 0),
  );

  return {
    coreDebtBalanceUsd,
    currencyCode: 'USD',
    debtPaymentUsd,
    excludedDebtBalanceUsd,
    netUsd: roundCurrency(totalIncomeUsd - totalOutflowUsd),
    nonDebtExpenseUsd,
    safeExtraPaymentUsd: safeExtraPayment.amount,
    totalIncomeUsd,
    totalOutflowUsd,
  };
}

function buildDebtList(month: OperatingMonth): OperatingDebtListItem[] {
  return [...month.debtTracks]
    .sort((leftDebt, rightDebt) => {
      if (leftDebt.priority !== rightDebt.priority) {
        return leftDebt.priority - rightDebt.priority;
      }

      if (leftDebt.apr !== rightDebt.apr) {
        return rightDebt.apr - leftDebt.apr;
      }

      return leftDebt.balanceUsd - rightDebt.balanceUsd;
    })
    .map((debtTrack) => {
      const plannedPaymentUsd = roundCurrency(
        month.entries
          .filter((entry) => {
            return entry.debtId === debtTrack.id && entry.kind === 'debt' && entry.status !== 'skipped';
          })
          .reduce((sum, entry) => sum + entry.amountUsd, 0),
      );

      return {
        apr: debtTrack.apr,
        balanceUsd: debtTrack.balanceUsd,
        confidence: debtTrack.confidence,
        creditor: debtTrack.creditor,
        id: debtTrack.id,
        isExcludedFromPayoffLine: debtTrack.isExcludedFromPayoffLine,
        label: debtTrack.label,
        minimumPaymentUsd: debtTrack.minimumPaymentUsd ?? 0,
        payoffLineLabel: debtTrack.isExcludedFromPayoffLine ? 'Outside core payoff line' : 'Core payoff line',
        plannedPaymentUsd,
        priority: debtTrack.priority,
      } satisfies OperatingDebtListItem;
    });
}

function buildCopContext(snapshot: LifePlanSnapshot): OperatingOverviewModel['copContext'] {
  return {
    locationLabel: snapshot.locationLabel,
    operationalCurrencyLabel: 'Operating totals use USD only.',
    teacherSalaryContextLabel: 'COP stays as teacher-salary context for Colombia only.',
  };
}

export function buildOperatingOverviewModel(
  month: OperatingMonth,
  selectedWeekId: string | null,
  safeExtraPayment: SafeExtraPaymentSummary,
  snapshot: LifePlanSnapshot,
): OperatingOverviewModel {
  return {
    copContext: buildCopContext(snapshot),
    currentWeek: buildCurrentWeekSummary(month, selectedWeekId),
    debtList: buildDebtList(month),
    totals: buildOperatingOverviewTotals(month, safeExtraPayment),
  };
}
