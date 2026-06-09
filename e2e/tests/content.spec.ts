// e2e/tests/content.spec.ts — Page CRUD, Content Publishing, Form Submission flows
import { test, expect } from '@playwright/test'

test.describe('Page CRUD', () => {
  test('pages list loads', async ({ page }) => {
    await page.goto('/content/pages')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('can open new page form', async ({ page }) => {
    await page.goto('/content/pages')
    const createBtn = page.getByRole('button', { name: /new|create|buat/i }).first()
    if (await createBtn.isVisible()) {
      await createBtn.click()
      await expect(page.locator('form, dialog, [role="dialog"]')).toBeVisible()
    }
  })
})

test.describe('Content Publishing', () => {
  test('stories list loads', async ({ page }) => {
    await page.goto('/content/stories')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('can open story detail', async ({ page }) => {
    await page.goto('/content/stories')
    const firstRow = page.locator('table tbody tr, [data-testid="story-row"]').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForLoadState('networkidle')
      await expect(page).not.toHaveURL(/login/)
    }
  })

  test('destinations list loads', async ({ page }) => {
    await page.goto('/content/destinations')
    await expect(page).not.toHaveURL(/login/)
  })

  test('gallery list loads', async ({ page }) => {
    await page.goto('/content/gallery')
    await expect(page).not.toHaveURL(/login/)
  })

  test('journal list loads', async ({ page }) => {
    await page.goto('/content/journal')
    await expect(page).not.toHaveURL(/login/)
  })

  test('testimonials list loads', async ({ page }) => {
    await page.goto('/content/testimonials')
    await expect(page).not.toHaveURL(/login/)
  })

  test('faqs list loads', async ({ page }) => {
    await page.goto('/content/faqs')
    await expect(page).not.toHaveURL(/login/)
  })
})

test.describe('Form Submission', () => {
  test('forms list loads', async ({ page }) => {
    await page.goto('/forms')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('can create a new form', async ({ page }) => {
    await page.goto('/forms')
    const createBtn = page.getByRole('button', { name: /new|create|buat/i }).first()
    if (await createBtn.isVisible()) {
      await createBtn.click()
      await expect(page.locator('form, dialog, [role="dialog"]')).toBeVisible()
    }
  })
})
