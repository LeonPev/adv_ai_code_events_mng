import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/Users/leon/Desktop/jb/HUJI/adv_ai_code_events_mng/src' },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/tests/setup/vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    env: {
      DATABASE_URL: 'file:./test.db',
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
