export type CurrencyCode = 'COP';

export type PlanningScenarioId = 'baseline' | 'tightened' | 'accelerated';

export type PlanningHorizonMonths = 6 | 12 | 18 | 24;

export type MilestoneStage = 'done' | 'current' | 'next';

export type ContingencyArea = 'housing' | 'health' | 'mobility' | 'employment';

export type ContingencySeverity = 'high' | 'medium' | 'low';

export type PriorityActionWindow = '30d' | '90d';

export type LifePlanSectionKey = 'overview' | 'finances' | 'teaching' | 'contingencies' | 'actions';

export interface MonthlyCashFlow {
  netSalaryIncome: number;
  supplementalIncome: number;
  fixedCosts: number;
  variableCosts: number;
  debtBudget: number;
  currentEmergencyReserve: number;
  emergencyTarget: number;
}

export interface DebtItem {
  id: string;
  name: string;
  creditor: string;
  balance: number;
  apr: number;
  minPayment: number;
  priority: number;
  notes: string;
}

export interface TeachingMilestone {
  id: string;
  title: string;
  stage: MilestoneStage;
  dueLabel: string;
  action: string;
  description: string;
  order: number;
}

export interface ContingencyItem {
  id: string;
  area: ContingencyArea;
  severity: ContingencySeverity;
  title: string;
  trigger: string;
  action: string;
  owner: string;
}

export interface PriorityAction {
  id: string;
  title: string;
  window: PriorityActionWindow;
  owner: string;
  rationale: string;
  linkedDebtId?: string;
  linkedMilestoneId?: string;
}

export interface FinancialScenario {
  id: PlanningScenarioId;
  label: string;
  description: string;
  incomeDelta: number;
  fixedCostDelta: number;
  variableCostDelta: number;
  debtBudgetDelta: number;
  emergencyTargetDelta: number;
}

export interface LifePlanSnapshot {
  personName: string;
  handle: string;
  currencyCode: CurrencyCode;
  locationLabel: string;
  roleGoal: string;
  profileSummary: string;
  cashFlow: MonthlyCashFlow;
  debts: DebtItem[];
  milestones: TeachingMilestone[];
  contingencies: ContingencyItem[];
  priorityActions: PriorityAction[];
  scenarios: FinancialScenario[];
}

export interface ResolvedCashFlow {
  income: number;
  fixedCosts: number;
  variableCosts: number;
  debtBudget: number;
  currentEmergencyReserve: number;
  emergencyTarget: number;
}

export interface DebtPaymentAllocation {
  debtId: string;
  debtName: string;
  startingBalance: number;
  interestAccrued: number;
  minimumPaymentApplied: number;
  extraPaymentApplied: number;
  endingBalance: number;
  isCleared: boolean;
}

export interface DebtCascadeMonth {
  monthIndex: number;
  focusDebtId: string | null;
  focusDebtName: string | null;
  totalBudgetApplied: number;
  remainingBudget: number;
  clearedDebtIds: string[];
  allocations: DebtPaymentAllocation[];
}

export interface DebtCascadeSummary {
  assumptionLabel: string;
  isDebtFreeWithinHorizon: boolean;
  monthlyBudget: number;
  monthsSimulated: number;
  monthsToDebtFree: number | null;
  remainingDebtBalance: number;
  steps: DebtCascadeMonth[];
  totalDebt: number;
  totalMinimumPayment: number;
}

export interface FinancialProjection {
  debtCascade: DebtCascadeSummary;
  emergencyProgressRatio: number;
  monthlyGoalSurplus: number;
  monthlyNet: number;
  monthlyRunway: number;
  resolvedCashFlow: ResolvedCashFlow;
}

export interface TeachingPathSummary {
  completedMilestones: TeachingMilestone[];
  currentMilestone: TeachingMilestone | null;
  nextMilestone: TeachingMilestone | null;
  orderedMilestones: TeachingMilestone[];
}

export interface ContingencyPlanSummary {
  immediateActions: ContingencyItem[];
  orderedRisks: ContingencyItem[];
}
