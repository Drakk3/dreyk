'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@dreyk/shared/types/database';

import { getPublicEnv } from '@/lib/config/env';

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

let cachedClient: BrowserSupabaseClient | undefined;

export function getSupabaseBrowserClient(): BrowserSupabaseClient {
  const env = getPublicEnv();

  if (cachedClient === undefined) {
    cachedClient = createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
  }

  return cachedClient;
}
