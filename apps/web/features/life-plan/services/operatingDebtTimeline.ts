import type {
  OperatingDebtTimelineAllocation,
  OperatingDebtTimelineMonth,
  OperatingDebtTimelineSummary,
  OperatingMonth,
  SafeExtraPaymentSummary,
} from '../types';

interface OperatingDebtState {
  apr: number;
  balanceUsd: number;
  id: string;
  isExcludedFromPayoffLine: boolean;
  label: string;
  minimumPaymentUsd: number;
  plannedPaymentUsd: number;
  priority: number;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function sortDebtStates(states: OperatingDebtState[]): OperatingDebtState[] {
  return [...states].sort((leftDebt, rightDebt) => {
    if (leftDebt.isExcludedFromPayoffLine !== rightDebt.isExcludedFromPayoffLine) {
      return Number(leftDebt.isExcludedFromPayoffLine) - Number(rightDebt.isExcludedFromPayoffLine);
    }

    if (leftDebt.priority !== rightDebt.priority) {
      return leftDebt.priority - rightDebt.priority;
    }

    if (leftDebt.apr !== rightDebt.apr) {
      return rightDebt.apr - leftDebt.apr;
    }

    return leftDebt.balanceUsd - rightDebt.balanceUsd;
  });
}

function buildMonthlyPaymentMap(month: OperatingMonth): Map<string, number> {
  const paymentMap = new Map<string, number>();

  month.entries.forEach((entry) => {
    if (entry.kind !== 'debt' || entry.status === 'skipped' || entry.debtId === undefined) {
      return;
    }

    const currentAmount = paymentMap.get(entry.debtId) ?? 0;
    paymentMap.set(entry.debtId, roundCurrency(currentAmount + entry.amountUsd));
  });

  return paymentMap;
}

function buildDebtStates(month: OperatingMonth): OperatingDebtState[] {
  const monthlyPaymentMap = buildMonthlyPaymentMap(month);

  return sortDebtStates(
    month.debtTracks.map((debtTrack) => ({
      apr: debtTrack.apr,
      balanceUsd: debtTrack.balanceUsd,
      id: debtTrack.id,
      isExcludedFromPayoffLine: debtTrack.isExcludedFromPayoffLine,
      label: `${debtTrack.creditor} · ${debtTrack.label}`,
      minimumPaymentUsd: debtTrack.minimumPaymentUsd ?? 0,
      plannedPaymentUsd: monthlyPaymentMap.get(debtTrack.id) ?? 0,
      priority: debtTrack.priority,
    })),
  );
}

function getMonthlyInterestRate(apr: number): number {
  return apr <= 0 ? 0 : apr / 12;
}

function getFocusDebt(states: OperatingDebtState[]): OperatingDebtState | null {
  return states.find((state) => !state.isExcludedFromPayoffLine && state.balanceUsd > 0) ?? null;
}

function buildMonthLabel(month: string, monthOffset: number): string {
  const [yearToken, monthToken] = month.split('-');
  const year = Number(yearToken);
  const numericMonth = Number(monthToken);

  if (!Number.isFinite(year) || !Number.isFinite(numericMonth)) {
    return `Month ${monthOffset + 1}`;
  }

  const date = new Date(Date.UTC(year, numericMonth - 1 + monthOffset, 1));

  return new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC', year: 'numeric' }).format(date);
}

function cloneDebtTrack(state: OperatingDebtState): OperatingDebtState {
  return {
    apr: state.apr,
    balanceUsd: state.balanceUsd,
    id: state.id,
    isExcludedFromPayoffLine: state.isExcludedFromPayoffLine,
    label: state.label,
    minimumPaymentUsd: state.minimumPaymentUsd,
    plannedPaymentUsd: state.plannedPaymentUsd,
    priority: state.priority,
  };
}

function buildAllocation(
  state: OperatingDebtState,
  remainingBudgetUsd: number,
): { allocation: OperatingDebtTimelineAllocation; remainingBudgetUsd: number } {
  const startingBalanceUsd = roundCurrency(state.balanceUsd);

  if (state.balanceUsd <= 0) {
    return {
      allocation: {
        debtId: state.id,
        debtName: state.label,
        endingBalanceUsd: 0,
        extraPaymentAppliedUsd: 0,
        interestAccruedUsd: 0,
        isCleared: true,
        isExcludedFromPayoffLine: state.isExcludedFromPayoffLine,
        scheduledPaymentAppliedUsd: 0,
        startingBalanceUsd,
      },
      remainingBudgetUsd,
    };
  }

  const interestAccruedUsd = roundCurrency(state.balanceUsd * getMonthlyInterestRate(state.apr));
  state.balanceUsd = roundCurrency(state.balanceUsd + interestAccruedUsd);
  const scheduledPaymentTargetUsd = Math.max(state.plannedPaymentUsd, state.minimumPaymentUsd);
  const scheduledPaymentAppliedUsd = roundCurrency(
    Math.min(remainingBudgetUsd, scheduledPaymentTargetUsd, state.balanceUsd),
  );
  state.balanceUsd = roundCurrency(state.balanceUsd - scheduledPaymentAppliedUsd);

  return {
    allocation: {
      debtId: state.id,
      debtName: state.label,
      endingBalanceUsd: roundCurrency(state.balanceUsd),
      extraPaymentAppliedUsd: 0,
      interestAccruedUsd,
      isCleared: state.balanceUsd <= 0,
      isExcludedFromPayoffLine: state.isExcludedFromPayoffLine,
      scheduledPaymentAppliedUsd,
      startingBalanceUsd,
    },
    remainingBudgetUsd: roundCurrency(remainingBudgetUsd - scheduledPaymentAppliedUsd),
  };
}

function applyExtraPayment(
  states: OperatingDebtState[],
  allocations: OperatingDebtTimelineAllocation[],
  remainingBudgetUsd: number,
): number {
  if (remainingBudgetUsd <= 0) {
    return remainingBudgetUsd;
  }

  const focusDebt = getFocusDebt(states);

  if (focusDebt === null) {
    return remainingBudgetUsd;
  }

  const extraPaymentAppliedUsd = roundCurrency(Math.min(remainingBudgetUsd, focusDebt.balanceUsd));
  focusDebt.balanceUsd = roundCurrency(focusDebt.balanceUsd - extraPaymentAppliedUsd);

  const focusAllocation = allocations.find((allocation) => allocation.debtId === focusDebt.id);

  if (focusAllocation !== undefined) {
    focusAllocation.extraPaymentAppliedUsd = extraPaymentAppliedUsd;
    focusAllocation.endingBalanceUsd = roundCurrency(focusDebt.balanceUsd);
    focusAllocation.isCleared = focusDebt.balanceUsd <= 0;
  }

  return roundCurrency(remainingBudgetUsd - extraPaymentAppliedUsd);
}

function buildTimelineMonth(
  month: string,
  monthIndex: number,
  states: OperatingDebtState[],
  extraPaymentUsd: number,
): OperatingDebtTimelineMonth {
  const focusDebt = getFocusDebt(states);
  let remainingBudgetUsd = roundCurrency(states.reduce((sum, state) => {
    return sum + Math.max(state.plannedPaymentUsd, state.minimumPaymentUsd);
  }, extraPaymentUsd));
  const allocations = states.map((state) => {
    const result = buildAllocation(state, remainingBudgetUsd);
    remainingBudgetUsd = result.remainingBudgetUsd;

    return result.allocation;
  });

  remainingBudgetUsd = applyExtraPayment(states, allocations, remainingBudgetUsd);
  const clearedDebtIds = allocations.filter((allocation) => allocation.isCleared).map((allocation) => allocation.debtId);

  return {
    allocations,
    clearedDebtIds,
    focusDebtId: focusDebt?.id ?? null,
    focusDebtName: focusDebt?.label ?? null,
    monthIndex,
    monthLabel: buildMonthLabel(month, monthIndex - 1),
    remainingBudgetUsd,
    totalBudgetAppliedUsd: roundCurrency(extraPaymentUsd + states.reduce((sum, state) => {
      return sum + Math.max(state.plannedPaymentUsd, state.minimumPaymentUsd);
    }, 0) - remainingBudgetUsd),
  };
}

function getRemainingCoreDebtBalanceUsd(states: OperatingDebtState[]): number {
  return roundCurrency(states.filter((state) => !state.isExcludedFromPayoffLine).reduce((sum, state) => sum + Math.max(state.balanceUsd, 0), 0));
}

function getRemainingExcludedDebtBalanceUsd(states: OperatingDebtState[]): number {
  return roundCurrency(states.filter((state) => state.isExcludedFromPayoffLine).reduce((sum, state) => sum + Math.max(state.balanceUsd, 0), 0));
}

export function buildOperatingDebtTimeline(
  month: OperatingMonth,
  safeExtraPayment: SafeExtraPaymentSummary,
  horizonMonths: number,
): OperatingDebtTimelineSummary {
  const states = buildDebtStates(month).map(cloneDebtTrack);
  const steps: OperatingDebtTimelineMonth[] = [];
  let monthsToDebtFree: number | null = null;

  for (let monthIndex = 1; monthIndex <= horizonMonths; monthIndex += 1) {
    if (getRemainingCoreDebtBalanceUsd(states) <= 0) {
      monthsToDebtFree = monthIndex - 1;
      break;
    }

    const step = buildTimelineMonth(month.month, monthIndex, states, safeExtraPayment.amount);
    steps.push(step);

    if (getRemainingCoreDebtBalanceUsd(states) <= 0) {
      monthsToDebtFree = monthIndex;
      break;
    }
  }

  return {
    assumptionLabel:
      'Reactive USD payoff line uses planned debt payments plus safe extra cash, while Mazda stays visible but outside the core extra-payment target.',
    currencyCode: 'USD',
    isDebtFreeWithinHorizon: getRemainingCoreDebtBalanceUsd(states) <= 0,
    monthlyBaseDebtBudgetUsd: roundCurrency(
      buildDebtStates(month).reduce((sum, state) => sum + Math.max(state.plannedPaymentUsd, state.minimumPaymentUsd), 0),
    ),
    monthsSimulated: steps.length,
    monthsToDebtFree,
    remainingCoreDebtBalanceUsd: getRemainingCoreDebtBalanceUsd(states),
    remainingExcludedDebtBalanceUsd: getRemainingExcludedDebtBalanceUsd(states),
    safeExtraPaymentUsd: safeExtraPayment.amount,
    steps,
  };
}
