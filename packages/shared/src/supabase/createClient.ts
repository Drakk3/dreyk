import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';

import type { Database } from '../types/database';

export interface SupabaseClientConfig {
  anonKey: string;
  url: string;
}

export function createSupabaseClient(
  config: SupabaseClientConfig,
  options?: SupabaseClientOptions<'public'>,
): SupabaseClient<Database> {
  return createClient<Database>(config.url, config.anonKey, options);
}
