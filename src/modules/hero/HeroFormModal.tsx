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
import { useState, useEffect, useRef } from 'react'
import { X, Save } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { ImageUploader } from '@/components/molecules/ImageUploader'
import { FormField, TextAreaField } from '@/components/molecules/FormField'
import type { HeroSlide, HeroSlideCreateRequest, HeroSlideUpdateRequest, HeroStatus } from '@/types/content.types'
import { heroService } from '@/services/content.service'
import { draftMediaStore } from '@/stores/draftMedia.store'
import { useFocusTrap } from '@/hooks/useFocusTrap'

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  readonly slide?: HeroSlide
  readonly siteId: string
  readonly onClose: () => void
  readonly onSaved: () => void
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  // AC-08: focus trap + Escape key for native <dialog> opened with `open` attr (not showModal)
  useFocusTrap(dialogRef, true, onClose)

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

  async function upsertAllTranslations(contentItemId: string) {
    for (const locale of LOCALES) {
      const t = translations[locale]
      await heroService.upsertTranslation(contentItemId, locale, {
        title:    t.title,
        subtitle: t.subtitle,
        // description form field → excerpt column
        excerpt:  t.description,
        // cta_label + category → extra JSONB in content_translations
        extra: { cta_label: t.cta_label, category: t.category },
      })
    }
  }

  async function handleSave() {
    setError(null)
    if (!coverImage.trim()) {
      setError('Image is required.')
      return
    }
    setSaving(true)
    try {
      const resolvedCoverImage = await draftMediaStore.resolveUrl(coverImage)

      if (isEdit) {
        const updatePayload: HeroSlideUpdateRequest = {
          cover_image: resolvedCoverImage,
          location:    location || undefined,
          region:      region || undefined,
          sort_order:  sortOrder,
          status,
          extra: { ...slide?.extra, href: href || undefined },
        }
        await heroService.update(slide.id, updatePayload)
        await upsertAllTranslations(slide.id)
      } else {
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

        const createdId = (created as { id: string }).id
        const hasSomeTranslation = LOCALES.some(locale => {
          const t = translations[locale]
          return t.title || t.subtitle || t.description || t.cta_label
        })
        if (hasSomeTranslation) await upsertAllTranslations(createdId)
      }

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
  const idleLabel = isEdit ? 'Save Changes' : 'Create Slide'
  const saveButtonLabel = saving ? 'Saving…' : idleLabel

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <dialog
        ref={dialogRef}
        open
        aria-modal="true"
        aria-label={isEdit ? 'Edit Hero Slide' : 'New Hero Slide'}
        className="bg-[var(--cms-card-bg)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 p-0"
      >
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
            <p className="font-body text-sm font-medium text-[var(--text-muted)] mb-2">
              Slide Image <span className="text-red-500">*</span>
            </p>
            <ImageUploader
              value={coverImage || null}
              onChange={(url) => setCoverImage(url ?? '')}
              folder="hero"
            />
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Link URL (href)"
              type="url"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="https://example.com/page"
            />
            <FormField
              label="Sort Order"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
            <FormField
              label="Location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bali, Indonesia"
            />
            <FormField
              label="Region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Southeast Asia"
            />
          </div>

          {/* Status */}
          <div className="cms-field-wrapper">
            <label htmlFor="hero-status" className="cms-label">Status</label>
            <select
              id="hero-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as HeroStatus)}
              className="cms-input"
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
              <span className="font-body text-sm font-medium text-[var(--text-muted)]">Translations</span>
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
              <FormField
                label="Title"
                type="text"
                value={t.title}
                onChange={(e) => updateTranslation(activeLocale, 'title', e.target.value)}
                placeholder="Slide headline"
              />
              <FormField
                label="Subtitle"
                type="text"
                value={t.subtitle}
                onChange={(e) => updateTranslation(activeLocale, 'subtitle', e.target.value)}
                placeholder="Supporting text"
              />
              <TextAreaField
                label="Description"
                value={t.description}
                onChange={(e) => updateTranslation(activeLocale, 'description', e.target.value)}
                placeholder="Optional longer description"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="CTA Label"
                  type="text"
                  value={t.cta_label}
                  onChange={(e) => updateTranslation(activeLocale, 'cta_label', e.target.value)}
                  placeholder="e.g. Explore Now"
                />
                <FormField
                  label="Category"
                  type="text"
                  value={t.category}
                  onChange={(e) => updateTranslation(activeLocale, 'category', e.target.value)}
                  placeholder="e.g. Adventure"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="font-body text-sm text-[var(--cms-danger)] bg-[var(--cms-danger-bg)] rounded-lg px-3 py-2">
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
            {saveButtonLabel}
          </Button>
        </div>
      </dialog>
    </div>
  )
}
