export interface CompanionPublicEnv {
  supabaseAnonKey: string;
  supabaseUrl: string;
}

type CompanionEnvName = 'EXPO_PUBLIC_SUPABASE_ANON_KEY' | 'EXPO_PUBLIC_SUPABASE_URL';

function readEnvCandidate(candidate: unknown): string | null {
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : null;
}

function readRequiredEnv(name: CompanionEnvName): string {
  const value = readEnvCandidate(
    name === 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
      ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      : process.env.EXPO_PUBLIC_SUPABASE_URL,
  );

  if (value === null) {
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
