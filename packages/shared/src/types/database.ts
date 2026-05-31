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

export type LifePlanCurrencyCode = 'USD';

export type LifePlanFinancialConfidence = 'verified' | 'estimated' | 'needsReview';

export type LifePlanCashFlowCategory =
  | 'debtPayment'
  | 'familySupport'
  | 'food'
  | 'gas'
  | 'housing'
  | 'income'
  | 'insurance'
  | 'investing'
  | 'savings'
  | 'subscription'
  | 'education'
  | 'utility'
  | 'other';

export type LifePlanEntryKind = 'income' | 'expense' | 'debt';

export type LifePlanEntryStatus = 'planned' | 'done' | 'skipped';

export type LifePlanEntrySourceKind = 'seed' | 'generated' | 'manual';

export type LifePlanRecurringCadence = 'weekly' | 'biweekly' | 'monthly';

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

export interface LifePlanMonthRow {
  created_at: string;
  currency_code: LifePlanCurrencyCode;
  id: string;
  month_key: string;
  owner_user_id: string;
  seeded_from_month_id: string | null;
}

export interface LifePlanDebtAccountRow {
  apr_assumption_decimal: number | null;
  apr_confidence: LifePlanFinancialConfidence;
  apr_source_context: Json;
  balance_confidence: LifePlanFinancialConfidence;
  balance_usd: number;
  confidence: LifePlanFinancialConfidence;
  created_at: string;
  creditor: string;
  id: string;
  is_excluded_from_payoff_line: boolean;
  label: string;
  minimum_payment_confidence: LifePlanFinancialConfidence;
  minimum_payment_usd: number | null;
  notes: string | null;
  owner_user_id: string;
  priority: number;
  source_metadata: Json;
}

export interface LifePlanRecurringTemplateRow {
  amount_usd: number;
  cadence: LifePlanRecurringCadence;
  category: LifePlanCashFlowCategory;
  confidence: LifePlanFinancialConfidence;
  created_at: string;
  debt_account_id: string | null;
  id: string;
  is_active: boolean;
  label: string;
  notes: string | null;
  owner_user_id: string;
  scheduled_day: number;
  source_metadata: Json;
}

export interface LifePlanMonthEntryRow {
  amount_usd: number;
  category: LifePlanCashFlowCategory;
  confidence: LifePlanFinancialConfidence;
  created_at: string;
  debt_account_id: string | null;
  entry_date: string;
  id: string;
  kind: LifePlanEntryKind;
  label: string;
  month_id: string;
  notes: string | null;
  owner_user_id: string;
  source_kind: LifePlanEntrySourceKind;
  source_metadata: Json;
  status: LifePlanEntryStatus;
  template_id: string | null;
}

export interface LifePlanEntryStatusHistoryRow {
  changed_at: string;
  entry_id: string;
  from_status: LifePlanEntryStatus;
  id: string;
  owner_user_id: string;
  reason: string | null;
  to_status: LifePlanEntryStatus;
}

export interface LifePlanDebtPaymentEventRow {
  amount_usd: number;
  balance_after_usd: number | null;
  created_at: string;
  debt_account_id: string;
  entry_id: string;
  id: string;
  notes: string | null;
  owner_user_id: string;
  payment_date: string;
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      life_plan_months: {
        Row: LifePlanMonthRow;
        Insert: {
          created_at?: string;
          currency_code?: LifePlanCurrencyCode;
          id?: string;
          month_key: string;
          owner_user_id: string;
          seeded_from_month_id?: string | null;
        };
        Update: {
          created_at?: string;
          currency_code?: LifePlanCurrencyCode;
          id?: string;
          month_key?: string;
          owner_user_id?: string;
          seeded_from_month_id?: string | null;
        };
        Relationships: [];
      };
      life_plan_debt_accounts: {
        Row: LifePlanDebtAccountRow;
        Insert: {
          apr_assumption_decimal?: number | null;
          apr_confidence: LifePlanFinancialConfidence;
          apr_source_context?: Json;
          balance_confidence: LifePlanFinancialConfidence;
          balance_usd: number;
          confidence: LifePlanFinancialConfidence;
          created_at?: string;
          creditor: string;
          id?: string;
          is_excluded_from_payoff_line?: boolean;
          label: string;
          minimum_payment_confidence: LifePlanFinancialConfidence;
          minimum_payment_usd?: number | null;
          notes?: string | null;
          owner_user_id: string;
          priority?: number;
          source_metadata?: Json;
        };
        Update: {
          apr_assumption_decimal?: number | null;
          apr_confidence?: LifePlanFinancialConfidence;
          apr_source_context?: Json;
          balance_confidence?: LifePlanFinancialConfidence;
          balance_usd?: number;
          confidence?: LifePlanFinancialConfidence;
          created_at?: string;
          creditor?: string;
          id?: string;
          is_excluded_from_payoff_line?: boolean;
          label?: string;
          minimum_payment_confidence?: LifePlanFinancialConfidence;
          minimum_payment_usd?: number | null;
          notes?: string | null;
          owner_user_id?: string;
          priority?: number;
          source_metadata?: Json;
        };
        Relationships: [];
      };
      life_plan_recurring_templates: {
        Row: LifePlanRecurringTemplateRow;
        Insert: {
          amount_usd: number;
          cadence: LifePlanRecurringCadence;
          category: LifePlanCashFlowCategory;
          confidence: LifePlanFinancialConfidence;
          created_at?: string;
          debt_account_id?: string | null;
          id?: string;
          is_active?: boolean;
          label: string;
          notes?: string | null;
          owner_user_id: string;
          scheduled_day: number;
          source_metadata?: Json;
        };
        Update: {
          amount_usd?: number;
          cadence?: LifePlanRecurringCadence;
          category?: LifePlanCashFlowCategory;
          confidence?: LifePlanFinancialConfidence;
          created_at?: string;
          debt_account_id?: string | null;
          id?: string;
          is_active?: boolean;
          label?: string;
          notes?: string | null;
          owner_user_id?: string;
          scheduled_day?: number;
          source_metadata?: Json;
        };
        Relationships: [];
      };
      life_plan_month_entries: {
        Row: LifePlanMonthEntryRow;
        Insert: {
          amount_usd: number;
          category: LifePlanCashFlowCategory;
          confidence: LifePlanFinancialConfidence;
          created_at?: string;
          debt_account_id?: string | null;
          entry_date: string;
          id?: string;
          kind: LifePlanEntryKind;
          label: string;
          month_id: string;
          notes?: string | null;
          owner_user_id: string;
          source_kind: LifePlanEntrySourceKind;
          source_metadata?: Json;
          status: LifePlanEntryStatus;
          template_id?: string | null;
        };
        Update: {
          amount_usd?: number;
          category?: LifePlanCashFlowCategory;
          confidence?: LifePlanFinancialConfidence;
          created_at?: string;
          debt_account_id?: string | null;
          entry_date?: string;
          id?: string;
          kind?: LifePlanEntryKind;
          label?: string;
          month_id?: string;
          notes?: string | null;
          owner_user_id?: string;
          source_kind?: LifePlanEntrySourceKind;
          source_metadata?: Json;
          status?: LifePlanEntryStatus;
          template_id?: string | null;
        };
        Relationships: [];
      };
      life_plan_entry_status_history: {
        Row: LifePlanEntryStatusHistoryRow;
        Insert: {
          changed_at?: string;
          entry_id: string;
          from_status: LifePlanEntryStatus;
          id?: string;
          owner_user_id: string;
          reason?: string | null;
          to_status: LifePlanEntryStatus;
        };
        Update: {
          changed_at?: string;
          entry_id?: string;
          from_status?: LifePlanEntryStatus;
          id?: string;
          owner_user_id?: string;
          reason?: string | null;
          to_status?: LifePlanEntryStatus;
        };
        Relationships: [];
      };
      life_plan_debt_payment_events: {
        Row: LifePlanDebtPaymentEventRow;
        Insert: {
          amount_usd: number;
          balance_after_usd?: number | null;
          created_at?: string;
          debt_account_id: string;
          entry_id: string;
          id?: string;
          notes?: string | null;
          owner_user_id: string;
          payment_date: string;
        };
        Update: {
          amount_usd?: number;
          balance_after_usd?: number | null;
          created_at?: string;
          debt_account_id?: string;
          entry_id?: string;
          id?: string;
          notes?: string | null;
          owner_user_id?: string;
          payment_date?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

type SupabaseCompatibleRecord<T extends object> = T & Record<string, unknown>;

type SupabaseCompatibleTable<TTable> = TTable extends {
  Insert: infer TInsert extends object;
  Relationships: infer TRelationships;
  Row: infer TRow extends object;
  Update: infer TUpdate extends object;
}
  ? {
      Insert: SupabaseCompatibleRecord<TInsert>;
      Relationships: TRelationships extends unknown[] ? TRelationships : [];
      Row: SupabaseCompatibleRecord<TRow>;
      Update: SupabaseCompatibleRecord<TUpdate>;
    }
  : TTable;

type SupabaseCompatibleView<TView> = TView extends {
  Relationships: infer TRelationships;
  Row: infer TRow extends object;
}
  ? TView extends {
      Insert: infer TInsert extends object;
      Update: infer TUpdate extends object;
    }
    ? {
        Insert: SupabaseCompatibleRecord<TInsert>;
        Relationships: TRelationships extends unknown[] ? TRelationships : [];
        Row: SupabaseCompatibleRecord<TRow>;
        Update: SupabaseCompatibleRecord<TUpdate>;
      }
    : {
        Relationships: TRelationships extends unknown[] ? TRelationships : [];
        Row: SupabaseCompatibleRecord<TRow>;
      }
  : TView;

type SupabaseCompatibleFunction<TFunction> = TFunction extends {
  Args: infer TArgs;
  Returns: infer TReturns;
  SetofOptions: infer TSetofOptions;
}
  ? {
      Args: TArgs extends Record<string, unknown> ? TArgs : never;
      Returns: TReturns;
      SetofOptions: TSetofOptions;
    }
  : TFunction extends {
      Args: infer TArgs;
      Returns: infer TReturns;
    }
  ? {
      Args: TArgs extends Record<string, unknown> ? TArgs : never;
      Returns: TReturns;
    }
  : TFunction;

export type SupabaseDatabase = {
  [TSchemaName in keyof Database]: Database[TSchemaName] extends {
    Functions: infer TFunctions;
    Tables: infer TTables;
    Views: infer TViews;
  }
    ? Omit<Database[TSchemaName], 'Functions' | 'Tables' | 'Views'> & {
        Functions: {
          [TFunctionName in keyof TFunctions]: SupabaseCompatibleFunction<TFunctions[TFunctionName]>;
        };
        Tables: {
          [TTableName in keyof TTables]: SupabaseCompatibleTable<TTables[TTableName]>;
        };
        Views: {
          [TViewName in keyof TViews]: SupabaseCompatibleView<TViews[TViewName]>;
        };
      }
    : Database[TSchemaName];
};
