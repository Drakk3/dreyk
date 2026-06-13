import 'server-only';

export interface PrivateEnv {
  alexaAccountLinkingClientId: string;
  alexaAccountLinkingClientSecret: string;
  alexaAccountLinkingTokenSecret: string;
  supabaseServiceRoleKey: string;
}

function readRequiredEnv(
  name:
    | 'ALEXA_ACCOUNT_LINKING_CLIENT_ID'
    | 'ALEXA_ACCOUNT_LINKING_CLIENT_SECRET'
    | 'ALEXA_ACCOUNT_LINKING_TOKEN_SECRET'
    | 'SUPABASE_SERVICE_ROLE_KEY',
): string {
  const value = process.env[name];

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPrivateEnv(): PrivateEnv {
  return {
    alexaAccountLinkingClientId: readRequiredEnv('ALEXA_ACCOUNT_LINKING_CLIENT_ID'),
    alexaAccountLinkingClientSecret: readRequiredEnv('ALEXA_ACCOUNT_LINKING_CLIENT_SECRET'),
    alexaAccountLinkingTokenSecret: readRequiredEnv('ALEXA_ACCOUNT_LINKING_TOKEN_SECRET'),
    supabaseServiceRoleKey: readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  };
}
