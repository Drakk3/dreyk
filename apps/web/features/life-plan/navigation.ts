import type { AppSidebarSection } from '@/shared/components/app-shell/AppSidebar';

import type { LifePlanSectionKey } from './types';

export interface LifePlanNavItem {
  icon: string;
  key: LifePlanSectionKey;
  label: string;
}

export const LIFE_PLAN_NAV_ITEMS: LifePlanNavItem[] = [
  { key: 'overview', label: 'Overview', icon: '◉' },
  { key: 'cash-flow', label: 'Cash flow', icon: '≈' },
  { key: 'finances', label: 'Finances', icon: '$' },
  { key: 'teaching', label: 'Teaching', icon: '⟡' },
  { key: 'contingencies', label: 'Risks', icon: '!' },
  { key: 'actions', label: 'Actions', icon: '→' },
];

export const LIFE_PLAN_NAV_SECTIONS: AppSidebarSection[] = [
  {
    key: 'life-plan',
    label: 'Life plan',
    items: LIFE_PLAN_NAV_ITEMS,
  },
];

export function isLifePlanSectionKey(value: string): value is LifePlanSectionKey {
  return (
    value === 'overview' ||
    value === 'cash-flow' ||
    value === 'finances' ||
    value === 'teaching' ||
    value === 'contingencies' ||
    value === 'actions'
  );
}
