import type { Database } from '@dreyk/shared/types/database';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { createResolvedAuthContext, resolveSessionUserId } from './services/authSession';
import type { ResolvedAuthContext } from './types';

export async function resolveAuthContext(
  supabase: SupabaseClient<Database>,
  session: Session,
): Promise<ResolvedAuthContext | null> {
  const userId = resolveSessionUserId(session);

  if (userId === null) {
    return null;
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error !== null) {
    throw error;
  }

  return createResolvedAuthContext(session, data);
}
