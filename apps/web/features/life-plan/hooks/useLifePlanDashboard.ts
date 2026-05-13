'use client';

import { useCallback, useMemo, useState } from 'react';

import { LIFE_PLAN_HORIZON_OPTIONS, LIFE_PLAN_SNAPSHOT } from '../mockData';
import { buildContingencyPlanSummary } from '../services/contingencyPlan';
import { buildFinancialProjection } from '../services/financialPlan';
import { buildTeachingPathSummary } from '../services/teachingPath';
import type {
  FinancialScenario,
  PlanningHorizonMonths,
  PlanningScenarioId,
} from '../types';

interface UseLifePlanDashboardResult {
  contingencyPlan: ReturnType<typeof buildContingencyPlanSummary>;
  financialProjection: ReturnType<typeof buildFinancialProjection>;
  handleHorizonChange: (value: PlanningHorizonMonths) => void;
  handleScenarioChange: (value: PlanningScenarioId) => void;
  horizonOptions: PlanningHorizonMonths[];
  priorityActions: typeof LIFE_PLAN_SNAPSHOT.priorityActions;
  selectedHorizonMonths: PlanningHorizonMonths;
  selectedScenario: FinancialScenario;
  selectedScenarioId: PlanningScenarioId;
  snapshot: typeof LIFE_PLAN_SNAPSHOT;
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

export function useLifePlanDashboard(): UseLifePlanDashboardResult {
  // 1. External dependencies (store, router, clients)

  // 2. Local state
  const [selectedScenarioId, setSelectedScenarioId] = useState<PlanningScenarioId>(getInitialScenario);
  const [selectedHorizonMonths, setSelectedHorizonMonths] = useState<PlanningHorizonMonths>(12);

  // 3. Derived values (useMemo)
  const selectedScenario = useMemo(() => {
    return getSelectedScenario(selectedScenarioId);
  }, [selectedScenarioId]);

  const financialProjection = useMemo(() => {
    return buildFinancialProjection(LIFE_PLAN_SNAPSHOT, selectedScenario, selectedHorizonMonths);
  }, [selectedHorizonMonths, selectedScenario]);

  const teachingPath = useMemo(() => {
    return buildTeachingPathSummary(LIFE_PLAN_SNAPSHOT);
  }, []);

  const contingencyPlan = useMemo(() => {
    return buildContingencyPlanSummary(LIFE_PLAN_SNAPSHOT);
  }, []);

  // 4. Handlers and effects (useCallback, useEffect)
  const handleScenarioChange = useCallback((value: PlanningScenarioId): void => {
    setSelectedScenarioId(value);
  }, []);

  const handleHorizonChange = useCallback((value: PlanningHorizonMonths): void => {
    setSelectedHorizonMonths(value);
  }, []);

  // 5. Single return object — NEVER return an array from a hook
  return {
    contingencyPlan,
    financialProjection,
    handleHorizonChange,
    handleScenarioChange,
    horizonOptions: LIFE_PLAN_HORIZON_OPTIONS,
    priorityActions: LIFE_PLAN_SNAPSHOT.priorityActions,
    selectedHorizonMonths,
    selectedScenario,
    selectedScenarioId,
    snapshot: LIFE_PLAN_SNAPSHOT,
    teachingPath,
  };
}
