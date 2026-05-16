import type { OperatingMonth } from '../types';

export interface OperatingModelStoreState {
  activeMonthId: string | null;
  selectedWeekId: string | null;
}

export interface SetActiveMonthAction {
  monthId: string;
  type: 'setActiveMonth';
}

export interface SetSelectedWeekAction {
  type: 'setSelectedWeek';
  weekId: string | null;
}

export interface SyncMonthAction {
  month: OperatingMonth;
  type: 'syncMonth';
}

export interface ResetOperatingModelAction {
  type: 'reset';
}

export type OperatingModelStoreAction =
  | SetActiveMonthAction
  | SetSelectedWeekAction
  | SyncMonthAction
  | ResetOperatingModelAction;

export const INITIAL_OPERATING_MODEL_STORE_STATE: OperatingModelStoreState = {
  activeMonthId: null,
  selectedWeekId: null,
};

function resolveSelectedWeekId(month: OperatingMonth, selectedWeekId: string | null): string | null {
  if (selectedWeekId === null) {
    return month.weeks[0]?.id ?? null;
  }

  const matchedWeek = month.weeks.find((week) => week.id === selectedWeekId);

  return matchedWeek?.id ?? month.weeks[0]?.id ?? null;
}

export function createOperatingModelStoreState(month: OperatingMonth): OperatingModelStoreState {
  return {
    activeMonthId: month.id,
    selectedWeekId: month.weeks[0]?.id ?? null,
  };
}

export function reduceOperatingModelStoreState(
  state: OperatingModelStoreState,
  action: OperatingModelStoreAction,
): OperatingModelStoreState {
  if (action.type === 'setActiveMonth') {
    return {
      ...state,
      activeMonthId: action.monthId,
    };
  }

  if (action.type === 'setSelectedWeek') {
    return {
      ...state,
      selectedWeekId: action.weekId,
    };
  }

  if (action.type === 'syncMonth') {
    return {
      activeMonthId: action.month.id,
      selectedWeekId: resolveSelectedWeekId(action.month, state.selectedWeekId),
    };
  }

  return INITIAL_OPERATING_MODEL_STORE_STATE;
}
