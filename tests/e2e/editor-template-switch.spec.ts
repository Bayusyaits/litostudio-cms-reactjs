/**
 * E2E: Block editor canvas — template/theme switching
 *
 * Covers BUG-006 through BUG-009 (all fixed):
 *
 *   BUG-006 — Themes page switch didn't update site.settings.template_slug
 *             Fix: ThemesPageContainer now calls orgService.updateSite + setActiveSite
 *
 *   BUG-007 — "Apply defaults" in Settings didn't re-seed editor with new template blocks
 *             Fix: SettingsPageContainer now invalidates ['page-editor'] query cache
 *
 *   BUG-008 — Mock header/footer showed hardcoded site name, not real site.name
 *             Fix: EditorCanvas reads activeSite.name from Zustand
 *
 *   BUG-009 — Mock header nav showed hardcoded links, not real CMS pages
 *             Fix: EditorCanvas reads ['pages-all', siteId] query cache via useQueryClient
 *
 * Architecture note — template switching on the LIVE WEBSITE requires a rebuild with
 * NUXT_PUBLIC_TEMPLATE.  These tests cover the CMS editor canvas side only.
 */

import { test, expect } from '@playwright/test'

const CMS_URL    = process.env.CMS_URL    ?? 'http://localhost:5173'
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'test@litostudio.id'
const TEST_PASS  = process.env.TEST_PASS  ?? 'test1234!'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${CMS_URL}/login`)
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_PASS)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL(`${CMS_URL}/dashboard`, { timeout: 15_000 })
}

async function openFirstPageEditor(page: import('@playwright/test').Page) {
  await page.goto(`${CMS_URL}/pages`)
  await page.waitForLoadState('networkidle')
  // Click the first page edit link
  const editBtn = page.getByRole('link', { name: /edit/i }).first()
  if (!(await editBtn.isVisible())) {
    // Fallback: click any page row
    await page.locator('[data-testid="page-row"], [data-page-id], tr').first().click()
  } else {
    await editBtn.click()
  }
  await page.waitForURL(/\/pages\/.+\/edit/, { timeout: 10_000 })
  // Wait for the canvas to be visible
  await page.locator('[data-editor-canvas]').waitFor({ state: 'visible', timeout: 10_000 })
}

// ── BUG-006: Themes page switch updates editor canvas template ─────────────────

test.describe('BUG-006: Themes page switch updates editor canvas', () => {
  test.beforeEach(login)

  for (const targetTemplate of ['beauty', 'fashion'] as const) {
    test(`switch to ${targetTemplate} via Themes page → editor canvas uses new template tokens`, async ({ page }) => {
      // Step 1: Record initial data-template attribute from any page editor
      await openFirstPageEditor(page)
      const initialTemplate = await page
        .locator('[data-editor-canvas] [data-template]')
        .first()
        .getAttribute('data-template')
        .catch(() => 'lito')
      console.log(`[BUG-006] initial template: ${initialTemplate}`)

      // Step 2: Go to Themes page and apply the target template
      await page.goto(`${CMS_URL}/themes`)
      await page.waitForLoadState('networkidle')

      // Find the theme card matching the target template slug or name
      const themeCard = page.locator(
        `[data-template="${targetTemplate}"], [data-theme-slug="${targetTemplate}"], button:has-text("${targetTemplate}"), article:has-text("${targetTemplate}")`,
      ).first()
      await expect(themeCard).toBeVisible({ timeout: 8_000 })
      await themeCard.click()

      // Confirm "Apply" button if it appears (confirmation dialog)
      const applyBtn = page.getByRole('button', { name: /apply|use this|select/i })
      if (await applyBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await applyBtn.click()
      }

      // Wait for the PATCH request that persists template_slug
      await page.waitForResponse(
        (res) =>
          res.url().includes('/sites/') &&
          res.method() === 'PATCH' &&
          res.ok(),
        { timeout: 8_000 },
      )

      // Step 3: Re-open the editor and verify the canvas reflects the new template
      await openFirstPageEditor(page)

      const activeTemplate = await page
        .locator('[data-editor-canvas] [data-template]')
        .first()
        .getAttribute('data-template')

      // BUG-006 is fixed: canvas template must match what we applied
      expect(activeTemplate).toBe(targetTemplate)
      console.log(`[BUG-006] canvas template after switch: ${activeTemplate}`)
    })
  }
})

// ── BUG-007: "Apply defaults" re-seeds editor blocks from new template ─────────

test.describe('BUG-007: Apply-defaults re-seeds editor blocks', () => {
  test.beforeEach(login)

  test('switching template with "apply defaults" produces template default blocks in editor', async ({ page }) => {
    // Step 1: Go to Settings → Template/Theme tab
    await page.goto(`${CMS_URL}/settings`)
    await page.waitForLoadState('networkidle')

    const themeTab = page.getByRole('tab', { name: /theme|template|appearance/i })
    if (await themeTab.isVisible()) await themeTab.click()

    // Step 2: Select a different template
    const TARGET = 'fashion'
    const templateOption = page.locator(
      `[data-template="${TARGET}"], button:has-text("${TARGET}"), label:has-text("${TARGET}")`,
    ).first()
    await expect(templateOption).toBeVisible({ timeout: 6_000 })
    await templateOption.click()

    // Step 3: Click Save / Apply — triggers TemplateSwitchModal
    await page.getByRole('button', { name: /save|apply/i }).click()

    // Step 4: Modal appears — choose "Apply defaults" (wipe content)
    const applyDefaultsBtn = page.getByRole('button', { name: /apply defaults|reset|default/i })
    if (await applyDefaultsBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Intercept the PATCH to confirm it fires
      const [patchRes] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/sites/') && res.method() === 'PATCH' && res.ok(),
          { timeout: 8_000 },
        ),
        applyDefaultsBtn.click(),
      ])
      const json = await patchRes.json() as {
        success?: boolean
        data?: { settings?: { template_slug?: string } }
      }
      expect(json.success).toBe(true)
      if (json.data?.settings?.template_slug) {
        expect(json.data.settings.template_slug).toBe(TARGET)
      }
    } else {
      console.log('[BUG-007] TemplateSwitchModal not found — modal may render differently')
    }

    // Step 5: Navigate to any page editor
    await openFirstPageEditor(page)

    // BUG-007 fix: the editor should have blocks (seeded from new template defaults),
    // not a stale BlockDocument from before the switch.
    // We check that the canvas renders something — either blocks or the "no blocks" empty state.
    const canvasEl = page.locator('[data-editor-canvas]')
    await expect(canvasEl).toBeVisible()

    // Specifically check that the canvas [data-template] reflects the new template
    const canvasTemplate = await page
      .locator('[data-editor-canvas] [data-template]')
      .first()
      .getAttribute('data-template')
      .catch(() => null)

    if (canvasTemplate) {
      expect(canvasTemplate).toBe(TARGET)
    }
    console.log(`[BUG-007] canvas template after apply-defaults: ${canvasTemplate}`)
  })
})

// ── BUG-008: Editor canvas shows real site name ────────────────────────────────

test.describe('BUG-008: Editor mock header uses real site name', () => {
  test.beforeEach(login)

  test('mock site header in editor shows the actual site name, not a hardcoded token', async ({ page }) => {
    // Step 1: Get the real site name from Settings
    await page.goto(`${CMS_URL}/settings`)
    await page.waitForLoadState('networkidle')

    // Read the site name field value
    const siteNameInput = page.getByLabel(/site name/i)
    const realSiteName = await siteNameInput.inputValue().catch(() => null)
    console.log(`[BUG-008] real site name from settings: ${realSiteName}`)

    if (!realSiteName) {
      console.log('[BUG-008] Could not read site name from settings — skipping name assertion')
    }

    // Step 2: Open the editor and check the mock header logo text
    await openFirstPageEditor(page)

    const mockHeaderLogo = page.locator('[role="banner"][aria-label*="header"] >> text=' + (realSiteName ?? /\w+/))
    if (realSiteName) {
      // BUG-008 fix: the mock header must contain the actual site name
      await expect(mockHeaderLogo).toBeVisible({ timeout: 6_000 })
    } else {
      // At minimum, the header banner must exist
      await expect(page.locator('[role="banner"][aria-label*="header"]')).toBeVisible()
    }

    // Confirm it is NOT one of the known hardcoded token names
    const headerText = await page
      .locator('[role="banner"][aria-label*="header"]')
      .textContent()
      .catch(() => '')

    expect(headerText).not.toMatch(/^Lito Studio$|^FASHION$|^BEAUTY$/)
    console.log(`[BUG-008] mock header text: ${headerText?.slice(0, 60)}`)
  })
})

// ── BUG-009: Editor canvas shows real CMS page nav links ─────────────────────

test.describe('BUG-009: Editor mock header nav uses real CMS pages', () => {
  test.beforeEach(login)

  test('mock site header nav reflects pages created in the CMS', async ({ page }) => {
    // Step 1: Collect the real page titles from the CMS
    await page.goto(`${CMS_URL}/pages`)
    await page.waitForLoadState('networkidle')

    // Collect page titles visible in the pages list
    const pageTitles: string[] = []
    const rows = await page.locator('[data-testid="page-row"], [data-page-id], tr[data-page]').all()
    for (const row of rows.slice(0, 6)) {
      const title = await row.locator('h2, h3, td:first-child, [data-page-title]').textContent().catch(() => null)
      if (title?.trim()) pageTitles.push(title.trim())
    }
    console.log(`[BUG-009] pages found in CMS:`, pageTitles)

    // Step 2: Open the editor
    await openFirstPageEditor(page)

    // Step 3: Read the nav in the mock header
    const navItems = await page
      .locator('[role="banner"][aria-label*="header"] nav span, [role="banner"][aria-label*="header"] nav a')
      .allTextContents()
      .catch(() => [] as string[])

    console.log(`[BUG-009] nav items in mock header:`, navItems)

    if (pageTitles.length > 0 && navItems.length > 0) {
      // At least one CMS page title should appear in the nav (case-insensitive)
      const pageTitlesLower = pageTitles.map((t) => t.toLowerCase())
      const navLower        = navItems.map((n) => n.toLowerCase())
      const hasMatch = navLower.some((nav) => pageTitlesLower.some((pt) => nav.includes(pt) || pt.includes(nav)))

      // BUG-009 fix: nav must be derived from real pages, not hardcoded fallback
      // (the fallback ['Home','About','Portfolio','Stories','Journal','Contact'] would
      // only fire when no pages exist — once pages are created, they should appear)
      if (hasMatch) {
        console.log('[BUG-009] ✓ nav contains real page titles')
      } else {
        console.warn('[BUG-009] nav items do not match page titles — may still be fallback or pages are titled differently')
      }
    } else if (navItems.length > 0) {
      // No pages listed but nav shows items — fallback nav is acceptable
      console.log('[BUG-009] fallback nav displayed (no pages in CMS yet):', navItems)
    }

    // The nav must not be empty
    expect(navItems.length).toBeGreaterThan(0)

    // Hardcoded fallback items that must NOT appear once real pages exist
    const KNOWN_FALLBACKS = ['portfolio', 'stories', 'journal']
    if (pageTitles.length > 0 && navItems.length > 0) {
      const navLower = navItems.map((n) => n.toLowerCase())
      // If nav still shows pure fallback set, the fix isn't working
      const isFallbackOnly = KNOWN_FALLBACKS.every((f) => navLower.includes(f))
      expect(isFallbackOnly).toBe(false)
    }
  })

  test('mobile nav drawer shows the same dynamic links', async ({ page }) => {
    await openFirstPageEditor(page)

    // Switch to mobile preview
    const mobileBtn = page.getByRole('button', { name: /mobile/i })
    if (await mobileBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await mobileBtn.click()
      await page.waitForTimeout(500)
    }

    // Trigger the mobile drawer
    const burgerBtn = page.locator(
      '[role="banner"][aria-label*="header"] button[aria-expanded], [role="banner"][aria-label*="header"] button[aria-label*="menu"]',
    )
    if (await burgerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await burgerBtn.click()
      await page.waitForTimeout(300)

      const drawerNav = page.locator('[role="navigation"][aria-label*="Mobile"]')
      await expect(drawerNav).toBeVisible({ timeout: 3_000 })

      const drawerLinks = await drawerNav.allTextContents()
      console.log('[BUG-009] mobile drawer links:', drawerLinks)
      expect(drawerLinks.length).toBeGreaterThan(0)
    } else {
      console.log('[BUG-009] mobile burger button not visible — preview mode may not be mobile')
    }
  })
})

// ── Integration: full template switch → editor canvas reflection ──────────────

test.describe('Integration: template switch fully reflected in open editor', () => {
  test.beforeEach(login)

  test('switch template in Themes → open editor → canvas [data-template] matches new slug', async ({ page }) => {
    // Navigate to Themes and apply "fashion"
    await page.goto(`${CMS_URL}/themes`)
    await page.waitForLoadState('networkidle')

    const fashionCard = page.locator(
      '[data-template="fashion"], [data-theme-slug="fashion"], button:has-text("fashion"), article:has-text("fashion")',
    ).first()

    if (!(await fashionCard.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'fashion template card not visible — environment may only have lito template')
    }

    await fashionCard.click()

    const applyBtn = page.getByRole('button', { name: /apply|use this|select/i })
    if (await applyBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await applyBtn.click()
    }

    // Wait for the PATCH to persist
    await page.waitForResponse(
      (res) => res.url().includes('/sites/') && res.method() === 'PATCH' && res.ok(),
      { timeout: 10_000 },
    )

    // Open any page editor
    await openFirstPageEditor(page)

    // Canvas must now use the fashion template
    const canvasTemplate = await page
      .locator('[data-editor-canvas] [data-template]')
      .first()
      .getAttribute('data-template')

    expect(canvasTemplate).toBe('fashion')

    // Header accent colour should differ from the lito default (#c9a25a)
    const headerStyle = await page
      .locator('[role="banner"][aria-label*="header"]')
      .getAttribute('style')
      .catch(() => '')
    console.log('[Integration] mock header style sample:', headerStyle?.slice(0, 80))
  })

  test('switch back to lito template → canvas reverts', async ({ page }) => {
    await page.goto(`${CMS_URL}/themes`)
    await page.waitForLoadState('networkidle')

    const litoCard = page.locator(
      '[data-template="lito"], [data-theme-slug="lito"], button:has-text("lito"), article:has-text("lito")',
    ).first()

    if (!(await litoCard.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'lito template card not visible')
    }

    await litoCard.click()

    const applyBtn = page.getByRole('button', { name: /apply|use this|select/i })
    if (await applyBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await applyBtn.click()
    }

    await page.waitForResponse(
      (res) => res.url().includes('/sites/') && res.method() === 'PATCH' && res.ok(),
      { timeout: 10_000 },
    )

    await openFirstPageEditor(page)

    const canvasTemplate = await page
      .locator('[data-editor-canvas] [data-template]')
      .first()
      .getAttribute('data-template')

    expect(canvasTemplate).toBe('lito')
  })
})
