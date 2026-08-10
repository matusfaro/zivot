import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/zivot/' : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    // Only collect Vitest tests from tests/ — e2e/ holds Playwright specs
    include: ['tests/**/*.{test,spec}.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
