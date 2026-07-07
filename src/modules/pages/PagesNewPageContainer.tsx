/**
 * PagesNewPageContainer — template-aware page creation wizard.
 */

import { useState, useId } from 'react'
import { useNavigate }       from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTemplateManifest } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { pagesService }      from '@litostudio/ui-cms'
import { FileText, ChevronLeft, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTracking } from '@/tracking'
import type { PageType } from '@/tracking/types'

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
    onSuccess: (page) => {
      if (activeSite) {
        trackPageCreated({
          site_id:  activeSite.id,
          org_id:   activeSite.organization_id,
          page_id:  page.id,
          page_type: (page.slug as PageType) ?? 'custom',
        })
      }
      navigate(`/pages/${page.id}/edit`, { replace: true })
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : 'Failed to create page'),
  })

  const checkSlug = (slug: string) => {
    if (!slug || !activeSite) return
    setSlugChecking(true)
    setSlugAvailable(null)
    pagesService.checkSlug(activeSite.id, slug)
      .then((r) => setSlugAvailable(r.available))
      .catch(() => setSlugAvailable(null))
      .finally(() => setSlugChecking(false))
  }

  const handleSelectPreset = (slug: string, label: string) => {
    setSelectedSlug(slug); setCustomSlug(''); setSlugAvailable(null)
    if (!title) setTitle(label)
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

  const presets = manifest?.pages ?? [
    { slug: 'home',    label: 'Home' },
    { slug: 'about',   label: 'About' },
    { slug: 'contact', label: 'Contact' },
  ]

  const currentSlug = selectedSlug || slugify(customSlug)
  const slugFeedback = slugChecking ? 'checking' : slugAvailable === true ? 'available' : slugAvailable === false ? 'taken' : null

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
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => handleSelectPreset(p.slug, p.label)}
                  aria-pressed={active}
                  className={`flex flex-col items-start px-[14px] py-[10px] rounded-[10px] relative border-2 cursor-pointer transition-[border-color,background] duration-150 ${
                    active && slugAvailable === false
                      ? 'border-[var(--cms-danger)] bg-transparent'
                      : active
                      ? 'border-[var(--lito-teal)] bg-[rgba(26,74,90,0.06)]'
                      : 'border-[var(--lito-border)] bg-[var(--cms-card-bg)]'
                  }`}
                >
                  <FileText
                    size={16}
                    className={`mb-[6px] ${active ? 'text-[var(--lito-teal)]' : 'text-[var(--text-muted)]'}`}
                  />
                  <span className={`font-body text-[13px] font-medium ${active ? 'text-[var(--lito-teal)]' : 'text-[var(--text-primary)]'}`}>
                    {p.label}
                  </span>
                  <code className="font-mono text-[11px] text-[var(--text-muted)] mt-0.5">/{p.slug}</code>
                  {active && slugFeedback && (
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
              Page <code>/{selectedSlug}</code> already exists. Choose a different type or use the Custom option.
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
                {slugAvailable === false
                  ? `"/${slugify(customSlug)}" is already taken — choose a different slug.`
                  : `URL: /${slugify(customSlug)}`}
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
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Our Services"
            className="font-body text-[13px] px-3 py-2 bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-lg text-[var(--text-primary)] outline-none"
          />
        </div>

        {/* Parent picker */}
        <div className="flex flex-col gap-[6px]">
          <label className="font-body text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Parent Page <span className="font-normal normal-case tracking-normal">(optional — for nested menus)</span>
          </label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="font-body text-[13px] px-3 py-2 bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-lg text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="">— None (root level) —</option>
            {allPages.map((p) => (
              <option key={p.id} value={p.id}>{p.title ?? p.slug} (/{p.slug})</option>
            ))}
          </select>
          {parentId && (
            <p className="font-body text-xs text-[var(--text-muted)]">
              Will appear as a child under <strong>{allPages.find(p => p.id === parentId)?.title ?? allPages.find(p => p.id === parentId)?.slug}</strong> in the navigation.
            </p>
          )}
        </div>

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
