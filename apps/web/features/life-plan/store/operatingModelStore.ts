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
  selectedWeekId: null,
};

function resolveSelectedWeekId(
  availableWeekIds: string[],
  defaultWeekId: string | null,
  selectedWeekId: string | null,
): string | null {
  if (selectedWeekId === null) {
    return defaultWeekId;
  }

  return availableWeekIds.includes(selectedWeekId) ? selectedWeekId : defaultWeekId;
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

  if (action.type === 'syncActiveMonth') {
    return {
      activeMonthId: action.activeMonthId,
      selectedWeekId: resolveSelectedWeekId(action.availableWeekIds, action.defaultWeekId, state.selectedWeekId),
    };
  }

  return INITIAL_OPERATING_MODEL_STORE_STATE;
}
