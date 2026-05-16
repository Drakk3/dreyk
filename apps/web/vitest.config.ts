import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['features/**/*.test.ts', 'features/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
