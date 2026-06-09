// e2e/tests/auth.spec.ts — Authentication flows: Login, Logout, Forgot Password
import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'

// Use fresh context (no saved auth state) for auth tests
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Login', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/CMS|Login/)
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|login|masuk/i })).toBeEnabled()
  })

  test('rejects invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('wrong@example.com', 'badpassword')
    await loginPage.expectError()
    await expect(page).toHaveURL(/login/)
  })

  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/login/)
  })

  test('shows forgot password link', async ({ page }) => {
    await page.goto('/login')
    const forgotLink = page.getByRole('link', { name: /forgot|lupa/i })
    await expect(forgotLink).toBeVisible()
  })
})

test.describe('Logout', () => {
  test.use({ storageState: 'e2e/.auth/user.json' })

  test('signs out and redirects to login', async ({ page }) => {
    await page.goto('/')
    // Find and click the user menu / logout button
    const userMenu = page.getByRole('button', { name: /user|avatar|account|profile/i }).first()
    if (await userMenu.isVisible()) {
      await userMenu.click()
    }
    const logoutBtn = page.getByRole('menuitem', { name: /sign out|logout|keluar/i })
      .or(page.getByRole('button', { name: /sign out|logout|keluar/i }))
    await logoutBtn.click()
    await page.waitForURL(/login/, { timeout: 10_000 })
    await expect(page).toHaveURL(/login/)
  })
})
