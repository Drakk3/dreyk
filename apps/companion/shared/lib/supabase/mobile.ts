import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createSupabaseClient, type SupabaseClientConfig } from '@dreyk/shared/supabase/createClient';
import type { Database } from '@dreyk/shared/types/database';

import { getPublicEnv } from '../config/env';

let cachedClient: SupabaseClient<Database> | null = null;
let cachedConfigKey = '';

function createConfigKey(config: SupabaseClientConfig): string {
  return `${config.url}::${config.anonKey}`;
}

export function getSupabaseMobileClient(): SupabaseClient<Database> {
  const env = getPublicEnv();
  const config: SupabaseClientConfig = {
    anonKey: env.supabaseAnonKey,
    url: env.supabaseUrl,
  };
  const configKey = createConfigKey(config);

  if (cachedClient === null || cachedConfigKey !== configKey) {
    cachedClient = createSupabaseClient(config, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: AsyncStorage,
      },
    });
    cachedConfigKey = configKey;
  }

  return cachedClient;
}

export function createSupabaseFunctionUrl(functionName: string): string {
  const env = getPublicEnv();
  const baseUrl = env.supabaseUrl.endsWith('/') ? env.supabaseUrl.slice(0, -1) : env.supabaseUrl;

  return `${baseUrl}/functions/v1/${functionName}`;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const supabase = getSupabaseMobileClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    return null;
  }

  return accessToken;
}
