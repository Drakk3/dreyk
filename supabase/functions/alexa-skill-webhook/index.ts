import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  createAlexaSkillWebhookHandler,
  type AlexaLinkedUserLookup,
  type AlexaLinkedUserRow,
  type AlexaLinkedUserUpsertInput,
  type AlexaSkillWebhookAdminClient,
} from './handler.ts';

function readRequiredEnv(
  name: 'ALEXA_WEBHOOK_SECRET' | 'SUPABASE_SERVICE_ROLE_KEY' | 'SUPABASE_URL',
): string {
  const value = Deno.env.get(name);

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createSupabaseAlexaSkillWebhookAdminClient(): AlexaSkillWebhookAdminClient {
  const adminClient = createClient(readRequiredEnv('SUPABASE_URL'), readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return {
    async findLinkedUser(lookup: AlexaLinkedUserLookup): Promise<{ errorMessage: string | null; row: AlexaLinkedUserRow | null }> {
      try {
        let query = adminClient.from('alexa_linked_users').select('*').returns<AlexaLinkedUserRow[]>();

        if (typeof lookup.profileId === 'string') {
          query = query.eq('profile_id', lookup.profileId);
        }

        if (typeof lookup.alexaUserReference === 'string') {
          query = query.eq('alexa_user_reference', lookup.alexaUserReference);
        }

        const { data, error } = await query.maybeSingle();

        return {
          errorMessage: error?.message ?? null,
          row: data,
        };
      } catch (error: unknown) {
        return {
          errorMessage: error instanceof Error ? error.message : 'Unexpected linked user lookup failure.',
          row: null,
        };
      }
    },
    async upsertLinkedUser(input: AlexaLinkedUserUpsertInput): Promise<{ errorMessage: string | null; row: AlexaLinkedUserRow | null }> {
      try {
        const { data, error } = await adminClient
          .from('alexa_linked_users')
          .upsert(input, {
            onConflict: 'profile_id',
          })
          .select('*')
          .returns<AlexaLinkedUserRow[]>()
          .single();

        return {
          errorMessage: error?.message ?? null,
          row: data,
        };
      } catch (error: unknown) {
        return {
          errorMessage: error instanceof Error ? error.message : 'Unexpected linked user upsert failure.',
          row: null,
        };
      }
    },
  };
}

Deno.serve(
  createAlexaSkillWebhookHandler({
    createAdminClient: createSupabaseAlexaSkillWebhookAdminClient,
    webhookSecret: readRequiredEnv('ALEXA_WEBHOOK_SECRET'),
  }),
);
