import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  createTrackingIngestHandler,
  type TrackingAdminClient,
  type TrackingPointInsertRow,
} from './handler.ts';

function readRequiredEnv(name: 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_URL'): string {
  const value = Deno.env.get(name);

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createSupabaseTrackingAdminClient(): TrackingAdminClient {
  const adminClient = createClient(readRequiredEnv('SUPABASE_URL'), readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return {
    async getUserFromToken(token: string): Promise<{ errorMessage: string | null; userId: string | null }> {
      try {
        const {
          data: { user },
          error,
        } = await adminClient.auth.getUser(token);

        return {
          errorMessage: error?.message ?? null,
          userId: user?.id ?? null,
        };
      } catch (error: unknown) {
        return {
          errorMessage: error instanceof Error ? error.message : 'Unexpected auth lookup failure.',
          userId: null,
        };
      }
    },
    async insertTrackingPoints(rows: TrackingPointInsertRow[]): Promise<{ errorMessage: string | null }> {
      try {
        const { error } = await adminClient.from('tracking_points').insert(rows);

        return {
          errorMessage: error?.message ?? null,
        };
      } catch (error: unknown) {
        return {
          errorMessage: error instanceof Error ? error.message : 'Unexpected tracking insert failure.',
        };
      }
    },
  };
}

Deno.serve(createTrackingIngestHandler({ createAdminClient: createSupabaseTrackingAdminClient }));
