/**
 * GenerateContentPage — /onboarding/generate
 *
 * Post-site-creation step: user fills business brief, AI generates
 * personalized copy for selected pages, preview → apply or skip.
 *
 * Flow:
 *   1. Brief form  (tagline, description, target_market, brand_tone, brand_keywords)
 *      + page checklist (pre-checked per template defaults)
 *   2. Loading → AI generates preview
 *   3. Preview sidebar — "Looks good, apply" / "Regenerate" / "Skip"
 *   4. Apply → seed to DB → navigate to /dashboard
 */

import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sparkles, ArrowRight, SkipForward, RefreshCw,
  CheckCircle2, Globe, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'
import { http } from '@litostudio/ui-cms'
import { Button, FormInput } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'

// ── Types ─────────────────────────────────────────────────────────────────────

type BrandTone = 'professional' | 'warm' | 'bold' | 'minimal' | 'playful'

interface BriefForm {
  tagline:       string
  description:   string
  targetMarket:  string
  brandTone:     BrandTone
  brandKeywords: string   // comma-separated in form; split before API call
}

interface GeneratedSection {
  section_type: string
  sort_order:   number
  is_visible:   boolean
  props:        Record<string, unknown>
}

interface GeneratedPage {
  slug:     string
  title:    string
  sections: GeneratedSection[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Pages available per template — used to pre-check the checklist
const TEMPLATE_PAGES: Record<string, Array<{ slug: string; label: string }>> = {
  lito: [
    { slug: 'home',     label: 'Home' },
    { slug: 'about',    label: 'About' },
    { slug: 'contact',  label: 'Contact' },
  ],
  fashion: [
    { slug: 'home',     label: 'Home' },
    { slug: 'about',    label: 'About' },
    { slug: 'contact',  label: 'Contact' },
  ],
  beauty: [
    { slug: 'home',     label: 'Home' },
    { slug: 'about',    label: 'About' },
    { slug: 'contact',  label: 'Contact' },
  ],
}

const BRAND_TONES: Array<{ value: BrandTone; label: string; desc: string }> = [
  { value: 'professional', label: 'Professional', desc: 'Authoritative & clear' },
  { value: 'warm',         label: 'Warm',         desc: 'Friendly & personal' },
  { value: 'bold',         label: 'Bold',         desc: 'Direct & punchy' },
  { value: 'minimal',      label: 'Minimal',      desc: 'Understated & precise' },
  { value: 'playful',      label: 'Playful',      desc: 'Energetic & creative' },
]

const briefSchema = z.object({
  tagline:       z.string().min(3, 'Add a tagline').max(100),
  description:   z.string().min(10, 'Describe your business').max(500),
  targetMarket:  z.string().min(3, 'Who is your target client?').max(200),
  brandTone:     z.enum(['professional', 'warm', 'bold', 'minimal', 'playful']),
  brandKeywords: z.string().min(1, 'Add at least one keyword'),
})

// ── Sub-components ────────────────────────────────────────────────────────────

function PageChecklist({
  pages,
  selected,
  onChange,
}: {
  pages: Array<{ slug: string; label: string }>
  selected: Set<string>
  onChange: (slug: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="cms-label">Pages to generate</label>
      <div className="flex flex-wrap gap-2">
        {pages.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => onChange(p.slug)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-body transition-all',
              selected.has(p.slug)
                ? 'border-[var(--lito-teal)] bg-[var(--lito-teal)]/10 text-[var(--lito-teal)]'
                : 'border-[var(--lito-border)] text-[var(--text-muted)] hover:border-[var(--lito-teal)]/40',
            ].join(' ')}
          >
            {selected.has(p.slug) && <CheckCircle2 className="w-3 h-3" />}
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PreviewPanel({
  pages,
  onApply,
  onRegenerate,
  onSkip,
  applying,
}: {
  pages: GeneratedPage[]
  onApply: () => void
  onRegenerate: () => void
  onSkip: () => void
  applying: boolean
}) {
  const [expanded, setExpanded] = useState<string | null>(pages[0]?.slug ?? null)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
          Preview generated content
        </h3>
        <p className="font-body text-sm text-[var(--text-muted)]">
          Review the copy below. You can regenerate or apply directly.
        </p>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {pages.map((page) => (
          <div
            key={page.slug}
            className="border border-[var(--lito-border)] rounded-xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpanded(expanded === page.slug ? null : page.slug)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[var(--cms-surface-2)] hover:bg-[var(--cms-surface-3)] transition-colors"
            >
              <span className="font-body text-sm font-semibold text-[var(--text-primary)] capitalize">
                {page.title}
              </span>
              {expanded === page.slug
                ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
            </button>

            {expanded === page.slug && (
              <div className="divide-y divide-[var(--lito-border)]">
                {page.sections.map((sec, i) => {
                  const textFields = Object.entries(sec.props).filter(
                    ([k, v]) =>
                      typeof v === 'string' &&
                      ['title', 'heading', 'subtitle', 'description', 'eyebrow', 'subheading'].includes(k),
                  )
                  if (textFields.length === 0) return null
                  return (
                    <div key={i} className="px-4 py-3 space-y-1.5">
                      <p className="font-body text-xs text-[var(--text-muted)] uppercase tracking-wider">
                        {sec.section_type}
                      </p>
                      {textFields.map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="font-body text-xs text-[var(--text-secondary)] w-20 flex-shrink-0 capitalize">
                            {k}:
                          </span>
                          <span className="font-body text-xs text-[var(--text-primary)] leading-relaxed">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button skin="cms"
          className="w-full"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={onApply}
          loading={applying}
          disabled={applying}
        >
          Looks good — apply content
        </Button>
        <Button skin="cms"
          variant="secondary"
          className="w-full"
          leftIcon={<RefreshCw className="w-4 h-4" />}
          onClick={onRegenerate}
          disabled={applying}
        >
          Regenerate
        </Button>
        <Button skin="cms"
          variant="ghost"
          className="w-full"
          onClick={onSkip}
          disabled={applying}
        >
          Skip, I'll edit manually
        </Button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GenerateContentPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  const siteId       = searchParams.get('siteId') ?? ''
  const templateSlug = searchParams.get('template') ?? 'lito'

  const availablePages = TEMPLATE_PAGES[templateSlug] ?? TEMPLATE_PAGES.lito
  const [selectedPages, setSelectedPages] = useState<Set<string>>(
    new Set(availablePages.map((p) => p.slug)),
  )

  const [phase, setPhase]         = useState<'form' | 'loading' | 'preview'>('form')
  const [preview, setPreview]     = useState<GeneratedPage[]>([])
  const [applying, setApplying]   = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const form = useForm<BriefForm>({
    resolver: zodResolver(briefSchema),
    defaultValues: {
      tagline:       '',
      description:   '',
      targetMarket:  '',
      brandTone:     'professional',
      brandKeywords: '',
    },
  })

  const togglePage = useCallback((slug: string) => {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }, [])

  const handleGenerate = async (values: BriefForm) => {
    if (selectedPages.size === 0) {
      setError('Select at least one page to generate.')
      return
    }
    setError(null)
    setPhase('loading')
    try {
      const res = await http.post<ApiResponse<{ pages: GeneratedPage[] }>>(
        `/api/v1/cms/sites/${siteId}/generate-content`,
        {
          brief: {
            tagline:       values.tagline,
            description:   values.description,
            targetMarket:  values.targetMarket,
            brandTone:     values.brandTone,
            brandKeywords: values.brandKeywords.split(',').map((k) => k.trim()).filter(Boolean),
          },
          pages:         [...selectedPages],
          template_slug: templateSlug,
        },
      )
      setPreview(res.data?.pages ?? [])
      setPhase('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Try again.')
      setPhase('form')
    }
  }

  const handleApply = async () => {
    setApplying(true)
    setError(null)
    try {
      await http.post(`/api/v1/cms/sites/${siteId}/apply-generated-content`, { pages: preview })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply content.')
      setApplying(false)
    }
  }

  const handleRegenerate = () => {
    setPhase('form')
    setPreview([])
  }

  const handleSkip = () => navigate('/dashboard', { replace: true })

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--cms-main-bg)] px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Globe className="w-6 h-6 text-[var(--lito-gold)]" />
            <span className="font-display text-xl font-bold text-[var(--text-primary)]">
              Lito Studio
            </span>
          </div>
          <p className="font-body text-sm text-[var(--text-muted)]">
            Let's personalize your site content
          </p>
        </div>

        <div className="cms-card p-8">
          {/* ── Loading ── */}
          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--lito-teal)]/10 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-[var(--lito-teal)] animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-display text-base font-semibold text-[var(--text-primary)]">
                  Generating your content…
                </p>
                <p className="font-body text-sm text-[var(--text-muted)] mt-1">
                  Claude is writing personalized copy for your pages.
                </p>
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {phase === 'preview' && (
            <PreviewPanel
              pages={preview}
              onApply={handleApply}
              onRegenerate={handleRegenerate}
              onSkip={handleSkip}
              applying={applying}
            />
          )}

          {/* ── Brief form ── */}
          {phase === 'form' && (
            <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-5" noValidate>
              <div className="space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-[var(--lito-teal)]/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-[var(--lito-teal)]" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                  Tell us about your business
                </h2>
                <p className="font-body text-sm text-[var(--text-muted)]">
                  AI will write personalized copy for your selected pages. Takes ~15 seconds.
                </p>
              </div>

              <FormInput
                name="tagline"
                control={form.control}
                label="Tagline"
                placeholder="e.g. We capture stories that matter"
                required
              />

              <div className="space-y-1">
                <label className="cms-label">
                  Business description <span className="text-[var(--s-danger)] ml-0.5">*</span>
                </label>
                <textarea
                  {...form.register('description')}
                  rows={3}
                  placeholder="2–3 sentences about what you do, how you do it, and why it matters."
                  className="cms-textarea w-full"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-[var(--s-danger)] font-body">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <FormInput
                name="targetMarket"
                control={form.control}
                label="Target market"
                placeholder="e.g. Couples, 25–40, premium wedding budget"
                required
              />

              {/* Brand tone */}
              <div className="space-y-2">
                <label className="cms-label">
                  Brand tone <span className="text-[var(--s-danger)] ml-0.5">*</span>
                </label>
                <Controller
                  name="brandTone"
                  control={form.control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {BRAND_TONES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => field.onChange(t.value)}
                          className={[
                            'p-2.5 rounded-xl border-2 text-center transition-all',
                            field.value === t.value
                              ? 'border-[var(--lito-teal)] bg-[var(--lito-teal)]/10'
                              : 'border-[var(--lito-border)] hover:border-[var(--lito-teal)]/40',
                          ].join(' ')}
                        >
                          <div className="font-body text-xs font-semibold text-[var(--text-primary)]">
                            {t.label}
                          </div>
                          <div className="font-body text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                            {t.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <FormInput
                name="brandKeywords"
                control={form.control}
                label="Brand keywords (comma-separated)"
                placeholder="e.g. timeless, editorial, cinematic, intimate"
                required
              />

              <PageChecklist
                pages={availablePages}
                selected={selectedPages}
                onChange={togglePage}
              />

              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600 font-body">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button skin="cms"
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  leftIcon={<SkipForward className="w-4 h-4" />}
                  onClick={handleSkip}
                >
                  Skip
                </Button>
                <Button skin="cms"
                  type="submit"
                  className="flex-2"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  loading={phase as string === 'loading'}
                >
                  Generate content
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
