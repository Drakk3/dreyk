export interface CompanionPublicEnv {
  supabaseAnonKey: string;
  supabaseUrl: string;
}

type CompanionEnvName = 'EXPO_PUBLIC_SUPABASE_ANON_KEY' | 'EXPO_PUBLIC_SUPABASE_URL';

function readRequiredEnv(name: CompanionEnvName): string {
  const value = name === 'EXPO_PUBLIC_SUPABASE_ANON_KEY' ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY : process.env.EXPO_PUBLIC_SUPABASE_URL;

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv(): CompanionPublicEnv {
  return {
    supabaseAnonKey: readRequiredEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    supabaseUrl: readRequiredEnv('EXPO_PUBLIC_SUPABASE_URL'),
  };
}
