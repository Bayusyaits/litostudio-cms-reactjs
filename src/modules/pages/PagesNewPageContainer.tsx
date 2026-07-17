/**
 * PagesNewPageContainer — template-aware page creation wizard.
 */

import { useState, useId, useRef } from 'react'
import { useNavigate }       from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTemplateManifest, Select } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { pagesService }      from '@litostudio/ui-cms'
import type { PageDefinition } from '@litostudio/templates'
import { FileText, ChevronLeft, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTracking } from '@/tracking'
import type { PageType } from '@/tracking/types'
import { FOOTER_ONLY_SLUGS } from './PagesPageView'

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export default function PagesNewPageContainer() {
  const navigate           = useNavigate()
  const { activeSite }     = useWebsiteStore()
  const { manifest, templateSlug } = useTemplateManifest()
  const { trackPageCreated } = useTracking()

  const labelId = useId()

  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [customSlug,   setCustomSlug]   = useState('')
  const [title,        setTitle]        = useState('')
  const [parentId,     setParentId]     = useState<string>('')
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [error,        setError]        = useState<string | null>(null)

  const allPagesQuery = useQuery({
    queryKey: ['pages-all', activeSite?.id ?? ''],
    queryFn:  () => pagesService.getAllForSite(activeSite!.id),
    enabled:  !!activeSite?.id,
    staleTime: 5 * 60 * 1000,
  })
  const allPages = allPagesQuery.data ?? []
  // Bug fix (2026-07-15): preset cards used to stay fully clickable even when
  // their slug already existed on this site — the user could pick "Campaign",
  // fill in a title, and only THEN find out (async, after the fact) that it
  // was a dead end. Disabling the card up front, from the same `allPages`
  // list already used for the conflict banner/parent picker, removes that
  // dead-end path entirely.
  const takenSlugs = new Set(allPages.map((p) => p.slug))

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!activeSite) throw new Error('No active site')
      const slug = selectedSlug || slugify(customSlug)
      if (!slug) throw new Error('Enter a page slug')
      const check = await pagesService.checkSlug(activeSite.id, slug)
      if (!check.available) throw new Error(`Slug "/${slug}" is already taken. Choose a different name.`)
      return pagesService.create({
        site_id:   activeSite.id,
        slug,
        template:  templateSlug ?? 'lito',
        status:    'draft',
        parent_id: parentId || null,
        translations: title ? [{ locale: 'id', title }] : undefined,
      })
    },
    onSuccess: async (page) => {
      if (activeSite) {
        trackPageCreated({
          site_id:  activeSite.id,
          org_id:   activeSite.organization_id,
          page_id:  page.id,
          page_type: (page.slug as PageType) ?? 'custom',
        })
      }
      // Footer-only pages (2026-07-16): Privacy Policy / Terms — and FAQ,
      // matching the existing PagesPageView.tsx FOOTER_ONLY_SLUGS policy —
      // must always end up in the footer nav, not sit invisible. POST
      // /cms/content/pages doesn't accept is_footer at creation time (only
      // PATCH does), so this fires the same toggleFooter PATCH the Pages
      // list itself uses, right after create, before the editor opens.
      // Best-effort: a failure here shouldn't block opening the new page —
      // the editor still shows the Header/Footer toggles so it can be set
      // manually if this call fails.
      if (FOOTER_ONLY_SLUGS.includes(page.slug)) {
        try { await pagesService.toggleFooter(page.id, true) }
        catch { /* non-fatal — editor's own toggle remains available */ }
      }
      navigate(`/pages/${page.id}/edit`, { replace: true })
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Failed to create page'),
  })

  // Audit fix (2026-07-17): checkSlug had no protection against out-of-order
  // responses — switching presets quickly (or a slow network) could let an
  // older request's result land AFTER a newer one and overwrite it with a
  // stale available/taken state for the wrong slug. A monotonically
  // increasing token, checked before committing each response, makes only
  // the most recently *fired* request allowed to update state.
  const checkSlugToken = useRef(0)

  // Bug fix (2026-07-15): title used to only sync on the FIRST preset click
  // (guarded by `if (!title)`) — after that, `title` was always non-empty,
  // so re-selecting a different card never updated it again, leaving the
  // field stuck on whatever was picked first. Track real user edits instead
  // of "is it empty" so the title keeps following the selected preset until
  // the user actually types something themselves.
  const titleEditedByUser = useRef(false)

  const checkSlug = (slug: string) => {
    if (!slug || !activeSite) return
    const token = ++checkSlugToken.current
    setSlugChecking(true)
    setSlugAvailable(null)
    pagesService.checkSlug(activeSite.id, slug)
      .then((r) => { if (checkSlugToken.current === token) setSlugAvailable(r.available) })
      .catch(() => { if (checkSlugToken.current === token) setSlugAvailable(null) })
      .finally(() => { if (checkSlugToken.current === token) setSlugChecking(false) })
  }

  const presets: PageDefinition[] = manifest?.pages ?? [
    { slug: 'home',    label: 'Home',    required: true  },
    { slug: 'about',   label: 'About',   required: false },
    { slug: 'contact', label: 'Contact', required: false },
  ]

  // Parent/child restriction (2026-07-15, New Page screen fix): a manifest
  // "opts in" to this by declaring canBeParent/canHaveParent on at least one
  // of its page presets (see packages/templates/src/types.ts) — templates
  // that haven't been updated yet (no preset declares either flag) keep the
  // old show-every-page / always-show-the-field behavior so they don't
  // regress. Fashion opted in: Home + the listing/system-route presets
  // (Collection, Products, Campaign, Journal, News) are excluded both ways;
  // About/Brand Story/Contact — and Custom, handled separately below — are
  // the only ones that can be a parent or have one.
  const presetBySlug = new Map(presets.map((p) => [p.slug, p]))
  const parentGatingActive = presets.some((p) => p.canBeParent !== undefined || p.canHaveParent !== undefined)

  const parentOptionPages = parentGatingActive
    ? allPages.filter((p) => {
        const preset = presetBySlug.get(p.slug)
        // No matching preset means this page was created via "Custom" —
        // Custom is parent-eligible, so an unmatched slug stays included.
        return preset ? preset.canBeParent !== false : true
      })
    : allPages

  const handleSelectPreset = (slug: string, label: string) => {
    setSelectedSlug(slug); setCustomSlug(''); setSlugAvailable(null)
    if (!titleEditedByUser.current) setTitle(label)
    // A page type that can't have a parent shouldn't silently submit with a
    // parentId left over from a previous Custom/eligible selection.
    const preset = presetBySlug.get(slug)
    if (parentGatingActive && preset?.canHaveParent === false) setParentId('')
    setError(null); checkSlug(slug)
  }

  const handleCustomSlugBlur = () => checkSlug(slugify(customSlug))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const slug = selectedSlug || slugify(customSlug)
    if (!slug) { setError('Choose a page type or enter a slug'); return }
    if (slugAvailable === false) { setError(`Slug "/${slug}" is already taken.`); return }
    setError(null)
    createMutation.mutate()
  }

  const currentSlug = selectedSlug || slugify(customSlug)
  const slugFeedback = slugChecking ? 'checking' : slugAvailable === true ? 'available' : slugAvailable === false ? 'taken' : null

  // Audit fix (2026-07-17): "slug already taken" used to be a dead end — no
  // way from this screen to actually reach the page that already owns the
  // slug. For a site that already has its default pages provisioned (e.g.
  // Products/Campaign/Privacy Policy seeded during setup), EVERY preset
  // click hits this same message with no next step, which reads as "I can
  // never create any page" even though the fix is just "open the existing
  // one." allPages is already fetched for the parent picker above — reuse
  // it here instead of firing a second lookup.
  const conflictingPage = slugAvailable === false
    ? allPages.find((p) => p.slug === currentSlug) ?? null
    : null

  // Custom (no preset selected) is always parent-eligible; a matched preset
  // must not have explicitly opted out via canHaveParent: false.
  const selectedPreset = selectedSlug ? presetBySlug.get(selectedSlug) : undefined
  const showParentField = !parentGatingActive || !selectedPreset || selectedPreset.canHaveParent !== false

  return (
    <div className="flex-1 overflow-y-auto px-7 py-6 max-w-[680px]">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate('/pages')}
        className="flex items-center gap-[6px] bg-transparent border-none cursor-pointer font-body text-[13px] text-[var(--text-muted)] mb-6 p-0 hover:text-[var(--text-primary)]"
      >
        <ChevronLeft size={14} />
        Back to pages
      </button>

      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-[22px] font-semibold text-[var(--text-primary)]">New Page</h1>
        {manifest ? (
          <p className="font-body text-[13px] text-[var(--text-muted)] mt-1">
            Creating a page for the <strong className="text-[var(--text-primary)]">{manifest.name}</strong> template
          </p>
        ) : (
          <p className="font-body text-[13px] text-[var(--text-muted)] mt-1">
            No template selected — you can enter a custom slug below
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Page type picker */}
        <div>
          <p
            id={labelId}
            className="font-body text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] mb-[10px]"
          >
            {manifest ? 'Choose a page type' : 'Common page types'}
          </p>
          <div
            role="group"
            aria-labelledby={labelId}
            className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]"
          >
            {presets.map((p) => {
              const active = selectedSlug === p.slug
              const takenSlug = takenSlugs.has(p.slug)
              return (
                <button
                  key={p.slug}
                  type="button"
                  disabled={takenSlug}
                  aria-disabled={takenSlug}
                  title={takenSlug ? `/${p.slug} already exists on this site` : undefined}
                  onClick={() => { if (!takenSlug) handleSelectPreset(p.slug, p.label) }}
                  aria-pressed={active}
                  className={`flex flex-col items-start px-[14px] py-[10px] rounded-[10px] relative border-2 transition-[border-color,background] duration-150 ${
                    takenSlug
                      ? 'border-[var(--lito-border)] bg-[var(--cms-card-bg)] opacity-40 cursor-not-allowed'
                      : active && slugAvailable === false
                      ? 'border-[var(--cms-danger)] bg-transparent cursor-pointer'
                      : active
                      ? 'border-[var(--lito-teal)] bg-[rgba(26,74,90,0.06)] cursor-pointer'
                      : 'border-[var(--lito-border)] bg-[var(--cms-card-bg)] cursor-pointer'
                  }`}
                >
                  <FileText
                    size={16}
                    className={`mb-[6px] ${takenSlug ? 'text-[var(--text-muted)]' : active ? 'text-[var(--lito-teal)]' : 'text-[var(--text-muted)]'}`}
                  />
                  <span className={`font-body text-[13px] font-medium ${takenSlug ? 'text-[var(--text-muted)]' : active ? 'text-[var(--lito-teal)]' : 'text-[var(--text-primary)]'}`}>
                    {p.label}
                  </span>
                  <code className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5">/{p.slug}</code>
                  {takenSlug ? (
                    <span className="absolute top-[6px] right-[6px]">
                      <AlertCircle size={12} className="text-[var(--text-muted)]" />
                    </span>
                  ) : active && slugFeedback && (
                    <span className="absolute top-[6px] right-[6px]">
                      {slugFeedback === 'available' && <CheckCircle2 size={12} className="text-[var(--lito-teal)]" />}
                      {slugFeedback === 'taken'     && <AlertCircle  size={12} className="text-[var(--cms-danger)]" />}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Custom */}
            <button
              type="button"
              onClick={() => { setSelectedSlug(''); setSlugAvailable(null); setError(null) }}
              aria-pressed={!selectedSlug}
              className={`flex flex-col items-start px-[14px] py-[10px] rounded-[10px] border-2 cursor-pointer transition-[border-color,background] duration-150 ${
                !selectedSlug
                  ? 'border-[var(--lito-gold)] bg-[rgba(212,168,83,0.06)]'
                  : 'border-[var(--lito-border)] bg-[var(--cms-card-bg)]'
              }`}
            >
              <Plus
                size={16}
                className={`mb-[6px] ${!selectedSlug ? 'text-[var(--lito-gold-deep)]' : 'text-[var(--text-muted)]'}`}
              />
              <span className={`font-body text-[13px] font-medium ${!selectedSlug ? 'text-[var(--lito-gold-deep)]' : 'text-[var(--text-primary)]'}`}>
                Custom
              </span>
              <span className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">any slug</span>
            </button>
          </div>
        </div>

        {/* Slug taken alert for preset */}
        {selectedSlug && slugAvailable === false && (
          <div className="flex items-center gap-2 bg-[var(--cms-danger-bg)] border border-[var(--cms-danger)] rounded-lg px-3 py-2">
            <AlertCircle size={14} className="text-[var(--cms-danger)] shrink-0" />
            <span className="font-body text-[13px] text-[var(--cms-danger)]">
              Page <code>/{selectedSlug}</code> already exists.{' '}
              {conflictingPage ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/pages/${conflictingPage.id}/edit`)}
                    className="underline font-semibold bg-transparent border-none p-0 cursor-pointer text-[var(--cms-danger)]"
                  >
                    Edit the existing {conflictingPage.title ?? conflictingPage.slug} page
                  </button>
                  {' '}instead, or choose a different type / use Custom.
                </>
              ) : (
                'Choose a different type or use the Custom option.'
              )}
            </span>
          </div>
        )}

        {/* Custom slug input */}
        {!selectedSlug && (
          <div className="flex flex-col gap-[6px]">
            <label className="font-body text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Page Slug *
            </label>
            <div className="relative">
              <input
                type="text"
                value={customSlug}
                onChange={(e) => { setCustomSlug(e.target.value); setSlugAvailable(null); setError(null) }}
                onBlur={handleCustomSlugBlur}
                placeholder="e.g. faq or our-team"
                autoFocus
                className={`w-full box-border font-body text-[13px] px-3 pr-9 py-2 bg-[var(--cms-card-bg)] rounded-lg text-[var(--text-primary)] outline-none border ${
                  slugAvailable === false
                    ? 'border-[var(--cms-danger)]'
                    : slugAvailable === true
                    ? 'border-[var(--lito-teal)]'
                    : 'border-[var(--lito-border)]'
                }`}
              />
              {slugFeedback && (
                <span className="absolute right-[10px] top-1/2 -translate-y-1/2">
                  {slugFeedback === 'available' && <CheckCircle2 size={15} className="text-[var(--lito-teal)]" />}
                  {slugFeedback === 'taken'     && <AlertCircle  size={15} className="text-[var(--cms-danger)]" />}
                  {slugFeedback === 'checking'  && <span className="text-[11px] text-[var(--text-muted)]">…</span>}
                </span>
              )}
            </div>
            {customSlug && (
              <p className={`font-body text-xs ${slugAvailable === false ? 'text-[var(--cms-danger)]' : 'text-[var(--text-muted)]'}`}>
                {slugAvailable === false ? (
                  <>
                    "/{slugify(customSlug)}" is already taken
                    {conflictingPage ? (
                      <>
                        {' — '}
                        <button
                          type="button"
                          onClick={() => navigate(`/pages/${conflictingPage.id}/edit`)}
                          className="underline font-semibold bg-transparent border-none p-0 cursor-pointer text-[var(--cms-danger)]"
                        >
                          edit the existing page
                        </button>
                        {' '}instead, or choose a different slug.
                      </>
                    ) : (
                      ' — choose a different slug.'
                    )}
                  </>
                ) : (
                  `URL: /${slugify(customSlug)}`
                )}
              </p>
            )}
          </div>
        )}

        {/* Page title */}
        <div className="flex flex-col gap-[6px]">
          <label className="font-body text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Page Title <span className="font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => { titleEditedByUser.current = true; setTitle(e.target.value) }}
            placeholder="e.g. Our Services"
            className="font-body text-[13px] px-3 py-2 bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-lg text-[var(--text-primary)] outline-none"
          />
        </div>

        {/* Parent picker — hidden entirely for page types not designed to be
            nested (see parentGatingActive/showParentField above); the
            dropdown itself, when shown, only lists pages of a type that's
            designed to be a parent (parentOptionPages), not every page on
            the site. */}
        {showParentField && (
        <div className="flex flex-col gap-[6px]">
          <label className="font-body text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Parent Page <span className="font-normal normal-case tracking-normal">(optional — for nested menus)</span>
          </label>
          <Select
            value={parentId}
            onChange={setParentId}
            options={[
              { value: '', label: '— None (root level) —' },
              ...parentOptionPages.map((p) => ({ value: p.id, label: `${p.title ?? p.slug} (/${p.slug})` })),
            ]}
          />
          {parentId && (
            <p className="font-body text-xs text-[var(--text-muted)]">
              Will appear as a child under <strong>{allPages.find(p => p.id === parentId)?.title ?? allPages.find(p => p.id === parentId)?.slug}</strong> in the navigation.
            </p>
          )}
        </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-[var(--cms-danger-bg)] border border-[var(--cms-danger)] rounded-lg px-3 py-2">
            <AlertCircle size={14} className="text-[var(--cms-danger)] shrink-0" />
            <span className="font-body text-[13px] text-[var(--cms-danger)]">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-[10px] items-center">
          <button
            type="submit"
            disabled={createMutation.isPending || slugAvailable === false}
            className="cms-btn cms-btn-primary"
          >
            {createMutation.isPending ? 'Creating…' : 'Create & Open Editor'}
          </button>
          <button type="button" onClick={() => navigate('/pages')} className="cms-btn">
            Cancel
          </button>
          {currentSlug && (
            <span className="font-body text-xs text-[var(--text-muted)] ml-1">
              → <code className="font-mono">/{currentSlug}</code>
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
