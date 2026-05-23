import type { AppSidebarSection } from '@/shared/components/app-shell/AppSidebar';

import type { FitnessSectionKey } from './types';

export interface FitnessNavItem {
  icon: string;
  key: FitnessSectionKey;
  label: string;
}

export const FITNESS_DEFAULT_SECTION: FitnessSectionKey = 'juan';

export const FITNESS_NAV_ITEMS: FitnessNavItem[] = [
  { key: 'juan', label: 'Juan', icon: '◉' },
  { key: 'yasmis', label: 'Yasmis', icon: '◌' },
  { key: 'nutrition', label: 'Nutrición', icon: '≣' },
  { key: 'goals', label: 'Metas & reglas', icon: '△' },
];

export const FITNESS_NAV_SECTIONS: AppSidebarSection[] = [
  {
    key: 'fitness',
    label: 'FITNESS',
    items: FITNESS_NAV_ITEMS,
  },
];

export function isFitnessSectionKey(value: string): value is FitnessSectionKey {
  return value === 'juan' || value === 'yasmis' || value === 'nutrition' || value === 'goals';
}
