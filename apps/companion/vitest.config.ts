import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRootDirectory = path.resolve(currentDirectory, '../../node_modules');

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(workspaceRootDirectory, 'react'),
      'react-dom': path.resolve(workspaceRootDirectory, 'react-dom'),
      'react/jsx-dev-runtime': path.resolve(workspaceRootDirectory, 'react/jsx-dev-runtime.js'),
      'react/jsx-runtime': path.resolve(workspaceRootDirectory, 'react/jsx-runtime.js'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['features/**/*.test.ts', 'features/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
