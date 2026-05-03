import type { SupabaseClient } from '@supabase/supabase-js';

import { createSupabaseClient, type SupabaseClientConfig } from './createClient.ts';
import type { Database } from '../types/database';

let cachedClient: SupabaseClient<Database> | null = null;
let cachedConfigKey = '';

function createConfigKey(config: SupabaseClientConfig): string {
  return `${config.url}::${config.anonKey}`;
}

export function getSupabaseBrowserClient(
  config: SupabaseClientConfig,
): SupabaseClient<Database> {
  const configKey = createConfigKey(config);

  if (cachedClient === null || cachedConfigKey !== configKey) {
    cachedClient = createSupabaseClient(config);
    cachedConfigKey = configKey;
  }

  return cachedClient;
}
