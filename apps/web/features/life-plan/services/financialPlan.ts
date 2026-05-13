import type {
  DebtCascadeMonth,
  DebtCascadeSummary,
  DebtItem,
  FinancialProjection,
  FinancialScenario,
  LifePlanSnapshot,
  PlanningHorizonMonths,
  ResolvedCashFlow,
} from '../types';

interface DebtState {
  balance: number;
  creditor: string;
  id: string;
  minPayment: number;
  name: string;
  notes: string;
  priority: number;
  rate: number;
}

function roundCurrency(value: number): number {
  return Math.round(value);
}

function clampRatio(value: number): number {
  if (value <= 0) {
    return 0;
  }

  if (value >= 1) {
    return 1;
  }

  return value;
}

function sortDebtsForCascade(debts: DebtItem[]): DebtItem[] {
  return [...debts].sort((leftDebt, rightDebt) => {
    if (leftDebt.priority !== rightDebt.priority) {
      return leftDebt.priority - rightDebt.priority;
    }

    if (leftDebt.apr !== rightDebt.apr) {
      return rightDebt.apr - leftDebt.apr;
    }

    return leftDebt.balance - rightDebt.balance;
  });
}

function getFocusDebt(debts: DebtState[]): DebtState | null {
  return debts.find((debt) => debt.balance > 0) ?? null;
}

function createDebtStates(debts: DebtItem[]): DebtState[] {
  return sortDebtsForCascade(debts).map((debt) => ({
    balance: debt.balance,
    creditor: debt.creditor,
    id: debt.id,
    minPayment: debt.minPayment,
    name: debt.name,
    notes: debt.notes,
    priority: debt.priority,
    rate: debt.apr,
  }));
}

export function resolveCashFlow(
  cashFlow: LifePlanSnapshot['cashFlow'],
  scenario: FinancialScenario,
): ResolvedCashFlow {
  return {
    income: roundCurrency(cashFlow.netSalaryIncome + cashFlow.supplementalIncome + scenario.incomeDelta),
    fixedCosts: roundCurrency(cashFlow.fixedCosts + scenario.fixedCostDelta),
    variableCosts: roundCurrency(cashFlow.variableCosts + scenario.variableCostDelta),
    debtBudget: roundCurrency(cashFlow.debtBudget + scenario.debtBudgetDelta),
    currentEmergencyReserve: roundCurrency(cashFlow.currentEmergencyReserve),
    emergencyTarget: roundCurrency(cashFlow.emergencyTarget + scenario.emergencyTargetDelta),
  };
}

export function calculateMonthlyNet(resolvedCashFlow: ResolvedCashFlow): number {
  return roundCurrency(
    resolvedCashFlow.income - resolvedCashFlow.fixedCosts - resolvedCashFlow.variableCosts,
  );
}

export function calculateMonthlyGoalSurplus(
  resolvedCashFlow: ResolvedCashFlow,
  monthlyNet: number,
): number {
  return roundCurrency(monthlyNet - resolvedCashFlow.debtBudget);
}

export function calculateEmergencyProgressRatio(resolvedCashFlow: ResolvedCashFlow): number {
  if (resolvedCashFlow.emergencyTarget <= 0) {
    return 1;
  }

  return clampRatio(resolvedCashFlow.currentEmergencyReserve / resolvedCashFlow.emergencyTarget);
}

export function calculateMonthlyRunway(resolvedCashFlow: ResolvedCashFlow): number {
  const essentialCosts = resolvedCashFlow.fixedCosts + resolvedCashFlow.variableCosts;

  if (essentialCosts <= 0) {
    return 0;
  }

  return Number((resolvedCashFlow.currentEmergencyReserve / essentialCosts).toFixed(1));
}

export function buildDebtCascade(
  debts: DebtItem[],
  monthlyBudget: number,
  horizonMonths: PlanningHorizonMonths,
): DebtCascadeSummary {
  const debtStates = createDebtStates(debts);
  const totalDebt = roundCurrency(debtStates.reduce((sum, debt) => sum + debt.balance, 0));
  const totalMinimumPayment = roundCurrency(debtStates.reduce((sum, debt) => sum + debt.minPayment, 0));
  const steps: DebtCascadeMonth[] = [];
  let monthsToDebtFree: number | null = null;

  for (let monthIndex = 1; monthIndex <= horizonMonths; monthIndex += 1) {
    const activeDebt = getFocusDebt(debtStates);

    if (activeDebt === null) {
      monthsToDebtFree = monthIndex - 1;
      break;
    }

    let remainingBudget = monthlyBudget;
    const clearedDebtIds: string[] = [];
    const allocations = debtStates.map((debt) => {
      const startingBalance = roundCurrency(debt.balance);

      if (debt.balance <= 0) {
        return {
          debtId: debt.id,
          debtName: debt.name,
          startingBalance,
          interestAccrued: 0,
          minimumPaymentApplied: 0,
          extraPaymentApplied: 0,
          endingBalance: 0,
          isCleared: true,
        };
      }

      const interestAccrued = roundCurrency(debt.balance * debt.rate);
      debt.balance = roundCurrency(debt.balance + interestAccrued);

      const minimumPaymentApplied = Math.min(remainingBudget, debt.minPayment, debt.balance);
      debt.balance = roundCurrency(debt.balance - minimumPaymentApplied);
      remainingBudget = roundCurrency(remainingBudget - minimumPaymentApplied);

      return {
        debtId: debt.id,
        debtName: debt.name,
        startingBalance,
        interestAccrued,
        minimumPaymentApplied,
        extraPaymentApplied: 0,
        endingBalance: roundCurrency(debt.balance),
        isCleared: debt.balance <= 0,
      };
    });

    const targetIndex = debtStates.findIndex((debt) => debt.balance > 0);

    if (targetIndex >= 0 && remainingBudget > 0) {
      const targetDebt = debtStates[targetIndex];

      if (targetDebt !== undefined) {
        const extraPaymentApplied = Math.min(remainingBudget, targetDebt.balance);
        targetDebt.balance = roundCurrency(targetDebt.balance - extraPaymentApplied);
        remainingBudget = roundCurrency(remainingBudget - extraPaymentApplied);

        const targetAllocation = allocations[targetIndex];

        if (targetAllocation !== undefined) {
          targetAllocation.extraPaymentApplied = extraPaymentApplied;
          targetAllocation.endingBalance = roundCurrency(targetDebt.balance);
          targetAllocation.isCleared = targetDebt.balance <= 0;
        }
      }
    }

    allocations.forEach((allocation) => {
      if (allocation.isCleared) {
        clearedDebtIds.push(allocation.debtId);
      }
    });

    steps.push({
      monthIndex,
      focusDebtId: activeDebt.id,
      focusDebtName: activeDebt.name,
      totalBudgetApplied: roundCurrency(monthlyBudget - remainingBudget),
      remainingBudget,
      clearedDebtIds,
      allocations,
    });

    if (debtStates.every((debt) => debt.balance <= 0)) {
      monthsToDebtFree = monthIndex;
      break;
    }
  }

  const remainingDebtBalance = roundCurrency(
    debtStates.reduce((sum, debt) => sum + Math.max(debt.balance, 0), 0),
  );

  return {
    assumptionLabel:
      'Cascada mensual con presupuesto fijo: cubrir mínimos primero y dirigir el excedente a la deuda prioritaria según prioridad y APR.',
    isDebtFreeWithinHorizon: remainingDebtBalance === 0,
    monthlyBudget: roundCurrency(monthlyBudget),
    monthsSimulated: steps.length,
    monthsToDebtFree,
    remainingDebtBalance,
    steps,
    totalDebt,
    totalMinimumPayment,
  };
}

export function buildFinancialProjection(
  snapshot: LifePlanSnapshot,
  scenario: FinancialScenario,
  horizonMonths: PlanningHorizonMonths,
): FinancialProjection {
  const resolvedCashFlow = resolveCashFlow(snapshot.cashFlow, scenario);
  const monthlyNet = calculateMonthlyNet(resolvedCashFlow);
  const monthlyGoalSurplus = calculateMonthlyGoalSurplus(resolvedCashFlow, monthlyNet);

  return {
    debtCascade: buildDebtCascade(snapshot.debts, resolvedCashFlow.debtBudget, horizonMonths),
    emergencyProgressRatio: calculateEmergencyProgressRatio(resolvedCashFlow),
    monthlyGoalSurplus,
    monthlyNet,
    monthlyRunway: calculateMonthlyRunway(resolvedCashFlow),
    resolvedCashFlow,
  };
}
