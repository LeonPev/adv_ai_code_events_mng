import { test, expect } from '@playwright/test'

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
