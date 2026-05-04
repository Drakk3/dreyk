export interface DashboardZone {
  id: string;
  name: string;
  x: number;
  y: number;
  r: number;
  active: boolean;
  members: number;
  alexa: boolean;
  radius_m: number;
}

export interface DashboardProfile {
  id: string;
  name: string;
  role: 'admin' | 'user';
  color: string;
  initials: string;
}

export interface DashboardUserPin {
  id: string;
  x: number;
  y: number;
  zone: string | null;
  color: string;
}

export interface DashboardEvent {
  id: string;
  t: string;
  user: string;
  zone: string;
  type: 'enter' | 'exit';
  dist: number;
}
