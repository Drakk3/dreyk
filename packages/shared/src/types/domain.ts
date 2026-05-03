import type {
  AlexaTriggerRow,
  GroupMemberRow,
  GroupRow,
  LocationEventRow,
  ModuleRow,
  ProfileRow,
  UserPermissionRow,
  ZoneRow,
} from './database';

export type { EventType, Role, ThemePreference } from './database';

export interface Profile extends ProfileRow {}

export interface Group extends GroupRow {}

export interface GroupMember extends GroupMemberRow {}

export interface UserPermission extends UserPermissionRow {}

export interface Zone extends ZoneRow {}

export interface AlexaTrigger extends AlexaTriggerRow {}

export interface LocationEvent extends LocationEventRow {}

export interface Module extends ModuleRow {}
