export interface OperatingModelStoreState {
  activeMonthId: string | null;
  selectedCashFlowWeekId: string | null;
}

export interface SetActiveMonthAction {
  monthId: string;
  type: 'setActiveMonth';
}

export interface SetSelectedWeekAction {
  type: 'setSelectedWeek';
  weekId: string | null;
}

export interface SyncActiveMonthAction {
  activeMonthId: string;
  availableWeekIds: string[];
  defaultWeekId: string | null;
  type: 'syncActiveMonth';
}

export interface ResetOperatingModelAction {
  type: 'reset';
}

export type OperatingModelStoreAction =
  | SetActiveMonthAction
  | SetSelectedWeekAction
  | SyncActiveMonthAction
  | ResetOperatingModelAction;

export const INITIAL_OPERATING_MODEL_STORE_STATE: OperatingModelStoreState = {
  activeMonthId: null,
  selectedCashFlowWeekId: null,
};

function resolveSelectedCashFlowWeekId(
  availableWeekIds: string[],
  defaultWeekId: string | null,
  selectedCashFlowWeekId: string | null,
): string | null {
  if (selectedCashFlowWeekId === null) {
    return defaultWeekId;
  }

  return availableWeekIds.includes(selectedCashFlowWeekId) ? selectedCashFlowWeekId : defaultWeekId;
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
      selectedCashFlowWeekId: action.weekId,
    };
  }

  if (action.type === 'syncActiveMonth') {
    return {
      activeMonthId: action.activeMonthId,
      selectedCashFlowWeekId: resolveSelectedCashFlowWeekId(
        action.availableWeekIds,
        action.defaultWeekId,
        state.selectedCashFlowWeekId,
      ),
    };
  }

  return INITIAL_OPERATING_MODEL_STORE_STATE;
}
