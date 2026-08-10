import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Legacy `any`s are concentrated in SwipeSurvey/CompactProfileEditor;
      // tracked as warnings — do not add new ones.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Pre-existing synchronous-setState effect patterns in SwipeSurvey and
      // useDebounceProp; refactor tracked, kept visible as warnings.
      'react-hooks/set-state-in-effect': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-nocheck': 'allow-with-description' },
      ],
    },
  },
  {
    // Playwright/Vitest files: the `use` fixture is not a React hook and
    // there is no React rendering to protect.
    files: ['e2e/**/*.ts', 'tests/**/*.ts', 'playwright.config.ts', 'vite.config.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/refs': 'off',
    },
  },
])
