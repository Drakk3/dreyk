import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '.',
  test: {
    environment: 'node',
    include: ['supabase/functions/ingest-location/**/*.test.ts'],
  },
});
