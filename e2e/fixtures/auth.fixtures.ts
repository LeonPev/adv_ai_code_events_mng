import { test as base, type Page } from '@playwright/test'
import path from 'path'

type AuthRole = 'admin' | 'operator' | 'customer'

const CREDENTIALS: Record<AuthRole, { email: string; password: string }> = {
  admin:    { email: 'admin@ccms.local',    password: 'admin123' },
  operator: { email: 'operator@ccms.local', password: 'op123' },
  customer: { email: 'customer@ccms.local', password: 'cust123' },
}

export const AUTH_STATE: Record<AuthRole, string> = {
  admin:    path.join(__dirname, '../.auth/admin.json'),
  operator: path.join(__dirname, '../.auth/operator.json'),
  customer: path.join(__dirname, '../.auth/customer.json'),
}

export async function loginAndSaveState(page: Page, role: AuthRole) {
  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(CREDENTIALS[role].email)
  await page.getByLabel(/password/i).fill(CREDENTIALS[role].password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(/\/(admin|operator|activities)/, { timeout: 10_000 })
  await page.context().storageState({ path: AUTH_STATE[role] })
}

export const test = base.extend<{
  adminPage: Page
  operatorPage: Page
  customerPage: Page
}>({
  adminPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE.admin })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
  operatorPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE.operator })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
  customerPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: AUTH_STATE.customer })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
})

export { expect } from '@playwright/test'
