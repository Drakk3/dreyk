export interface NavItem {
  key: string;
  label: string;
  icon: string;
  badge?: string;
}

export const geofencingNav: NavItem[] = [
  { key: 'ops',     label: 'OPERATIONS', icon: '◊' },
  { key: 'zones',   label: 'ZONES',      icon: '▢' },
  { key: 'members', label: 'MEMBERS',    icon: '◉' },
  { key: 'events',  label: 'EVENTS',     icon: '≣', badge: '3' },
  { key: 'alexa',   label: 'ALEXA',      icon: '▲' },
  { key: 'modules', label: 'MODULES',    icon: '▣' },
];
