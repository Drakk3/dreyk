'use client';

import { useMemo } from 'react';

import type { ActionsExecutionBrief } from '../services/actionsExecutionBrief';
import { buildActionsExecutionBrief } from '../services/actionsExecutionBrief';

export function useActionsExecutionBrief(): ActionsExecutionBrief {
  return useMemo(() => buildActionsExecutionBrief(), []);
}
