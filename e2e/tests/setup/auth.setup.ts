// e2e/tests/setup/auth.setup.ts
// Authenticates once and saves state for all other tests
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../../.auth/user.json')

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_EMAIL ?? 'test@litostudio.com'
  const password = process.env.E2E_PASSWORD ?? 'test-password'

  await page.goto('/login')
  await expect(page).toHaveTitle(/Lito Studio CMS/)

  // Fill login form
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in|login|masuk/i }).click()

  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 10_000 })
  await expect(page).toHaveURL('/')

  // Save auth state
  await page.context().storageState({ path: authFile })
})
