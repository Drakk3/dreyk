export type CurrencyCode = 'COP' | 'USD';

export type FinancialDataConfidence = 'verified' | 'estimated' | 'needsReview';

export type CashFlowEventDirection = 'inflow' | 'outflow';

export type CashFlowEventCategory =
  | 'debtPayment'
  | 'familySupport'
  | 'foodAndFuel'
  | 'housing'
  | 'income'
  | 'insurance'
  | 'subscription'
  | 'tuition'
  | 'utility'
  | 'other';

export type RecurrenceCadence = 'weekly' | 'biweekly' | 'monthly' | 'oneTime';

export type FinancialSourceKind = 'spreadsheet' | 'statement' | 'payStub' | 'loanDisclosure' | 'manual';

export type PlanningScenarioId = 'baseline' | 'tightened' | 'accelerated';

export type PlanningHorizonMonths = 6 | 12 | 18 | 24;

export type MilestoneStage = 'done' | 'current' | 'next';

export type ContingencyArea = 'housing' | 'health' | 'mobility' | 'employment';

export type ContingencySeverity = 'high' | 'medium' | 'low';

export type PriorityActionWindow = '30d' | '90d';

export type LifePlanSectionKey = 'overview' | 'cash-flow' | 'teaching' | 'actions';

export type OperatingEntryKind = 'income' | 'expense' | 'debt';

export type OperatingEntryStatus = 'planned' | 'done' | 'skipped';

export type OperatingEntrySourceKind = 'seed' | 'generated' | 'manual';

export type OperatingRecurringQueueStatus = 'pending' | 'incorporated';

export interface FinancialSourceMetadata {
  label: string;
  kind: FinancialSourceKind;
  capturedOn: string;
  notes?: string;
}

export interface CashFlowEvent {
  id: string;
  date: string;
  label: string;
  direction: CashFlowEventDirection;
  category: CashFlowEventCategory;
  amount: number;
  currencyCode: CurrencyCode;
  confidence: FinancialDataConfidence;
  source: FinancialSourceMetadata;
  notes?: string;
}

export interface RecurringObligation {
  id: string;
  label: string;
  category: CashFlowEventCategory;
  cadence: RecurrenceCadence;
  expectedAmount: number;
  currencyCode: CurrencyCode;
  confidence: FinancialDataConfidence;
  source: FinancialSourceMetadata;
  nextDueDate?: string;
  notes?: string;
}

export interface WeeklyCashFlowCheckpoint {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  startingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  endingBalance: number;
  freeMargin: number;
  eventIds: string[];
}

export interface OperatingWeek {
  entryIds: string[];
  endDate: string;
  id: string;
  index: number;
  label: string;
  monthId: string;
  startDate: string;
}

export interface EntryStatusHistory {
  changedAt: string;
  entryId: string;
  from: OperatingEntryStatus;
  id: string;
  reason?: string;
  to: OperatingEntryStatus;
}

export interface OperatingEntry {
  amountUsd: number;
  category: CashFlowEventCategory;
  confidence: FinancialDataConfidence;
  date: string;
  debtId?: string;
  id: string;
  kind: OperatingEntryKind;
  label: string;
  notes?: string;
  source: FinancialSourceMetadata;
  sourceKind: OperatingEntrySourceKind;
  status: OperatingEntryStatus;
  weekId: string;
}

export interface OperatingRecurringTemplate {
  amountUsd: number;
  cadence: RecurrenceCadence;
  category: CashFlowEventCategory;
  confidence: FinancialDataConfidence;
  debtId?: string;
  id: string;
  label: string;
  notes?: string;
  scheduledDay: number;
  source: FinancialSourceMetadata;
}

export interface OperatingRecurringQueueItem {
  amountUsd: number;
  cadence: RecurrenceCadence;
  category: CashFlowEventCategory;
  confidence: FinancialDataConfidence;
  debtId?: string;
  entryId?: string;
  id: string;
  label: string;
  notes?: string;
  scheduledDate: string;
  source: FinancialSourceMetadata;
  sourceKind: OperatingEntrySourceKind;
  status: OperatingRecurringQueueStatus;
  templateId: string;
  weekId: string;
}

export interface DebtTrack {
  apr: number;
  balanceUsd: number;
  confidence: FinancialDataConfidence;
  creditor: string;
  id: string;
  isExcludedFromPayoffLine: boolean;
  label: string;
  minimumPaymentUsd?: number;
  notes?: string;
  priority: number;
  source: DebtSourceMetadata;
}

export interface OperatingMonth {
  currencyCode: 'USD';
  debtTracks: DebtTrack[];
  entries: OperatingEntry[];
  id: string;
  month: string;
  recurringQueue: OperatingRecurringQueueItem[];
  recurringTemplates: OperatingRecurringTemplate[];
  statusHistory: EntryStatusHistory[];
  weeks: OperatingWeek[];
}

export interface DebtSourceMetadata extends FinancialSourceMetadata {
  balanceConfidence: FinancialDataConfidence;
  aprConfidence: FinancialDataConfidence;
  minimumPaymentConfidence: FinancialDataConfidence;
}

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
  source?: DebtSourceMetadata;
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

export interface OperatingCurrentWeekSummary {
  debtPaymentUsd: number;
  doneEntryCount: number;
  endingBalanceUsd: number;
  freeMarginUsd: number;
  label: string;
  plannedEntryCount: number;
  skippedEntryCount: number;
  startingBalanceUsd: number;
  totalInflowUsd: number;
  totalOutflowUsd: number;
  weekEndDate: string;
  weekId: string;
  weekStartDate: string;
}

export interface OperatingOverviewTotals {
  coreDebtBalanceUsd: number;
  currencyCode: 'USD';
  debtPaymentUsd: number;
  excludedDebtBalanceUsd: number;
  netUsd: number;
  nonDebtExpenseUsd: number;
  safeExtraPaymentUsd: number;
  totalIncomeUsd: number;
  totalOutflowUsd: number;
}

export interface OperatingCopContextLabels {
  locationLabel: string;
  operationalCurrencyLabel: string;
  teacherSalaryContextLabel: string;
}

export interface OperatingDebtListItem {
  apr: number;
  balanceUsd: number;
  confidence: FinancialDataConfidence;
  creditor: string;
  id: string;
  isExcludedFromPayoffLine: boolean;
  label: string;
  minimumPaymentUsd: number;
  payoffLineLabel: string;
  plannedPaymentUsd: number;
  priority: number;
}

export interface OperatingOverviewModel {
  copContext: OperatingCopContextLabels;
  currentWeek: OperatingCurrentWeekSummary;
  debtList: OperatingDebtListItem[];
  totals: OperatingOverviewTotals;
}

export interface OperatingDebtTimelineAllocation {
  debtId: string;
  debtName: string;
  endingBalanceUsd: number;
  extraPaymentAppliedUsd: number;
  interestAccruedUsd: number;
  isCleared: boolean;
  isExcludedFromPayoffLine: boolean;
  scheduledPaymentAppliedUsd: number;
  startingBalanceUsd: number;
}

export interface OperatingDebtTimelineMonth {
  allocations: OperatingDebtTimelineAllocation[];
  clearedDebtIds: string[];
  focusDebtId: string | null;
  focusDebtName: string | null;
  monthIndex: number;
  monthLabel: string;
  remainingBudgetUsd: number;
  totalBudgetAppliedUsd: number;
}

export interface OperatingDebtTimelineSummary {
  assumptionLabel: string;
  currencyCode: 'USD';
  isDebtFreeWithinHorizon: boolean;
  monthlyBaseDebtBudgetUsd: number;
  monthsSimulated: number;
  monthsToDebtFree: number | null;
  remainingCoreDebtBalanceUsd: number;
  remainingExcludedDebtBalanceUsd: number;
  safeExtraPaymentUsd: number;
  steps: OperatingDebtTimelineMonth[];
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

export interface CashFlowWorkspaceWeekEvent {
  debtId?: string;
  id: string;
  kind: OperatingEntryKind;
  date: string;
  label: string;
  direction: CashFlowEventDirection;
  category: CashFlowEventCategory;
  amount: number;
  currencyCode: CurrencyCode;
  confidence: FinancialDataConfidence;
  isReviewRequired: boolean;
  notes?: string;
  sourceKind: OperatingEntrySourceKind;
  sourceLabel: string;
  status: OperatingEntryStatus;
}

export interface CashFlowWorkspaceWeek {
  id: string;
  label: string;
  weekStartDate: string;
  weekEndDate: string;
  startingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  freeMargin: number;
  endingBalance: number;
  eventCount: number;
  estimatedItemCount: number;
  reviewItemCount: number;
  events: CashFlowWorkspaceWeekEvent[];
}

export interface CashFlowWorkspaceSummary {
  currencyCode: CurrencyCode;
  totalInflow: number;
  totalOutflow: number;
  freeMargin: number;
  totalWeeks: number;
  totalEvents: number;
  reviewItemCount: number;
  validationIssueCount: number;
}

export interface ReviewQueueItem {
  id: string;
  label: string;
  kind: 'event' | 'debt' | 'validation';
  confidence: FinancialDataConfidence;
  reason: string;
  sourceLabel: string;
  amount?: number;
  currencyCode: CurrencyCode;
  eventCategory?: CashFlowEventCategory;
  weekStartDate?: string;
  notes?: string;
}

export interface SafeExtraPaymentSummary {
  amount: number;
  basedOnWeekStartDate: string;
  blockingReasons: string[];
  confidence: FinancialDataConfidence;
  currencyCode: CurrencyCode;
  explanation: string;
  minimumFutureEndingBalance: number;
}

export interface WeeklyCashFlowWorkspace {
  asOfWeekStartDate: string;
  currencyCode: CurrencyCode;
  reviewQueue: ReviewQueueItem[];
  safeExtraPayment: SafeExtraPaymentSummary;
  summary: CashFlowWorkspaceSummary;
  weeks: CashFlowWorkspaceWeek[];
}
