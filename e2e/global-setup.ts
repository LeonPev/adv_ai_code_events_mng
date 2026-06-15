import { execSync } from 'child_process'
import { mkdirSync } from 'fs'
import { chromium } from '@playwright/test'
import { loginAndSaveState } from './fixtures/auth.fixtures'

export default async function globalSetup() {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL
  if (!testDatabaseUrl) {
    throw new Error('TEST_DATABASE_URL is required for Playwright global setup')
  }

  // Reset and seed the test database
  execSync('npx prisma migrate reset --force --skip-seed', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  })
  execSync('tsx prisma/seed.ts', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  })

  // Create auth state directory and save logged-in sessions for each role
  mkdirSync('e2e/.auth', { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL: 'http://localhost:3001' })
  const page = await context.newPage()

  await loginAndSaveState(page, 'admin')
  await loginAndSaveState(page, 'operator')
  await loginAndSaveState(page, 'customer')

  await browser.close()
}
