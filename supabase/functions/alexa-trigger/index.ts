import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  createAlexaTriggerHandler,
  type AlexaAccessTokenResult,
  type AlexaDeliveryAttemptRow,
  type AlexaLinkedUserRow,
  type AlexaProactiveEventsClient,
  type AlexaSendEventInput,
  type AlexaSendEventResult,
  type AlexaTriggerAdminClient,
  type AlexaTriggerRow,
  type AlexaWorkflowKey,
  type LocationEventRow,
  type PersistDeliveryAttemptInput,
} from './handler.ts';

interface AlexaOAuthResponse {
  access_token: string;
}

function readRequiredEnv(
  name:
    | 'ALEXA_TRIGGER_SECRET'
    | 'ALEXA_CLIENT_ID'
    | 'ALEXA_CLIENT_SECRET'
    | 'ALEXA_OAUTH_URL'
    | 'ALEXA_PROACTIVE_EVENTS_URL'
    | 'SUPABASE_SERVICE_ROLE_KEY'
    | 'SUPABASE_URL',
): string {
  const value = Deno.env.get(name);

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalScope(): string {
  const value = Deno.env.get('ALEXA_PROACTIVE_EVENTS_SCOPE');
  return typeof value === 'string' && value.length > 0 ? value : 'alexa::proactive_events';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function createSupabaseAlexaTriggerAdminClient(): AlexaTriggerAdminClient {
  const adminClient = createClient(readRequiredEnv('SUPABASE_URL'), readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return {
    async findDeliveryAttempt(lookup: {
      alexaLinkedUserId: string;
      locationEventId: string;
      workflowKey: AlexaWorkflowKey;
    }): Promise<{ errorMessage: string | null; row: AlexaDeliveryAttemptRow | null }> {
      try {
        const { data, error } = await adminClient
          .from('alexa_delivery_attempts')
          .select('*')
          .eq('location_event_id', lookup.locationEventId)
          .eq('alexa_linked_user_id', lookup.alexaLinkedUserId)
          .eq('workflow_key', lookup.workflowKey)
          .returns<AlexaDeliveryAttemptRow[]>()
          .maybeSingle();

        return {
          errorMessage: error?.message ?? null,
          row: data,
        };
      } catch (error: unknown) {
        return {
          errorMessage: error instanceof Error ? error.message : 'Unexpected delivery attempt lookup failure.',
          row: null,
        };
      }
    },
    async findLinkedUserById(id: string): Promise<{ errorMessage: string | null; row: AlexaLinkedUserRow | null }> {
      try {
        const { data, error } = await adminClient
          .from('alexa_linked_users')
          .select('*')
          .eq('id', id)
          .returns<AlexaLinkedUserRow[]>()
          .maybeSingle();

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
    async findLocationEventById(id: string): Promise<{ errorMessage: string | null; row: LocationEventRow | null }> {
      try {
        const { data, error } = await adminClient
          .from('location_events')
          .select('*')
          .eq('id', id)
          .returns<LocationEventRow[]>()
          .maybeSingle();

        return {
          errorMessage: error?.message ?? null,
          row: data,
        };
      } catch (error: unknown) {
        return {
          errorMessage: error instanceof Error ? error.message : 'Unexpected location event lookup failure.',
          row: null,
        };
      }
    },
    async findTriggerByZoneId(zoneId: string): Promise<{ errorMessage: string | null; row: AlexaTriggerRow | null }> {
      try {
        const { data, error } = await adminClient
          .from('alexa_triggers')
          .select('*')
          .eq('zone_id', zoneId)
          .returns<AlexaTriggerRow[]>()
          .maybeSingle();

        return {
          errorMessage: error?.message ?? null,
          row: data,
        };
      } catch (error: unknown) {
        return {
          errorMessage: error instanceof Error ? error.message : 'Unexpected trigger lookup failure.',
          row: null,
        };
      }
    },
    async persistDeliveryAttempt(input: PersistDeliveryAttemptInput): Promise<{ errorMessage: string | null; row: AlexaDeliveryAttemptRow | null }> {
      try {
        const { data, error } = await adminClient
          .from('alexa_delivery_attempts')
          .upsert(input, {
            onConflict: 'location_event_id,alexa_linked_user_id,workflow_key',
          })
          .select('*')
          .returns<AlexaDeliveryAttemptRow[]>()
          .single();

        return {
          errorMessage: error?.message ?? null,
          row: data,
        };
      } catch (error: unknown) {
        return {
          errorMessage: error instanceof Error ? error.message : 'Unexpected delivery attempt persistence failure.',
          row: null,
        };
      }
    },
  };
}

function buildProactiveEventPayload(input: AlexaSendEventInput): Record<string, unknown> {
  return {
    event: {
      name: 'AMAZON.MessageAlert.Activated',
      payload: {},
    },
    expiryTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    localizedAttributes: [
      {
        locale: input.locale,
        message: input.message,
        providerName: 'Dreyk',
      },
    ],
    referenceId: input.referenceId,
    relevantAudience: {
      payload: {
        user: input.userReference,
      },
      type: 'Unicast',
    },
    timestamp: new Date().toISOString(),
  };
}

function createAlexaProactiveEventsClient(): AlexaProactiveEventsClient {
  const oauthUrl = readRequiredEnv('ALEXA_OAUTH_URL');
  const proactiveEventsUrl = readRequiredEnv('ALEXA_PROACTIVE_EVENTS_URL');
  const clientId = readRequiredEnv('ALEXA_CLIENT_ID');
  const clientSecret = readRequiredEnv('ALEXA_CLIENT_SECRET');
  const scope = readOptionalScope();

  return {
    async fetchAccessToken(): Promise<AlexaAccessTokenResult> {
      try {
        const response = await fetch(oauthUrl, {
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
            scope,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          method: 'POST',
        });

        if (response.ok === false) {
          return {
            accessToken: null,
            errorMessage: `Alexa OAuth token request failed with status ${response.status}.`,
          };
        }

        const body: unknown = await response.json();

        if (isRecord(body) === false || typeof body.access_token !== 'string' || body.access_token.length === 0) {
          return {
            accessToken: null,
            errorMessage: 'Alexa OAuth token response did not include access_token.',
          };
        }

        const oauthBody: AlexaOAuthResponse = {
          access_token: body.access_token,
        };

        return {
          accessToken: oauthBody.access_token,
          errorMessage: null,
        };
      } catch (error: unknown) {
        return {
          accessToken: null,
          errorMessage: error instanceof Error ? error.message : 'Unexpected Alexa OAuth failure.',
        };
      }
    },
    async sendProactiveEvent(input: AlexaSendEventInput & { accessToken: string }): Promise<AlexaSendEventResult> {
      try {
        const response = await fetch(proactiveEventsUrl, {
          body: JSON.stringify(buildProactiveEventPayload(input)),
          headers: {
            Authorization: `Bearer ${input.accessToken}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        });

        if (response.ok === false) {
          const responseText = await response.text();
          return {
            errorMessage: `Alexa Proactive Events request failed with status ${response.status}: ${responseText}`,
            providerMessageId: null,
          };
        }

        return {
          errorMessage: null,
          providerMessageId: response.headers.get('x-amzn-requestid') ?? input.referenceId,
        };
      } catch (error: unknown) {
        return {
          errorMessage: error instanceof Error ? error.message : 'Unexpected Alexa event delivery failure.',
          providerMessageId: null,
        };
      }
    },
  };
}

Deno.serve(
  createAlexaTriggerHandler({
    createAdminClient: createSupabaseAlexaTriggerAdminClient,
    createProactiveEventsClient: createAlexaProactiveEventsClient,
    triggerSecret: readRequiredEnv('ALEXA_TRIGGER_SECRET'),
  }),
);
