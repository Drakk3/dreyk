import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@dreyk/shared/types/database';

import { getPublicEnv } from '@/lib/config/env';

type ServerSupabaseClient = ReturnType<typeof createServerClient<Database>>;

export function createSupabaseServerClient(): ServerSupabaseClient {
  const cookieStore = cookies();
  const env = getPublicEnv();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });
}
