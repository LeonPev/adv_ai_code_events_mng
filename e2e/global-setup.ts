import { execSync } from 'child_process'
import { mkdirSync } from 'fs'
import { chromium } from '@playwright/test'
import { loginAndSaveState } from './fixtures/auth.fixtures'

export default async function globalSetup() {
  // Reset and seed the test database
  execSync('DATABASE_URL=file:./test.db npx prisma migrate reset --force --skip-seed', {
    stdio: 'inherit',
  })
  execSync('DATABASE_URL=file:./test.db tsx prisma/seed.ts', {
    stdio: 'inherit',
  })

  // Create auth state directory and save logged-in sessions for each role
  mkdirSync('e2e/.auth', { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage()

  await loginAndSaveState(page, 'admin')
  await loginAndSaveState(page, 'operator')
  await loginAndSaveState(page, 'customer')

  await browser.close()
}
