import { geofencingNav, type NavItem } from '@/features/geofencing/config/nav';

// Registro central de navegación por feature.
// Para agregar un nuevo feature: importar su nav y agregarlo al array.
// Ejemplo futuro: import { myFinancesNav } from '@/features/myFinances/config/nav';

export const PRIMARY_NAV: NavItem[] = [
  ...geofencingNav,
  // ...myFinancesNav,
];

export const SYSTEM_NAV: NavItem[] = [
  { key: 'settings', label: 'SETTINGS',  icon: '✦' },
  { key: 'logs',     label: 'AUDIT LOG', icon: '≡' },
];

export type { NavItem };
