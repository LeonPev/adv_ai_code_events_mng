import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import path from 'path'

// Use an absolute path so the Prisma client resolves to the same file the webServer uses
const testDb = new PrismaClient({
  datasources: { db: { url: `file:${path.resolve('./prisma/test.db')}` } },
})

test.describe('Login', () => {
  test.beforeAll(async () => {
    // Create a suspended customer so the suspension test has a real row to work with
    const hash = await bcrypt.hash('susp123', 1)
    await testDb.user.upsert({
      where: { email: 'suspended@ccms.local' },
      create: { email: 'suspended@ccms.local', passwordHash: hash, fullName: 'Suspended User', role: 'CUSTOMER', status: 'SUSPENDED' },
      update: { status: 'SUSPENDED', passwordHash: hash },
    })
  })

  test.afterAll(async () => {
    await testDb.user.deleteMany({ where: { email: 'suspended@ccms.local' } })
    await testDb.$disconnect()
  })

  test('CUSTOMER credentials redirect to /activities', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('customer@ccms.local')
    await page.getByLabel(/password/i).fill('cust123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/activities/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/activities/)
  })

  test('OPERATOR credentials redirect to /operator', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('operator@ccms.local')
    await page.getByLabel(/password/i).fill('op123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/operator/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/operator/)
  })

  test('ADMIN credentials redirect to /admin', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('admin@ccms.local')
    await page.getByLabel(/password/i).fill('admin123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/admin/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/admin/)
  })

  test('wrong credentials show an error and stay on the login page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('customer@ccms.local')
    await page.getByLabel(/password/i).fill('totallyWrong')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.locator('p[role="alert"]')).toContainText(/invalid email or password/i)
    await expect(page).toHaveURL('/auth/login')
  })

  test('suspended account shows a suspension message and stays on the login page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill('suspended@ccms.local')
    await page.getByLabel(/password/i).fill('susp123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.locator('p[role="alert"]')).toContainText(/suspended/i)
    await expect(page).toHaveURL('/auth/login')
  })

  test('"Forgot password" link leads to a contact-admin page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('link', { name: /forgot password/i }).click()
    await expect(page.getByText(/contact.*admin/i)).toBeVisible()
  })
})

test.describe('Signup', () => {
  test('new user can sign up and lands on activities page', async ({ page }) => {
    await page.goto('/auth/signup')

    await page.getByLabel(/full name/i).fill('New Test User')
    await page.getByLabel(/email/i).fill(`newuser_${Date.now()}@example.com`)
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /create account/i }).click()

    await page.waitForURL(/\/activities/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/activities/)
  })

  test('duplicate email shows inline error without redirecting', async ({ page }) => {
    await page.goto('/auth/signup')

    // admin@ccms.local is always present after global-setup seed
    await page.getByLabel(/full name/i).fill('Duplicate User')
    await page.getByLabel(/email/i).fill('admin@ccms.local')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /create account/i }).click()

    await expect(page.locator('p[role="alert"]')).toBeVisible()
    await expect(page).toHaveURL('/auth/signup')
  })
})
