'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import { LIFE_PLAN_HORIZON_OPTIONS, LIFE_PLAN_SNAPSHOT } from '../mockData';
import { MAY_2026_REAL_DATA_SNAPSHOT } from '../realDataSnapshot';
import { buildContingencyPlanSummary } from '../services/contingencyPlan';
import { buildFinancialProjection } from '../services/financialPlan';
import { buildOperatingDebtTimeline } from '../services/operatingDebtTimeline';
import {
  createOperatingEntry,
  deleteOperatingEntry,
  type CreateOperatingEntryInput,
  transitionOperatingEntryStatus,
  type TransitionOperatingEntryStatusInput,
  updateOperatingEntry,
  type UpdateOperatingEntryInput,
} from '../services/operatingEntryMutations';
import { buildOperatingMonthFromSnapshot } from '../services/operatingMonthAdapter';
import {
  buildOperatingMonthFromRecurringTemplates,
  formatOperatingMonthLabel,
  incorporateRecurringQueueItem,
  shiftOperatingMonth,
} from '../services/operatingRecurringQueue';
import { buildOperatingOverviewModel } from '../services/operatingModelSelectors';
import { buildTeachingPathSummary } from '../services/teachingPath';
import { buildWeeklyCashFlowWorkspace } from '../services/weeklyCashFlowWorkspace';
import {
  INITIAL_OPERATING_MODEL_STORE_STATE,
  reduceOperatingModelStoreState,
} from '../store/operatingModelStore';
import type {
  FinancialProjection,
  FinancialScenario,
  LifePlanSnapshot,
  OperatingDebtTimelineSummary,
  OperatingMonth,
  OperatingOverviewModel,
  PlanningHorizonMonths,
  PlanningScenarioId,
  WeeklyCashFlowWorkspace,
} from '../types';

export interface OperatingMonthOption {
  id: string;
  label: string;
  month: string;
}

interface UseLifePlanDashboardResult {
  activeOperatingMonth: OperatingMonth;
  availableOperatingMonths: OperatingMonthOption[];
  contingencyPlan: ReturnType<typeof buildContingencyPlanSummary>;
  cashFlowWorkspace: WeeklyCashFlowWorkspace;
  financialProjection: ReturnType<typeof buildFinancialProjection>;
  handleCreateOperatingEntry: (input: CreateOperatingEntryInput) => void;
  handleHorizonChange: (value: PlanningHorizonMonths) => void;
  handleIncorporateRecurringQueueItem: (queueItemId: string) => void;
  handleNavigateOperatingMonth: (offset: number) => void;
  handleScenarioChange: (value: PlanningScenarioId) => void;
  handleSelectOperatingMonth: (monthId: string) => void;
  handleSelectOperatingWeek: (weekId: string | null) => void;
  handleTransitionOperatingEntryStatus: (
    entryId: string,
    input: TransitionOperatingEntryStatusInput,
  ) => void;
  handleUpdateOperatingEntry: (entryId: string, input: UpdateOperatingEntryInput) => void;
  handleDeleteOperatingEntry: (entryId: string) => void;
  horizonOptions: PlanningHorizonMonths[];
  operatingDebtTimeline: OperatingDebtTimelineSummary;
  operatingOverview: OperatingOverviewModel;
  priorityActions: typeof LIFE_PLAN_SNAPSHOT.priorityActions;
  selectedOperatingWeekId: string | null;
  selectedHorizonMonths: PlanningHorizonMonths;
  selectedScenario: FinancialScenario;
  selectedScenarioId: PlanningScenarioId;
  snapshot: LifePlanSnapshot;
  teachingPath: ReturnType<typeof buildTeachingPathSummary>;
}

function getInitialScenario(): PlanningScenarioId {
  return LIFE_PLAN_SNAPSHOT.scenarios[0]?.id ?? 'baseline';
}

function getSelectedScenario(selectedScenarioId: PlanningScenarioId): FinancialScenario {
  const matchedScenario = LIFE_PLAN_SNAPSHOT.scenarios.find((scenario) => scenario.id === selectedScenarioId);

  if (matchedScenario !== undefined) {
    return matchedScenario;
  }

  return {
    id: 'baseline',
    label: 'Base realista',
    description: 'Fallback defensivo si el catálogo de escenarios queda vacío.',
    incomeDelta: 0,
    fixedCostDelta: 0,
    variableCostDelta: 0,
    debtBudgetDelta: 0,
    emergencyTargetDelta: 0,
  };
}

function buildDashboardFinancialProjection(
  selectedScenario: FinancialScenario,
  selectedHorizonMonths: PlanningHorizonMonths,
): FinancialProjection {
  return buildFinancialProjection(LIFE_PLAN_SNAPSHOT, selectedScenario, selectedHorizonMonths);
}

function createSeedOperatingMonth(): OperatingMonth {
  return buildOperatingMonthFromSnapshot(MAY_2026_REAL_DATA_SNAPSHOT);
}

function createInitialOperatingMonths(): Record<string, OperatingMonth> {
  const seedMonth = createSeedOperatingMonth();

  return {
    [seedMonth.id]: seedMonth,
  };
}

export function useLifePlanDashboard(): UseLifePlanDashboardResult {
  // 1. External dependencies (store, router, clients)
  const [operatingStoreState, dispatchOperatingStore] = useReducer(
    reduceOperatingModelStoreState,
    INITIAL_OPERATING_MODEL_STORE_STATE,
  );

  // 2. Local state
  const [selectedScenarioId, setSelectedScenarioId] = useState<PlanningScenarioId>(getInitialScenario);
  const [selectedHorizonMonths, setSelectedHorizonMonths] = useState<PlanningHorizonMonths>(12);
  const [operatingMonths, setOperatingMonths] = useState<Record<string, OperatingMonth>>(createInitialOperatingMonths);

  // 3. Derived values (useMemo)
  const orderedOperatingMonths = useMemo(() => {
    return Object.values(operatingMonths).sort((leftMonth, rightMonth) => leftMonth.month.localeCompare(rightMonth.month));
  }, [operatingMonths]);

  const fallbackOperatingMonth = orderedOperatingMonths[0] ?? createSeedOperatingMonth();
  const activeOperatingMonth = useMemo(() => {
    const activeMonthId = operatingStoreState.activeMonthId;

    if (activeMonthId === null) {
      return fallbackOperatingMonth;
    }

    return operatingMonths[activeMonthId] ?? fallbackOperatingMonth;
  }, [fallbackOperatingMonth, operatingMonths, operatingStoreState.activeMonthId]);

  const availableOperatingMonths = useMemo(() => {
    return orderedOperatingMonths.map((month) => ({
      id: month.id,
      label: formatOperatingMonthLabel(month.month),
      month: month.month,
    }));
  }, [orderedOperatingMonths]);

  const selectedScenario = useMemo(() => {
    return getSelectedScenario(selectedScenarioId);
  }, [selectedScenarioId]);

  const financialProjection = useMemo(() => {
    return buildDashboardFinancialProjection(selectedScenario, selectedHorizonMonths);
  }, [selectedHorizonMonths, selectedScenario]);

  const cashFlowWorkspace = useMemo(() => {
    return buildWeeklyCashFlowWorkspace(activeOperatingMonth, operatingStoreState.selectedWeekId);
  }, [activeOperatingMonth, operatingStoreState.selectedWeekId]);

  const teachingPath = useMemo(() => {
    return buildTeachingPathSummary(LIFE_PLAN_SNAPSHOT);
  }, []);

  const operatingOverview = useMemo(() => {
    return buildOperatingOverviewModel(
      activeOperatingMonth,
      operatingStoreState.selectedWeekId,
      cashFlowWorkspace.safeExtraPayment,
      LIFE_PLAN_SNAPSHOT,
    );
  }, [activeOperatingMonth, cashFlowWorkspace.safeExtraPayment, operatingStoreState.selectedWeekId]);

  const operatingDebtTimeline = useMemo(() => {
    return buildOperatingDebtTimeline(
      activeOperatingMonth,
      cashFlowWorkspace.safeExtraPayment,
      selectedHorizonMonths,
    );
  }, [activeOperatingMonth, cashFlowWorkspace.safeExtraPayment, selectedHorizonMonths]);

  const contingencyPlan = useMemo(() => {
    return buildContingencyPlanSummary(LIFE_PLAN_SNAPSHOT);
  }, []);

  // 4. Handlers and effects (useCallback, useEffect)
  useEffect(() => {
    if (orderedOperatingMonths.length === 0) {
      return;
    }

    if (operatingStoreState.activeMonthId === null) {
      dispatchOperatingStore({ month: fallbackOperatingMonth, type: 'syncMonth' });
    }
  }, [fallbackOperatingMonth, operatingStoreState.activeMonthId, orderedOperatingMonths.length]);

  useEffect(() => {
    dispatchOperatingStore({ month: activeOperatingMonth, type: 'syncMonth' });
  }, [activeOperatingMonth]);

  const handleScenarioChange = useCallback((value: PlanningScenarioId): void => {
    setSelectedScenarioId(value);
  }, []);

  const handleHorizonChange = useCallback((value: PlanningHorizonMonths): void => {
    setSelectedHorizonMonths(value);
  }, []);

  const handleSelectOperatingMonth = useCallback((monthId: string): void => {
    dispatchOperatingStore({ monthId, type: 'setActiveMonth' });
  }, []);

  const handleSelectOperatingWeek = useCallback((weekId: string | null): void => {
    dispatchOperatingStore({ type: 'setSelectedWeek', weekId });
  }, []);

  const handleNavigateOperatingMonth = useCallback(
    (offset: number): void => {
      const targetMonth = shiftOperatingMonth(activeOperatingMonth.month, offset);
      const targetMonthId = `operating-month-${targetMonth}`;

      setOperatingMonths((currentMonths) => {
        if (currentMonths[targetMonthId] !== undefined) {
          return currentMonths;
        }

        return {
          ...currentMonths,
          [targetMonthId]: buildOperatingMonthFromRecurringTemplates(activeOperatingMonth, targetMonth),
        };
      });
      dispatchOperatingStore({ monthId: targetMonthId, type: 'setActiveMonth' });
    },
    [activeOperatingMonth],
  );

  const handleCreateOperatingEntry = useCallback((input: CreateOperatingEntryInput): void => {
    setOperatingMonths((currentMonths) => ({
      ...currentMonths,
      [activeOperatingMonth.id]: createOperatingEntry(activeOperatingMonth, input),
    }));
  }, [activeOperatingMonth]);

  const handleUpdateOperatingEntry = useCallback(
    (entryId: string, input: UpdateOperatingEntryInput): void => {
      setOperatingMonths((currentMonths) => ({
        ...currentMonths,
        [activeOperatingMonth.id]: updateOperatingEntry(activeOperatingMonth, entryId, input),
      }));
    },
    [activeOperatingMonth],
  );

  const handleDeleteOperatingEntry = useCallback((entryId: string): void => {
    setOperatingMonths((currentMonths) => ({
      ...currentMonths,
      [activeOperatingMonth.id]: deleteOperatingEntry(activeOperatingMonth, entryId),
    }));
  }, [activeOperatingMonth]);

  const handleTransitionOperatingEntryStatus = useCallback(
    (entryId: string, input: TransitionOperatingEntryStatusInput): void => {
      setOperatingMonths((currentMonths) => ({
        ...currentMonths,
        [activeOperatingMonth.id]: transitionOperatingEntryStatus(activeOperatingMonth, entryId, input),
      }));
    },
    [activeOperatingMonth],
  );

  const handleIncorporateRecurringQueueItem = useCallback((queueItemId: string): void => {
    setOperatingMonths((currentMonths) => ({
      ...currentMonths,
      [activeOperatingMonth.id]: incorporateRecurringQueueItem(activeOperatingMonth, queueItemId),
    }));
  }, [activeOperatingMonth]);

  // 5. Single return object — NEVER return an array from a hook
  return {
    activeOperatingMonth,
    availableOperatingMonths,
    contingencyPlan,
    cashFlowWorkspace,
    financialProjection,
    handleCreateOperatingEntry,
    handleHorizonChange,
    handleIncorporateRecurringQueueItem,
    handleNavigateOperatingMonth,
    handleScenarioChange,
    handleSelectOperatingMonth,
    handleSelectOperatingWeek,
    handleTransitionOperatingEntryStatus,
    handleUpdateOperatingEntry,
    handleDeleteOperatingEntry,
    horizonOptions: LIFE_PLAN_HORIZON_OPTIONS,
    operatingDebtTimeline,
    operatingOverview,
    priorityActions: LIFE_PLAN_SNAPSHOT.priorityActions,
    selectedOperatingWeekId: operatingStoreState.selectedWeekId,
    selectedHorizonMonths,
    selectedScenario,
    selectedScenarioId,
    snapshot: LIFE_PLAN_SNAPSHOT,
    teachingPath,
  };
}
