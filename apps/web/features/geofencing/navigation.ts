import type { AppSidebarSection } from '@/shared/components/app-shell/AppSidebar';

export interface DashboardNavCommand {
  key: string;
  label: string;
  shortcut: string;
}

export const GEOFENCING_NAV_SECTIONS: AppSidebarSection[] = [
  {
    key: 'primary',
    label: 'PRIMARY',
    items: [
      { key: 'ops', label: 'OPERATIONS', icon: '◊' },
      { key: 'zones', label: 'ZONES', icon: '▢' },
      { key: 'members', label: 'MEMBERS', icon: '◉' },
      { key: 'events', label: 'EVENTS', icon: '≣', badge: '3' },
      { key: 'alexa', label: 'ALEXA', icon: '▲' },
      { key: 'modules', label: 'MODULES', icon: '▣' },
    ],
  },
  {
    key: 'system',
    label: 'SYSTEM',
    items: [
      { key: 'settings', label: 'SETTINGS / PREVIEW', icon: '✦', isDisabled: true },
      { key: 'logs', label: 'AUDIT LOG / PREVIEW', icon: '≡', isDisabled: true },
    ],
  },
];

export const GEOFENCING_COMMANDS: DashboardNavCommand[] = [
  { key: 'ops', label: 'Open Operations', shortcut: 'G O' },
  { key: 'zones', label: 'Open Zones', shortcut: 'G Z' },
  { key: 'members', label: 'Open Members', shortcut: 'G M' },
  { key: 'events', label: 'Open Events', shortcut: 'G E' },
];
