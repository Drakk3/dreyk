export type Json =
  | boolean
  | number
  | string
  | null
  | Json[]
  | { [key: string]: Json | undefined };

export type Role = 'admin' | 'user';

export type ThemePreference =
  | 'ares'
  | 'tron'
  | 'clu'
  | 'athena'
  | 'aphrodite'
  | 'poseidon';

export type EventType = 'enter' | 'exit';

export interface ProfileRow {
  avatar_url: string | null;
  created_at: string;
  display_name: string;
  id: string;
  is_active: boolean;
  role: Role;
  theme_preference: ThemePreference;
}

export interface GroupRow {
  created_at: string;
  created_by: string;
  description: string | null;
  id: string;
  name: string;
}

export interface GroupMemberRow {
  group_id: string;
  id: string;
  joined_at: string;
  user_id: string;
}

export interface UserPermissionRow {
  can_interact: boolean;
  can_view: boolean;
  granted_at: string;
  id: string;
  module_key: string;
  user_id: string;
}

export interface ZoneRow {
  created_at: string;
  created_by: string;
  group_id: string;
  id: string;
  is_active: boolean;
  latitude: number;
  longitude: number;
  name: string;
  radius_meters: number;
}

export interface AlexaTriggerRow {
  alexa_device_id: string;
  id: string;
  is_active: boolean;
  message_template: string;
  zone_id: string;
}

export interface LocationEventRow {
  distance_meters: number;
  event_type: EventType;
  id: string;
  latitude: number;
  longitude: number;
  triggered_at: string;
  user_id: string;
  zone_id: string;
}

export interface ModuleRow {
  config: Json;
  id: string;
  is_enabled: boolean;
  key: string;
  name: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          is_active?: boolean;
          role?: Role;
          theme_preference?: ThemePreference;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_active?: boolean;
          role?: Role;
          theme_preference?: ThemePreference;
        };
      };
      groups: {
        Row: GroupRow;
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          name?: string;
        };
      };
      group_members: {
        Row: GroupMemberRow;
        Insert: {
          group_id: string;
          id?: string;
          joined_at?: string;
          user_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          joined_at?: string;
          user_id?: string;
        };
      };
      user_permissions: {
        Row: UserPermissionRow;
        Insert: {
          can_interact?: boolean;
          can_view?: boolean;
          granted_at?: string;
          id?: string;
          module_key: string;
          user_id: string;
        };
        Update: {
          can_interact?: boolean;
          can_view?: boolean;
          granted_at?: string;
          id?: string;
          module_key?: string;
          user_id?: string;
        };
      };
      zones: {
        Row: ZoneRow;
        Insert: {
          created_at?: string;
          created_by: string;
          group_id: string;
          id?: string;
          is_active?: boolean;
          latitude: number;
          longitude: number;
          name: string;
          radius_meters: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          group_id?: string;
          id?: string;
          is_active?: boolean;
          latitude?: number;
          longitude?: number;
          name?: string;
          radius_meters?: number;
        };
      };
      alexa_triggers: {
        Row: AlexaTriggerRow;
        Insert: {
          alexa_device_id: string;
          id?: string;
          is_active?: boolean;
          message_template: string;
          zone_id: string;
        };
        Update: {
          alexa_device_id?: string;
          id?: string;
          is_active?: boolean;
          message_template?: string;
          zone_id?: string;
        };
      };
      location_events: {
        Row: LocationEventRow;
        Insert: {
          distance_meters: number;
          event_type: EventType;
          id?: string;
          latitude: number;
          longitude: number;
          triggered_at?: string;
          user_id: string;
          zone_id: string;
        };
        Update: {
          distance_meters?: number;
          event_type?: EventType;
          id?: string;
          latitude?: number;
          longitude?: number;
          triggered_at?: string;
          user_id?: string;
          zone_id?: string;
        };
      };
      modules: {
        Row: ModuleRow;
        Insert: {
          config?: Json;
          id?: string;
          is_enabled?: boolean;
          key: string;
          name: string;
        };
        Update: {
          config?: Json;
          id?: string;
          is_enabled?: boolean;
          key?: string;
          name?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
