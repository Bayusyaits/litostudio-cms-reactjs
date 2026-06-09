// e2e/pages/LoginPage.ts — Page Object Model for login flows
import type { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email)
    await this.page.getByLabel(/password/i).fill(password)
    await this.page.getByRole('button', { name: /sign in|login|masuk/i }).click()
  }

  async expectError(message?: string) {
    const alert = this.page.getByRole('alert')
    await alert.waitFor({ state: 'visible' })
    if (message) {
      await alert.waitFor({ state: 'visible' })
    }
  }

  async expectRedirectToDashboard() {
    await this.page.waitForURL('/', { timeout: 10_000 })
  }

  async clickForgotPassword() {
    await this.page.getByRole('link', { name: /forgot|lupa/i }).click()
  }
}
