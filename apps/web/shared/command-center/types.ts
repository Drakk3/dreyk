import type { Role } from '@dreyk/shared/types/database';

export type CommandSurfaceKey = 'launcher' | 'geofencing' | 'life-plan' | 'fitness' | 'admin';

export type AppCommandHref =
  | '/'
  | '/geofencing'
  | '/life-plan'
  | '/life-plan?section=overview'
  | '/life-plan?section=cash-flow'
  | '/life-plan?section=teaching'
  | '/life-plan?section=actions'
  | '/fitness'
  | '/fitness?section=juan'
  | '/fitness?section=yasmis'
  | '/fitness?section=nutrition'
  | '/fitness?section=goals'
  | '/admin';

export interface SharedCommandMenuItem {
  description: string;
  group: string;
  label: string;
  onSelect: () => void;
  shortcut?: string;
}

export interface UseGlobalCommandMenuParams {
  currentSurface: CommandSurfaceKey;
  localItems?: SharedCommandMenuItem[];
  role: Role;
}

export interface UseGlobalCommandMenuResult {
  commandItems: SharedCommandMenuItem[];
  handleCommandMenuChange: (open: boolean) => void;
  handleCommandMenuOpen: () => void;
  handleCommandMenuToggle: () => void;
  handleCommandNavigation: (href: AppCommandHref) => void;
  isCommandMenuOpen: boolean;
}
