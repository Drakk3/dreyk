export interface PublicEnv {
  supabaseAnonKey: string;
  supabaseUrl: string;
}

function readRequiredEnv(name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'NEXT_PUBLIC_SUPABASE_URL'): string {
  const value =
    name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv(): PublicEnv {
  return {
    supabaseAnonKey: readRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    supabaseUrl: readRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  };
}
