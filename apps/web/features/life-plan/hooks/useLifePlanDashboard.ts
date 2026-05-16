'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import { LIFE_PLAN_HORIZON_OPTIONS, LIFE_PLAN_SNAPSHOT } from '../mockData';
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
import {
  createDerivedRecurringBootstrapMonth,
  createInitialBootstrapMonth,
  createSeededPreviousMonthBootstrap,
  createSeedOperatingMonth,
} from '../services/operatingMonthBootstrap';
import {
  formatOperatingMonthLabel,
  shiftOperatingMonth,
} from '../services/operatingRecurringQueue';
import { buildOperatingOverviewModel } from '../services/operatingModelSelectors';
import { buildTeachingPathSummary } from '../services/teachingPath';
import { buildWeeklyCashFlowWorkspace } from '../services/weeklyCashFlowWorkspace';
import { useLifePlanPersistence, type PersistedOperatingMonthSummary } from './useLifePlanPersistence';
import {
  INITIAL_OPERATING_MODEL_STORE_STATE,
  reduceOperatingModelStoreState,
} from '../store/operatingModelStore';
import { handleError } from '@/shared/lib/errors';
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
  handleNavigateOperatingMonth: (offset: number) => void;
  handleScenarioChange: (value: PlanningScenarioId) => void;
  handleSelectOperatingMonth: (monthId: string) => void;
  handleSeedOperatingMonthFromPreviousMonth: () => void;
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

function createFallbackOperatingMonths(): Record<string, OperatingMonth> {
  const seedMonth = createSeedOperatingMonth();

  return {
    [seedMonth.id]: seedMonth,
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function useLifePlanDashboard(): UseLifePlanDashboardResult {
  // 1. External dependencies (store, router, clients)
  const { createMonth, listMonths, loadMonth, saveMonth } = useLifePlanPersistence();
  const [operatingStoreState, dispatchOperatingStore] = useReducer(
    reduceOperatingModelStoreState,
    INITIAL_OPERATING_MODEL_STORE_STATE,
  );

  // 2. Local state
  const [selectedScenarioId, setSelectedScenarioId] = useState<PlanningScenarioId>(getInitialScenario);
  const [selectedHorizonMonths, setSelectedHorizonMonths] = useState<PlanningHorizonMonths>(12);
  const [operatingMonthSummaries, setOperatingMonthSummaries] = useState<PersistedOperatingMonthSummary[]>([]);
  const [operatingMonths, setOperatingMonths] = useState<Record<string, OperatingMonth>>(createFallbackOperatingMonths);

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
    const orderedSummaries = operatingMonthSummaries.length > 0
      ? operatingMonthSummaries
      : orderedOperatingMonths.map((month) => ({
          id: month.id,
          month: month.month,
          seededFromMonthId: month.seededFromMonthId ?? null,
        }));

    return orderedSummaries.map((month) => ({
      id: month.id,
      label: formatOperatingMonthLabel(month.month),
      month: month.month,
    }));
  }, [operatingMonthSummaries, orderedOperatingMonths]);

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
  const syncOperatingMonthSummary = useCallback((month: OperatingMonth): void => {
    setOperatingMonthSummaries((currentSummaries) => {
      const nextSummary: PersistedOperatingMonthSummary = {
        id: month.id,
        month: month.month,
        seededFromMonthId: month.seededFromMonthId ?? null,
      };
      const existingIndex = currentSummaries.findIndex((summary) => summary.id === month.id);

      if (existingIndex === -1) {
        return [...currentSummaries, nextSummary].sort((leftMonth, rightMonth) => {
          return leftMonth.month.localeCompare(rightMonth.month);
        });
      }

      return currentSummaries.map((summary, index) => {
        return index === existingIndex ? nextSummary : summary;
      });
    });
  }, []);

  const syncLoadedOperatingMonth = useCallback(
    (month: OperatingMonth): void => {
      setOperatingMonths((currentMonths) => {
        const nextMonths: Record<string, OperatingMonth> = {};

        Object.values(currentMonths).forEach((currentMonth) => {
          if (currentMonth.id === month.id) {
            return;
          }

          if (currentMonth.month === month.month && !isUuid(currentMonth.id)) {
            return;
          }

          nextMonths[currentMonth.id] = currentMonth;
        });

        nextMonths[month.id] = month;

        return nextMonths;
      });
      syncOperatingMonthSummary(month);
    },
    [syncOperatingMonthSummary],
  );

  const ensureOperatingMonthLoaded = useCallback(
    async (monthSummary: PersistedOperatingMonthSummary): Promise<OperatingMonth | null> => {
      const cachedMonth = operatingMonths[monthSummary.id];

      if (cachedMonth !== undefined) {
        return cachedMonth;
      }

      const loadedMonth = await loadMonth(monthSummary.month);

      if (loadedMonth !== null) {
        syncLoadedOperatingMonth(loadedMonth);
      }

      return loadedMonth;
    },
    [loadMonth, operatingMonths, syncLoadedOperatingMonth],
  );

  const persistMutatedOperatingMonth = useCallback(
    async (nextMonth: OperatingMonth): Promise<OperatingMonth | null> => {
      const persistedMonth = await saveMonth(nextMonth);

      if (persistedMonth !== null) {
        syncLoadedOperatingMonth(persistedMonth);
      }

      return persistedMonth;
    },
    [saveMonth, syncLoadedOperatingMonth],
  );

  useEffect(() => {
    let isMounted = true;

    void (async (): Promise<void> => {
      try {
        const persistedMonths = await listMonths();

        if (!isMounted) {
          return;
        }

        setOperatingMonthSummaries(persistedMonths);

        if (persistedMonths.length === 0) {
          const createdMonth = await createMonth({ month: createSeedOperatingMonth().month });

          if (!isMounted || createdMonth === null) {
            return;
          }

          const bootstrappedMonth = createInitialBootstrapMonth(createdMonth);
          const persistedSeedMonth = await saveMonth(bootstrappedMonth);
          const initialMonth = persistedSeedMonth ?? createdMonth;

          if (!isMounted) {
            return;
          }

          syncLoadedOperatingMonth(initialMonth);
          dispatchOperatingStore({ monthId: initialMonth.id, type: 'setActiveMonth' });

          return;
        }

        const initialSummary = persistedMonths[0];

        if (initialSummary === undefined) {
          return;
        }

        const initialMonth = await loadMonth(initialSummary.month);

        if (!isMounted || initialMonth === null) {
          return;
        }

        syncLoadedOperatingMonth(initialMonth);
        dispatchOperatingStore({ monthId: initialMonth.id, type: 'setActiveMonth' });
      } catch (error: unknown) {
        handleError(error, 'useLifePlanDashboard.initializeOperatingMonths');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [createMonth, listMonths, loadMonth, saveMonth, syncLoadedOperatingMonth]);

  useEffect(() => {
    if (orderedOperatingMonths.length === 0) {
      return;
    }

    if (operatingStoreState.activeMonthId === null) {
      dispatchOperatingStore({ monthId: fallbackOperatingMonth.id, type: 'setActiveMonth' });
    }
  }, [fallbackOperatingMonth, operatingStoreState.activeMonthId, orderedOperatingMonths.length]);

  useEffect(() => {
    dispatchOperatingStore({
      activeMonthId: activeOperatingMonth.id,
      availableWeekIds: activeOperatingMonth.weeks.map((week) => week.id),
      defaultWeekId: activeOperatingMonth.weeks[0]?.id ?? null,
      type: 'syncActiveMonth',
    });
  }, [activeOperatingMonth]);

  const handleScenarioChange = useCallback((value: PlanningScenarioId): void => {
    setSelectedScenarioId(value);
  }, []);

  const handleHorizonChange = useCallback((value: PlanningHorizonMonths): void => {
    setSelectedHorizonMonths(value);
  }, []);

  const handleSelectOperatingMonth = useCallback(
    (monthId: string): void => {
      void (async (): Promise<void> => {
        try {
          const selectedSummary = operatingMonthSummaries.find((summary) => summary.id === monthId);

          if (selectedSummary !== undefined) {
            await ensureOperatingMonthLoaded(selectedSummary);
          }

          dispatchOperatingStore({ monthId, type: 'setActiveMonth' });
        } catch (error: unknown) {
          handleError(error, 'useLifePlanDashboard.handleSelectOperatingMonth');
        }
      })();
    },
    [ensureOperatingMonthLoaded, operatingMonthSummaries],
  );

  const handleSelectOperatingWeek = useCallback((weekId: string | null): void => {
    dispatchOperatingStore({ type: 'setSelectedWeek', weekId });
  }, []);

  const handleNavigateOperatingMonth = useCallback(
    (offset: number): void => {
      void (async (): Promise<void> => {
        try {
          const targetMonthKey = shiftOperatingMonth(activeOperatingMonth.month, offset);
          const existingSummary = operatingMonthSummaries.find((summary) => summary.month === targetMonthKey);

          if (existingSummary !== undefined) {
            const existingMonth = await ensureOperatingMonthLoaded(existingSummary);

            if (existingMonth !== null) {
              dispatchOperatingStore({ monthId: existingMonth.id, type: 'setActiveMonth' });
            }

            return;
          }

          const createdMonth = await createMonth({
            month: targetMonthKey,
            seededFromMonthId: offset > 0 ? activeOperatingMonth.id : null,
          });

          if (createdMonth === null) {
            return;
          }

          if (offset <= 0) {
            syncLoadedOperatingMonth(createdMonth);
            dispatchOperatingStore({ monthId: createdMonth.id, type: 'setActiveMonth' });
            return;
          }

          const bootstrappedMonth = createDerivedRecurringBootstrapMonth(activeOperatingMonth, createdMonth);
          const persistedMonth = await saveMonth(bootstrappedMonth);
          const initialMonth = persistedMonth ?? createdMonth;

          syncLoadedOperatingMonth(initialMonth);
          dispatchOperatingStore({ monthId: initialMonth.id, type: 'setActiveMonth' });
        } catch (error: unknown) {
          handleError(error, 'useLifePlanDashboard.handleNavigateOperatingMonth');
        }
      })();
    },
    [activeOperatingMonth, createMonth, ensureOperatingMonthLoaded, operatingMonthSummaries, saveMonth, syncLoadedOperatingMonth],
  );

  const handleCreateOperatingEntry = useCallback(
    (input: CreateOperatingEntryInput): void => {
      void (async (): Promise<void> => {
        try {
          const persistedMonth = await persistMutatedOperatingMonth(createOperatingEntry(activeOperatingMonth, input));

          if (persistedMonth !== null) {
            dispatchOperatingStore({ monthId: persistedMonth.id, type: 'setActiveMonth' });
          }
        } catch (error: unknown) {
          handleError(error, 'useLifePlanDashboard.handleCreateOperatingEntry');
        }
      })();
    },
    [activeOperatingMonth, persistMutatedOperatingMonth],
  );

  const handleUpdateOperatingEntry = useCallback(
    (entryId: string, input: UpdateOperatingEntryInput): void => {
      void (async (): Promise<void> => {
        try {
          const persistedMonth = await persistMutatedOperatingMonth(
            updateOperatingEntry(activeOperatingMonth, entryId, input),
          );

          if (persistedMonth !== null) {
            dispatchOperatingStore({ monthId: persistedMonth.id, type: 'setActiveMonth' });
          }
        } catch (error: unknown) {
          handleError(error, 'useLifePlanDashboard.handleUpdateOperatingEntry');
        }
      })();
    },
    [activeOperatingMonth, persistMutatedOperatingMonth],
  );

  const handleDeleteOperatingEntry = useCallback(
    (entryId: string): void => {
      void (async (): Promise<void> => {
        try {
          const persistedMonth = await persistMutatedOperatingMonth(deleteOperatingEntry(activeOperatingMonth, entryId));

          if (persistedMonth !== null) {
            dispatchOperatingStore({ monthId: persistedMonth.id, type: 'setActiveMonth' });
          }
        } catch (error: unknown) {
          handleError(error, 'useLifePlanDashboard.handleDeleteOperatingEntry');
        }
      })();
    },
    [activeOperatingMonth, persistMutatedOperatingMonth],
  );

  const handleTransitionOperatingEntryStatus = useCallback(
    (entryId: string, input: TransitionOperatingEntryStatusInput): void => {
      void (async (): Promise<void> => {
        try {
          const persistedMonth = await persistMutatedOperatingMonth(
            transitionOperatingEntryStatus(activeOperatingMonth, entryId, input),
          );

          if (persistedMonth !== null) {
            dispatchOperatingStore({ monthId: persistedMonth.id, type: 'setActiveMonth' });
          }
        } catch (error: unknown) {
          handleError(error, 'useLifePlanDashboard.handleTransitionOperatingEntryStatus');
        }
      })();
    },
    [activeOperatingMonth, persistMutatedOperatingMonth],
  );

  const handleSeedOperatingMonthFromPreviousMonth = useCallback((): void => {
    void (async (): Promise<void> => {
      try {
        const previousMonthKey = shiftOperatingMonth(activeOperatingMonth.month, -1);
        const previousMonthSummary = operatingMonthSummaries.find((summary) => summary.month === previousMonthKey);

        if (previousMonthSummary === undefined) {
          return;
        }

        const previousMonth = await ensureOperatingMonthLoaded(previousMonthSummary);

        if (previousMonth === null) {
          return;
        }

        const persistedMonth = await persistMutatedOperatingMonth(
          createSeededPreviousMonthBootstrap(previousMonth, activeOperatingMonth),
        );

        if (persistedMonth !== null) {
          dispatchOperatingStore({ monthId: persistedMonth.id, type: 'setActiveMonth' });
        }
      } catch (error: unknown) {
        handleError(error, 'useLifePlanDashboard.handleSeedOperatingMonthFromPreviousMonth');
      }
    })();
  }, [activeOperatingMonth, ensureOperatingMonthLoaded, operatingMonthSummaries, persistMutatedOperatingMonth]);

  // 5. Single return object — NEVER return an array from a hook
  return {
    activeOperatingMonth,
    availableOperatingMonths,
    contingencyPlan,
    cashFlowWorkspace,
    financialProjection,
    handleCreateOperatingEntry,
    handleHorizonChange,
    handleNavigateOperatingMonth,
    handleScenarioChange,
    handleSelectOperatingMonth,
    handleSeedOperatingMonthFromPreviousMonth,
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
