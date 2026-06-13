import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Search, Share2, Twitter, Globe, CheckCircle, AlertCircle } from 'lucide-react'
import { Button }       from '@/components/atoms/Button'
import { FormField, TextAreaField } from '@/components/molecules/FormField'
import { FormSkeleton } from '@/components/atoms/Skeleton'
import { cn } from '@/lib/utils'
import type { SeoMetadata, SeoSaveRequest } from '@/types/content.types'
import type { PAGE_TYPES, SeoPageType } from './SeoPageContainer'

const schema = z.object({
  title:               z.string().max(70).optional(),
  description:         z.string().max(160).optional(),
  keywords:            z.string().max(500).optional(),
  canonical:           z.string().url().optional().or(z.literal('')),
  robots:              z.string().max(100).optional(),
  noindex:             z.boolean().optional(),
  nofollow:            z.boolean().optional(),
  og_title:            z.string().max(255).optional(),
  og_description:      z.string().max(500).optional(),
  og_image:            z.string().url().optional().or(z.literal('')),
  og_url:              z.string().url().optional().or(z.literal('')),
  og_type:             z.string().optional(),
  twitter_card:        z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
  twitter_site:        z.string().max(100).optional(),
  twitter_title:       z.string().max(255).optional(),
  twitter_description: z.string().max(500).optional(),
  twitter_image:       z.string().url().optional().or(z.literal('')),
  schema_markup:       z.string().optional(), // JSON string input, parsed before save
})

type FormValues = z.infer<typeof schema>

interface Props {
  pageTypes: typeof PAGE_TYPES
  activeTab: SeoPageType
  onTabChange: (tab: SeoPageType) => void
  data: SeoMetadata
  isLoading: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  serverError: string | null
  onSave: (values: SeoSaveRequest) => void
}

export function SeoPageView({ pageTypes, activeTab, onTabChange, data, isLoading, saveStatus, serverError, onSave }: Props) {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', description: '', keywords: '', canonical: '', robots: 'index, follow',
      noindex: false, nofollow: false,
      og_title: '', og_description: '', og_image: '', og_url: '', og_type: 'website',
      twitter_card: 'summary_large_image', twitter_site: '', twitter_title: '',
      twitter_description: '', twitter_image: '',
      schema_markup: '',
    },
  })

  // Reset form when tab changes or data loads
  useEffect(() => {
    reset({
      title:               data.title               ?? '',
      description:         data.description         ?? '',
      keywords:            data.keywords            ?? '',
      canonical:           data.canonical           ?? '',
      robots:              data.robots              ?? 'index, follow',
      noindex:             data.noindex             ?? false,
      nofollow:            data.nofollow            ?? false,
      og_title:            data.og_title            ?? '',
      og_description:      data.og_description      ?? '',
      og_image:            data.og_image            ?? '',
      og_url:              data.og_url              ?? '',
      og_type:             data.og_type             ?? 'website',
      twitter_card:        (data.twitter_card as FormValues['twitter_card']) ?? 'summary_large_image',
      twitter_site:        data.twitter_site        ?? '',
      twitter_title:       data.twitter_title       ?? '',
      twitter_description: data.twitter_description ?? '',
      twitter_image:       data.twitter_image       ?? '',
      schema_markup:       data.schema_markup ? JSON.stringify(data.schema_markup, null, 2) : '',
    })
  }, [data, reset])

  const title       = watch('title')
  const description = watch('description')
  const ogImage     = watch('og_image')
  const ogTitle     = watch('og_title') || title

  const handleFormSubmit = (values: FormValues) => {
    let schemaParsed: Record<string, unknown> | undefined
    if (values.schema_markup) {
      try { schemaParsed = JSON.parse(values.schema_markup) } catch { /* invalid JSON — skip */ }
    }
    onSave({
      ...values,
      og_url:       values.og_url       || undefined,
      og_image:     values.og_image     || undefined,
      canonical:    values.canonical    || undefined,
      twitter_image: values.twitter_image || undefined,
      schema_markup: schemaParsed,
    })
  }

  const titleLen = (title ?? '').length
  const descLen  = (description ?? '').length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">SEO Manager</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            Manage meta tags, Open Graph and social previews per page
          </p>
        </div>
        {saveStatus === 'saved' && (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle className="w-4 h-4" />
            <span className="font-body text-sm">Saved</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-1.5 text-[var(--s-danger)]">
            <AlertCircle className="w-4 h-4" />
            <span className="font-body text-sm">Save failed</span>
          </div>
        )}
      </div>

      {/* Page type tabs */}
      <div className="border-b border-[var(--lito-border)] flex gap-0.5 overflow-x-auto">
        {pageTypes.map((pt) => (
          <button
            key={pt.key}
            type="button"
            onClick={() => onTabChange(pt.key)}
            className={cn(
              'px-4 py-2.5 font-body text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === pt.key
                ? 'border-[var(--lito-teal)] text-[var(--lito-teal)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            )}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <FormSkeleton />
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left column: form fields */}
            <div className="lg:col-span-2 space-y-5">
              {/* Basic SEO */}
              <div className="cms-card p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Search className="w-4 h-4 text-[var(--text-muted)]" />
                  <h2 className="font-body text-sm font-semibold text-[var(--text-primary)]">Search Engine</h2>
                </div>
                <div className="space-y-1.5">
                  <FormField
                    label="Meta Title" placeholder="Page title (50-60 chars ideal)"
                    error={errors.title?.message}
                    {...register('title')}
                  />
                  <p className={cn('font-body text-xs', titleLen > 60 ? 'text-amber-600' : 'text-[var(--text-muted)]')}>
                    {titleLen}/60 characters
                  </p>
                </div>
                <div className="space-y-1.5">
                  <TextAreaField
                    label="Meta Description" rows={3} placeholder="Page description (120-160 chars ideal)"
                    error={errors.description?.message}
                    {...register('description')}
                  />
                  <p className={cn('font-body text-xs', descLen > 160 ? 'text-amber-600' : 'text-[var(--text-muted)]')}>
                    {descLen}/160 characters
                  </p>
                </div>
                <FormField
                  label="Keywords" placeholder="photography, bali, wedding (comma-separated)"
                  error={errors.keywords?.message}
                  {...register('keywords')}
                />
                <FormField
                  label="Canonical URL" placeholder="https://yourdomain.com/page"
                  error={errors.canonical?.message}
                  {...register('canonical')}
                />
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" {...register('noindex')} />
                    <span className="cms-label mb-0">noindex</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" {...register('nofollow')} />
                    <span className="cms-label mb-0">nofollow</span>
                  </label>
                </div>
                <div className="space-y-1.5">
                  <label className="cms-label" htmlFor="robots">Robots</label>
                  <select id="robots" className="cms-input w-full" {...register('robots')}>
                    <option value="index, follow">index, follow</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="index, nofollow">index, nofollow</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                  </select>
                </div>
              </div>

              {/* Open Graph */}
              <div className="cms-card p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Share2 className="w-4 h-4 text-[var(--text-muted)]" />
                  <h2 className="font-body text-sm font-semibold text-[var(--text-primary)]">Open Graph (Facebook / LinkedIn)</h2>
                </div>
                <FormField label="OG Title"       placeholder="Overrides meta title for social"    error={errors.og_title?.message}       {...register('og_title')} />
                <TextAreaField label="OG Description" rows={2} placeholder="Overrides meta description" error={errors.og_description?.message} {...register('og_description')} />
                <FormField label="OG Image URL"   placeholder="https://… (1200×630 recommended)"  error={errors.og_image?.message}       {...register('og_image')} />
                <FormField label="OG URL"         placeholder="Canonical URL for social share"    error={errors.og_url?.message}         {...register('og_url')} />
                <div className="space-y-1.5">
                  <label className="cms-label" htmlFor="og_type">OG Type</label>
                  <select id="og_type" className="cms-input w-full" {...register('og_type')}>
                    <option value="website">website</option>
                    <option value="article">article</option>
                    <option value="profile">profile</option>
                  </select>
                </div>
              </div>

              {/* Twitter / X */}
              <div className="cms-card p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Twitter className="w-4 h-4 text-[var(--text-muted)]" />
                  <h2 className="font-body text-sm font-semibold text-[var(--text-primary)]">Twitter / X Card</h2>
                </div>
                <div className="space-y-1.5">
                  <label className="cms-label" htmlFor="twitter_card">Card Type</label>
                  <select id="twitter_card" className="cms-input w-full" {...register('twitter_card')}>
                    <option value="summary_large_image">Summary with large image</option>
                    <option value="summary">Summary</option>
                  </select>
                </div>
                <FormField label="Twitter @site"       placeholder="@yourbrand"                          error={errors.twitter_site?.message}        {...register('twitter_site')} />
                <FormField label="Twitter Title"       placeholder="Overrides OG title for Twitter"      error={errors.twitter_title?.message}       {...register('twitter_title')} />
                <TextAreaField label="Twitter Description" rows={2} placeholder="Overrides OG description" error={errors.twitter_description?.message} {...register('twitter_description')} />
                <FormField label="Twitter Image URL"   placeholder="https://… (1200×628 recommended)"   error={errors.twitter_image?.message}       {...register('twitter_image')} />
              </div>

              {/* Schema.org JSON-LD */}
              <div className="cms-card p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-4 h-4 text-[var(--text-muted)]" />
                  <h2 className="font-body text-sm font-semibold text-[var(--text-primary)]">Schema Markup (JSON-LD)</h2>
                </div>
                <p className="font-body text-xs text-[var(--text-muted)]">
                  Structured data for Google rich results. Must be valid JSON.
                </p>
                <textarea
                  rows={8}
                  className="cms-input resize-y w-full font-mono text-xs"
                  placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": ""\n}'}
                  {...register('schema_markup')}
                />
              </div>

              {serverError && (
                <div className="px-3 py-2 rounded-lg border border-[var(--s-danger)]/20 bg-red-50" role="alert">
                  <p className="font-body text-xs text-[var(--s-danger)]">{serverError}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" leftIcon={<Save className="w-4 h-4" />} loading={saveStatus === 'saving'}>
                  Save SEO
                </Button>
              </div>
            </div>

            {/* Right column: previews */}
            <div className="space-y-5">
              {/* Google search preview */}
              <div className="cms-card p-4 space-y-2">
                <p className="font-body text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Google Preview</p>
                <div className="space-y-0.5">
                  <p className="font-body text-[13px] text-blue-700 truncate">{title || 'Page Title'}</p>
                  <p className="font-body text-[11px] text-emerald-700 truncate">https://yourdomain.com/page</p>
                  <p className="font-body text-[11px] text-[var(--text-muted)] line-clamp-2">
                    {description || 'Page description will appear here. Write 120–160 chars for best results.'}
                  </p>
                </div>
              </div>

              {/* Facebook OG preview */}
              <div className="cms-card overflow-hidden">
                <p className="font-body text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide px-4 pt-4 pb-2">Facebook Preview</p>
                {ogImage ? (
                  <img src={ogImage} alt="OG preview" className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-[var(--lito-cream-alt)] flex items-center justify-center">
                    <Share2 className="w-8 h-8 text-[var(--text-faint)]" />
                  </div>
                )}
                <div className="px-3 py-2 bg-[var(--lito-cream-alt)]">
                  <p className="font-body text-[10px] text-[var(--text-muted)] uppercase">yourdomain.com</p>
                  <p className="font-body text-[12px] font-semibold text-[var(--text-primary)] truncate">{ogTitle || 'Page Title'}</p>
                  <p className="font-body text-[11px] text-[var(--text-muted)] line-clamp-2">
                    {watch('og_description') || description || 'Description'}
                  </p>
                </div>
              </div>

              {/* Quick SEO checklist */}
              <div className="cms-card p-4 space-y-2">
                <p className="font-body text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">SEO Checklist</p>
                {[
                  { label: 'Meta title set',       ok: !!title },
                  { label: 'Meta description set', ok: !!description },
                  { label: 'Title ≤ 60 chars',     ok: titleLen > 0 && titleLen <= 60 },
                  { label: 'Description ≤ 160',    ok: descLen > 0 && descLen <= 160 },
                  { label: 'OG image set',          ok: !!watch('og_image') },
                  { label: 'Twitter card set',      ok: !!watch('twitter_card') },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={cn('w-3.5 h-3.5 rounded-full flex-shrink-0', ok ? 'bg-emerald-500' : 'bg-[var(--lito-border)]')} />
                    <span className={cn('font-body text-xs', ok ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
