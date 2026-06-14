/**
 * HeroFormModal — create or edit a hero slide.
 *
 * Hero slides are stored in the unified content_items table (content_type='hero').
 * Field mapping from the old hero_slides schema:
 *   image_url  → cover_image
 *   href       → extra.href
 *   location   → location  (direct column on content_items)
 *   region     → region    (direct column on content_items)
 *
 * Translation mapping (content_translations):
 *   description → excerpt
 *   cta_label   → extra.cta_label
 *   category    → extra.category
 */
import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { ImageUploader } from '@/components/molecules/ImageUploader'
import type { HeroSlide, HeroSlideCreateRequest, HeroSlideUpdateRequest, HeroStatus } from '@/types/content.types'
import { heroService } from '@/services/content.service'
import { draftMediaStore } from '@/stores/draftMedia.store'

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  slide?: HeroSlide          // undefined = create mode
  siteId: string
  onClose: () => void
  onSaved: () => void
}

interface TranslationDraft {
  locale: string
  title: string
  subtitle: string
  /** Displayed as "Description" in the form; stored as excerpt in content_translations */
  description: string
  cta_label: string
  category: string
}

const LOCALES = ['id', 'en'] as const
const STATUS_OPTIONS: HeroStatus[] = ['draft', 'active', 'inactive', 'archived', 'suspended']

function emptyTranslation(locale: string): TranslationDraft {
  return { locale, title: '', subtitle: '', description: '', cta_label: '', category: '' }
}

function toTranslationDraft(t?: HeroSlide['translations'][number]): TranslationDraft {
  if (!t) return emptyTranslation('id')
  return {
    locale:      t.locale,
    title:       t.title ?? '',
    subtitle:    t.subtitle ?? '',
    // content_translations stores description as 'excerpt'
    description: t.excerpt ?? '',
    // cta_label and category live in content_translations.extra
    cta_label:   t.extra?.cta_label ?? '',
    category:    t.extra?.category ?? '',
  }
}

/** Generate a unique slug for new hero slides (required by content_items). */
function generateHeroSlug(sortOrder: number): string {
  return `hero-${sortOrder}-${Date.now()}`
}

// ── Component ────────────────────────────────────────────────────────────────

export function HeroFormModal({ slide, siteId, onClose, onSaved }: Props) {
  const isEdit = !!slide

  // Core fields — mapped to content_items columns
  const [coverImage, setCoverImage] = useState<string>(slide?.cover_image ?? '')
  const [href,       setHref]       = useState<string>(slide?.extra?.href ?? '')
  const [location,   setLocation]   = useState<string>(slide?.location ?? '')
  const [region,     setRegion]     = useState<string>(slide?.region ?? '')
  const [sortOrder,  setSortOrder]  = useState<number>(slide?.sort_order ?? 0)
  const [status,     setStatus]     = useState<HeroStatus>(slide?.status ?? 'draft')

  // Translations keyed by locale
  const [translations, setTranslations] = useState<Record<string, TranslationDraft>>(() => {
    const map: Record<string, TranslationDraft> = {}
    for (const locale of LOCALES) {
      const existing = slide?.translations?.find(t => t.locale === locale)
      map[locale] = toTranslationDraft(existing)
    }
    return map
  })
  const [activeLocale, setActiveLocale] = useState<string>('id')

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  // Sync when slide prop changes (e.g. reopen for different slide)
  useEffect(() => {
    if (slide) {
      setCoverImage(slide.cover_image ?? '')
      setHref(slide.extra?.href ?? '')
      setLocation(slide.location ?? '')
      setRegion(slide.region ?? '')
      setSortOrder(slide.sort_order ?? 0)
      setStatus(slide.status ?? 'draft')
      const map: Record<string, TranslationDraft> = {}
      for (const locale of LOCALES) {
        const existing = slide.translations?.find(t => t.locale === locale)
        map[locale] = toTranslationDraft(existing)
      }
      setTranslations(map)
    }
  }, [slide?.id])

  function updateTranslation(locale: string, field: keyof TranslationDraft, value: string) {
    setTranslations(prev => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }))
  }

  async function handleSave() {
    setError(null)
    if (!coverImage.trim()) {
      setError('Image is required.')
      return
    }
    setSaving(true)
    try {
      // Resolve any blob: URL to a real CDN URL before saving
      const resolvedCoverImage = await draftMediaStore.resolveUrl(coverImage)

      if (isEdit) {
        // 1. Update core fields — mapped to content_items columns
        const updatePayload: HeroSlideUpdateRequest = {
          cover_image: resolvedCoverImage,
          location:    location || undefined,
          region:      region || undefined,
          sort_order:  sortOrder,
          status,
          // href stored in extra JSONB
          extra: { ...(slide!.extra ?? {}), href: href || undefined },
        }
        await heroService.update(slide!.id, updatePayload)

        // 2. Upsert translations — mapped to content_translations columns
        for (const locale of LOCALES) {
          const t = translations[locale]
          await heroService.upsertTranslation(slide!.id, locale, {
            title:    t.title,
            subtitle: t.subtitle,
            // description form field → excerpt column
            excerpt:  t.description,
            // cta_label + category → extra JSONB in content_translations
            extra: { cta_label: t.cta_label, category: t.category },
          })
        }
      } else {
        // 1. Create slide — mapped to content_items POST body
        // slug is required; generate a unique one for hero slides
        const createPayload: HeroSlideCreateRequest = {
          site_id:     siteId,
          slug:        generateHeroSlug(sortOrder),
          cover_image: resolvedCoverImage,
          location:    location || undefined,
          region:      region || undefined,
          sort_order:  sortOrder,
          status,
          extra: href ? { href } : undefined,
        }
        // content_type:'hero' is injected automatically by createContentItemService
        const created = await heroService.create(createPayload)
        if (!created) throw new Error('Create returned no data')

        // 2. Upsert translations
        const createdId = (created as { id: string }).id
        for (const locale of LOCALES) {
          const t = translations[locale]
          if (t.title || t.subtitle || t.description || t.cta_label) {
            await heroService.upsertTranslation(createdId, locale, {
              title:    t.title,
              subtitle: t.subtitle,
              excerpt:  t.description,
              extra: { cta_label: t.cta_label, category: t.category },
            })
          }
        }
      }
      // Sync local state to the resolved CDN URL (avoids stale blob on re-open)
      setCoverImage(resolvedCoverImage)
      onSaved()
    } catch (err) {
      console.error('[HeroFormModal] save error', err)
      setError(err instanceof Error ? err.message : 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const t = translations[activeLocale] ?? emptyTranslation(activeLocale)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edit Hero Slide' : 'New Hero Slide'}
    >
      <div className="bg-[var(--cms-card-bg)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--lito-border)]">
          <h2 className="font-heading text-lg font-semibold text-[var(--text-primary)]">
            {isEdit ? 'Edit Slide' : 'New Slide'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--cms-nav-hover)] text-[var(--text-muted)]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image */}
          <div>
            <label className="block font-body text-sm font-medium text-[var(--text-primary)] mb-2">
              Slide Image <span className="text-red-500">*</span>
            </label>
            <ImageUploader
              value={coverImage || null}
              onChange={(url) => setCoverImage(url ?? '')}
              folder="hero"
            />
          </div>

          {/* Core fields row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm font-medium text-[var(--text-primary)] mb-1">
                Link URL (href)
              </label>
              <input
                type="url"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="https://example.com/page"
                className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-primary)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lito-teal)]"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-[var(--text-primary)] mb-1">
                Sort Order
              </label>
              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-primary)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lito-teal)]"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-[var(--text-primary)] mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bali, Indonesia"
                className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-primary)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lito-teal)]"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-[var(--text-primary)] mb-1">
                Region
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Southeast Asia"
                className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-primary)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lito-teal)]"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block font-body text-sm font-medium text-[var(--text-primary)] mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as HeroStatus)}
              className="px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-primary)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lito-teal)]"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Translations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-body text-sm font-medium text-[var(--text-primary)]">Translations</span>
              <div className="flex gap-1">
                {LOCALES.map(locale => (
                  <button
                    key={locale}
                    onClick={() => setActiveLocale(locale)}
                    className={`px-2.5 py-1 rounded-md font-body text-xs font-medium transition-colors ${
                      activeLocale === locale
                        ? 'bg-[var(--lito-teal)] text-white'
                        : 'bg-[var(--cms-nav-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {locale.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-body text-xs text-[var(--text-muted)] mb-1">Title</label>
                <input
                  type="text"
                  value={t.title}
                  onChange={(e) => updateTranslation(activeLocale, 'title', e.target.value)}
                  placeholder="Slide headline"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-primary)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lito-teal)]"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-[var(--text-muted)] mb-1">Subtitle</label>
                <input
                  type="text"
                  value={t.subtitle}
                  onChange={(e) => updateTranslation(activeLocale, 'subtitle', e.target.value)}
                  placeholder="Supporting text"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-primary)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lito-teal)]"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-[var(--text-muted)] mb-1">Description</label>
                <textarea
                  value={t.description}
                  onChange={(e) => updateTranslation(activeLocale, 'description', e.target.value)}
                  placeholder="Optional longer description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-primary)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lito-teal)] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-body text-xs text-[var(--text-muted)] mb-1">CTA Label</label>
                  <input
                    type="text"
                    value={t.cta_label}
                    onChange={(e) => updateTranslation(activeLocale, 'cta_label', e.target.value)}
                    placeholder="e.g. Explore Now"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-primary)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lito-teal)]"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs text-[var(--text-muted)] mb-1">Category</label>
                  <input
                    type="text"
                    value={t.category}
                    onChange={(e) => updateTranslation(activeLocale, 'category', e.target.value)}
                    placeholder="e.g. Adventure"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--lito-border)] bg-[var(--cms-surface-3)] text-[var(--text-primary)] font-body text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lito-teal)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="font-body text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--lito-border)]">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !coverImage.trim()}>
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Slide'}
          </Button>
        </div>
      </div>
    </div>
  )
}
