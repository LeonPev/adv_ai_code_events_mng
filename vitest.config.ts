import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const testDatabaseUrl = process.env.TEST_DATABASE_URL

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required for Vitest')
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(process.cwd(), 'src') },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/tests/setup/vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    fileParallelism: false,
    env: {
      DATABASE_URL: testDatabaseUrl,
      NEXTAUTH_SECRET: 'test-secret-not-for-production',
      NEXTAUTH_URL: 'http://localhost:3001',
    },
    pool: 'forks',
    sequence: { concurrent: false },
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/app/**/actions.ts'],
      exclude: ['src/app/**/page.tsx', 'src/app/**/layout.tsx'],
      reporter: ['text', 'lcov'],
    },
  },
})
