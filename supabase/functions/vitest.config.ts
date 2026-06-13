import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '.',
  test: {
    environment: 'node',
    include: [
      'supabase/functions/ingest-location/**/*.test.ts',
      'supabase/functions/alexa-skill-runtime/**/*.test.ts',
      'supabase/functions/alexa-skill-webhook/**/*.test.ts',
      'supabase/functions/alexa-trigger/**/*.test.ts',
    ],
  },
});
