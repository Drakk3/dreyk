import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsEslintParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';

const typescriptFiles = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];

export default [
  {
    ignores: ['.next/', 'dist/', 'node_modules/', '.turbo/'],
  },
  {
    files: typescriptFiles,
    languageOptions: {
      parser: tsEslintParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
    },
    rules: {
      ...tsEslintPlugin.configs.recommended.rules,
      ...tsEslintPlugin.configs['recommended-type-checked'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  eslintConfigPrettier,
];
