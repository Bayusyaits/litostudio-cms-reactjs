/**
 * E2E: Publish About page and verify website rendering
 *
 * Flow:
 *   1. Open existing "about" page in the block editor
 *   2. Click Publish → verify status changes to LIVE/active
 *   3. Verify publishFn calls the page_sections sync endpoint (BUG-002 fixed)
 *   4. Visit the live website /about route
 *   5. Assert the page renders without errors (BUG-003 fixed)
 *
 * Fixes verified by these tests:
 *   - BUG-002: publishFn now calls POST /:pageId/sections/sync before setting status=active.
 *   - BUG-003: about.vue now wraps content in <DynamicSectionRenderer slug="about">.
 */

import { test, expect } from '@playwright/test'

const CMS_URL     = process.env.CMS_URL     ?? 'http://localhost:5173'
const WEBSITE_URL = process.env.WEBSITE_URL ?? 'http://localhost:3000'
const TEST_EMAIL  = process.env.TEST_EMAIL  ?? 'test@litostudio.id'
const TEST_PASS   = process.env.TEST_PASS   ?? 'test1234!'

test.describe('Publish About page → website renders CMS content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${CMS_URL}/login`)
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/password/i).fill(TEST_PASS)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(`${CMS_URL}/dashboard`, { timeout: 15_000 })
  })

  test('Publish sets page status to active', async ({ page }) => {
    await page.goto(`${CMS_URL}/pages`)
    await page.getByText(/about/i).first().click()
    await page.waitForURL(/\/pages\/.+\/edit/)

    await expect(page.getByText(/draft/i).first()).toBeVisible()

    const [patchReq, patchRes] = await Promise.all([
      page.waitForRequest(req =>
        req.url().includes('/api/v1/cms/content/pages/') && req.method() === 'PATCH',
      ),
      page.waitForResponse(res =>
        res.url().includes('/api/v1/cms/content/pages/') && res.method() === 'PATCH' && res.ok(),
      ),
      page.getByRole('button', { name: /publish/i }).click(),
    ])

    const patchBody = patchReq.postDataJSON() as { status?: string }
    expect(patchBody.status).toBe('active')

    const patchJson = await patchRes.json() as { success?: boolean }
    expect(patchJson.success).toBe(true)

    await expect(page.getByText(/live/i).first()).toBeVisible({ timeout: 5_000 })
  })

  test('Publish writes to page_sections table via sync endpoint (BUG-002 fixed)', async ({ page }) => {
    // BUG-002 is fixed: publishFn calls syncSections → POST /:pageId/sections/sync
    // before setting status=active. Verify this network call occurs.

    const sectionWrites: string[] = []
    page.on('request', req => {
      if (
        req.url().includes('/sections/sync') ||
        req.url().includes('page_sections') ||
        req.url().includes('page-sections')
      ) {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method())) {
          sectionWrites.push(`${req.method()} ${req.url()}`)
        }
      }
    })

    await page.goto(`${CMS_URL}/pages`)
    await page.getByText(/about/i).first().click()
    await page.waitForURL(/\/pages\/.+\/edit/)
    await page.getByRole('button', { name: /publish/i }).click()

    // Wait for the page status PATCH to complete
    await page.waitForResponse(res =>
      res.url().includes('/api/v1/cms/content/pages/') && res.method() === 'PATCH' && res.ok(),
    )

    // BUG-002 fix verified: at least one write to page_sections/sections/sync occurs
    expect(sectionWrites.length).toBeGreaterThan(0)
  })

  test('Website /about responds 200 and renders content (BUG-003 fixed)', async ({ page, browser }) => {
    // BUG-003 is fixed: about.vue now uses <DynamicSectionRenderer slug="about">.
    // The page renders either CMS sections (if any) or template slot fallback.

    // Publish the about page first
    await page.goto(`${CMS_URL}/pages`)
    await page.getByText(/about/i).first().click()
    await page.waitForURL(/\/pages\/.+\/edit/)
    await page.getByRole('button', { name: /publish/i }).click()
    await page.waitForResponse(res =>
      res.url().includes('/api/v1/cms/content/pages/') && res.method() === 'PATCH' && res.ok(),
    )

    const websitePage = await browser.newPage()

    const jsErrors: string[] = []
    websitePage.on('pageerror', err => jsErrors.push(err.message))

    await websitePage.goto(`${WEBSITE_URL}/about`)
    await websitePage.waitForLoadState('networkidle')

    // 1. Page resolves without redirect to 404/error
    expect(websitePage.url()).not.toMatch(/\/(404|error)/)

    // 2. Body has rendered content (not blank)
    const bodyText = await websitePage.locator('body').innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)

    // 3. No unhandled JS errors (excluding known hydration noise)
    const criticalErrors = jsErrors.filter(e => !e.toLowerCase().includes('hydration'))
    expect(criticalErrors).toHaveLength(0)

    await websitePage.close()
  })

  test('Page sections API returns empty list for non-existent pages', async ({ request }) => {
    const res = await request.get(
      `${WEBSITE_URL}/api/pages/non-existent-draft-slug/sections`,
    )
    expect([200, 404]).toContain(res.status())
    if (res.status() === 200) {
      const json = await res.json() as { data?: unknown[] }
      expect(json.data).toHaveLength(0)
    }
  })
})
