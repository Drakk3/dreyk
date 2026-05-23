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
      { key: 'workspace', label: 'WORKSPACE', icon: '◊' },
      { key: 'zones', label: 'ZONES', icon: '▢' },
      { key: 'events', label: 'EVENTS', icon: '≣' },
      { key: 'coverage', label: 'COVERAGE', icon: '▲' },
    ],
  },
  {
    key: 'system',
    label: 'SYSTEM',
    items: [
      { key: 'snapshot', label: 'SNAPSHOT', icon: '✦' },
      { key: 'access', label: 'ACCESS', icon: '≡' },
    ],
  },
];

export const GEOFENCING_COMMANDS: DashboardNavCommand[] = [
  { key: 'workspace', label: 'Open Workspace', shortcut: 'G W' },
  { key: 'zones', label: 'Open Zones', shortcut: 'G Z' },
  { key: 'events', label: 'Open Events', shortcut: 'G E' },
  { key: 'coverage', label: 'Open Coverage', shortcut: 'G C' },
];
