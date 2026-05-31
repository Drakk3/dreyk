'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { SupabaseDatabase } from '@dreyk/shared/types/database';

import { getPublicEnv } from '@/lib/config/env';

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<SupabaseDatabase>>;

let cachedClient: BrowserSupabaseClient | undefined;

export function getSupabaseBrowserClient(): BrowserSupabaseClient {
  const env = getPublicEnv();

  if (cachedClient === undefined) {
    cachedClient = createBrowserClient<SupabaseDatabase>(env.supabaseUrl, env.supabaseAnonKey);
  }

  return cachedClient;
}
