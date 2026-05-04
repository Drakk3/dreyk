import type {
  DashboardEvent,
  DashboardProfile,
  DashboardUserPin,
  DashboardZone,
} from '@/shared/types/dashboard';

export const MOCK_PROFILES: DashboardProfile[] = [
  { id: 'u-01', name: 'Drakk3', role: 'admin', color: 'var(--chart-1)', initials: 'DK' },
  { id: 'u-02', name: 'Helena.M', role: 'user', color: 'var(--chart-2)', initials: 'HM' },
  { id: 'u-03', name: 'Iker.A', role: 'user', color: 'var(--chart-3)', initials: 'IA' },
  { id: 'u-04', name: 'Nora.V', role: 'user', color: 'var(--chart-4)', initials: 'NV' },
  { id: 'u-05', name: 'Theo.R', role: 'user', color: 'var(--chart-5)', initials: 'TR' },
];

export const MOCK_ZONES: DashboardZone[] = [
  {
    id: 'z-01',
    name: 'CASA / NORTH',
    x: 28,
    y: 35,
    r: 70,
    active: true,
    members: 3,
    alexa: true,
    radius_m: 120,
  },
  {
    id: 'z-02',
    name: 'OFICINA',
    x: 62,
    y: 28,
    r: 56,
    active: true,
    members: 2,
    alexa: true,
    radius_m: 80,
  },
  {
    id: 'z-03',
    name: 'ESCUELA',
    x: 78,
    y: 62,
    r: 48,
    active: true,
    members: 1,
    alexa: false,
    radius_m: 60,
  },
  {
    id: 'z-04',
    name: 'ESTUDIO',
    x: 38,
    y: 70,
    r: 40,
    active: true,
    members: 1,
    alexa: true,
    radius_m: 50,
  },
  {
    id: 'z-05',
    name: 'RUTA / TEST',
    x: 50,
    y: 50,
    r: 30,
    active: false,
    members: 0,
    alexa: false,
    radius_m: 40,
  },
];

export const MOCK_USER_PINS: DashboardUserPin[] = [
  { id: 'u-01', x: 30, y: 36, zone: 'z-01', color: 'var(--chart-1)' },
  { id: 'u-02', x: 60, y: 30, zone: 'z-02', color: 'var(--chart-2)' },
  { id: 'u-03', x: 76, y: 64, zone: 'z-03', color: 'var(--chart-3)' },
  { id: 'u-04', x: 40, y: 68, zone: 'z-04', color: 'var(--chart-4)' },
  { id: 'u-05', x: 52, y: 44, zone: null, color: 'var(--chart-5)' },
];

export const MOCK_EVENTS: DashboardEvent[] = [
  { id: 'e-01', t: '06:42:11', user: 'Helena.M', zone: 'OFICINA', type: 'enter', dist: 12 },
  { id: 'e-02', t: '06:39:48', user: 'Drakk3', zone: 'CASA / NORTH', type: 'exit', dist: 132 },
  { id: 'e-03', t: '06:33:02', user: 'Iker.A', zone: 'ESCUELA', type: 'enter', dist: 24 },
  { id: 'e-04', t: '06:28:55', user: 'Nora.V', zone: 'ESTUDIO', type: 'enter', dist: 8 },
  { id: 'e-05', t: '06:14:09', user: 'Theo.R', zone: 'RUTA / TEST', type: 'exit', dist: 41 },
  { id: 'e-06', t: '06:11:51', user: 'Drakk3', zone: 'CASA / NORTH', type: 'enter', dist: 4 },
  { id: 'e-07', t: '06:02:30', user: 'Helena.M', zone: 'CASA / NORTH', type: 'exit', dist: 96 },
  { id: 'e-08', t: '05:58:14', user: 'Theo.R', zone: 'OFICINA', type: 'exit', dist: 220 },
];
