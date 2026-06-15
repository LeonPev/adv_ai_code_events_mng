import { defineConfig, devices } from '@playwright/test'

const testDatabaseUrl = process.env.TEST_DATABASE_URL

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required for Playwright')
}

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.test-results',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev -- -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      NEXTAUTH_SECRET: 'test-secret-not-for-production',
      NEXTAUTH_URL: 'http://localhost:3001',
    },
  },
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
})
