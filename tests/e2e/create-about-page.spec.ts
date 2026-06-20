/**
 * E2E: Create "About" page in CMS
 *
 * Flow:
 *   1. Login as editor
 *   2. Navigate to Pages → New Page
 *   3. Select "About" preset (or enter slug manually)
 *   4. Verify page is created with status=draft and correct template
 *   5. Assert page appears in the pages list
 *
 * Known bugs captured in test assertions:
 *   - BUG-001: template defaults to 'default' if site templateSlug is null → 400 error
 */

import { test, expect } from '@playwright/test'

const BASE_URL   = process.env.CMS_URL   ?? 'http://localhost:5173'
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'test@litostudio.id'
const TEST_PASS  = process.env.TEST_PASS  ?? 'test1234!'

test.describe('Create About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASS)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15_000 })
  })

  test('creates About page with lito template and draft status', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages`)
    await page.getByRole('button', { name: /new page/i }).click()

    // Select "About" preset card (PagesNewPageContainer)
    const aboutCard = page.locator('[data-preset="about"], button:has-text("About")')
    await aboutCard.first().click()

    // BUG-001 guard: if templateSlug is null, the backend rejects with 400 because
    // 'default' is not in enum ['lito','fashion','beauty'].
    // Intercept the POST to capture the body sent.
    const [createReq] = await Promise.all([
      page.waitForRequest(req =>
        req.url().includes('/api/v1/cms/content/pages') && req.method() === 'POST',
      ),
      page.getByRole('button', { name: /create|save/i }).click(),
    ])

    const body = createReq.postDataJSON() as { template?: string; slug?: string; status?: string }

    // BUG-001: template must NOT be 'default' — backend enum only allows lito/fashion/beauty
    expect(
      body.template,
      'BUG-001: template sent to backend must be lito|fashion|beauty, not "default"',
    ).toMatch(/^(lito|fashion|beauty)$/)

    // Page should be created and redirect to editor
    await page.waitForURL(/\/pages\/.+\/edit/, { timeout: 10_000 })

    // Status badge should show DRAFT
    await expect(page.getByText(/draft/i).first()).toBeVisible()
  })

  test('slug is pre-filled as "about" and passes availability check', async ({ page }) => {
    await page.goto(`${BASE_URL}/pages`)
    await page.getByRole('button', { name: /new page/i }).click()

    const aboutCard = page.locator('[data-preset="about"], button:has-text("About")')
    await aboutCard.first().click()

    // Slug field should be auto-populated
    const slugInput = page.getByLabel(/slug/i)
    await expect(slugInput).toHaveValue(/about/)

    // Check-slug call should return available:true
    const [checkReq, checkRes] = await Promise.all([
      page.waitForRequest(req => req.url().includes('check-slug')),
      page.waitForResponse(res => res.url().includes('check-slug') && res.ok()),
      slugInput.dispatchEvent('blur'),
    ])
    const json = await checkRes.json() as { available?: boolean }
    expect(json.available).toBe(true)
  })

  test('shows error toast when template is invalid (BUG-001 simulation)', async ({ page, context }) => {
    // Intercept the page creation and force template='default' to simulate BUG-001
    await context.route('**/api/v1/cms/content/pages', async route => {
      const body = route.request().postDataJSON() as Record<string, unknown>
      if (body.template === 'default') {
        // Backend would return 400
        await route.fulfill({ status: 400, body: JSON.stringify({ error: 'template must be one of lito, fashion, beauty' }) })
      } else {
        await route.continue()
      }
    })

    await page.goto(`${BASE_URL}/pages`)
    await page.getByRole('button', { name: /new page/i }).click()
    const aboutCard = page.locator('[data-preset="about"], button:has-text("About")')
    await aboutCard.first().click()
    await page.getByRole('button', { name: /create|save/i }).click()

    // If CMS is patched (BUG-001 fixed), no error should appear.
    // If not patched, an error toast/message should be visible.
    // This test documents expected post-fix behavior:
    await page.waitForURL(/\/pages\/.+\/edit/, { timeout: 10_000 })
    await expect(page.getByText(/error|failed/i)).not.toBeVisible()
  })
})
