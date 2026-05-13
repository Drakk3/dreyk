import type { Role } from '@dreyk/shared/types/database';

export type CommandSurfaceKey = 'launcher' | 'geofencing' | 'life-plan' | 'admin';

export type AppCommandHref =
  | '/'
  | '/geofencing'
  | '/life-plan'
  | '/life-plan?section=overview'
  | '/life-plan?section=finances'
  | '/life-plan?section=teaching'
  | '/life-plan?section=contingencies'
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
