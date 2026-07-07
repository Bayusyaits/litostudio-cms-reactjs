/**
 * OnboardingPage — shown ONLY when user has no organization or no active site.
 *
 * Logic:
 *   - If user already has org + site (shouldShowOnboarding = false),
 *     this page NEVER renders — DashboardLayout redirects to /dashboard.
 *   - Step 1: Create Organization (if !user.org_id)
 *   - Step 2: Create Website   (if org exists but no site)
 *   - Step 3: Setup Checklist  (done → go to dashboard)
 *
 * Forms use react-hook-form + zod (schema validation). No Formik. No manual validation.
 */

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2, Globe, Layers, CheckCircle2, ArrowRight,
  Camera, Star, Package, Navigation, LayoutGrid, Rocket,
  ChevronRight, Palette, FileText,
} from 'lucide-react'
import { orgService } from '@/services/org.service'
import { authService } from '@/services/auth.service'
import { useOrgStore } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { useAuthStore } from '@/stores/auth.store'
import { Button, FormInput, BlockIcon } from '@litostudio/ui-cms'
import type { Organization, Site } from '@litostudio/ui-cms'

// ── Constants ────────────────────────────────────────────────────────────────
// icon/preview = Lucide icon name (see blockIcons.tsx ICON_MAP) — were raw
// emoji until the 2026-07 icon cleanup.

const ORG_TYPES = [
  { value: 'fashion',      label: 'Fashion & Apparel',    icon: 'Shirt' },
  { value: 'beauty',       label: 'Beauty & Wellness',    icon: 'Sparkles' },
  { value: 'photography',  label: 'Photography',           icon: 'Camera' },
  { value: 'videography',  label: 'Videography',           icon: 'Clapperboard' },
  { value: 'travel',       label: 'Travel & Tourism',     icon: 'Plane' },
  { value: 'agency',       label: 'Creative Agency',      icon: 'Palette' },
  { value: 'services',     label: 'Professional Services', icon: 'Briefcase' },
  { value: 'other',        label: 'Other',                icon: 'Globe' },
]

const TEMPLATES = [
  { value: 'lito',     label: 'Photography', preview: 'Camera',  description: 'Visual storytelling, stories, and services' },
  { value: 'fashion',  label: 'Fashion',     preview: 'Shirt',   description: 'Bold, editorial, seasonal collections' },
  { value: 'beauty',   label: 'Beauty',      preview: 'Flower',  description: 'Clean, product-forward, aspirational' },
  { value: 'blank',    label: 'Blank',       preview: 'FileText', description: 'Start from scratch with empty canvas' },
]

const CHECKLIST_ITEMS = [
  { id: 'logo',       icon: <Camera className="w-4 h-4" />,      label: 'Upload your logo',         route: '/settings' },
  { id: 'hero',       icon: <Star className="w-4 h-4" />,        label: 'Add a hero banner',        route: '/hero' },
  { id: 'services',   icon: <Layers className="w-4 h-4" />,      label: 'Add your services',        route: '/services' },
  { id: 'products',   icon: <Package className="w-4 h-4" />,     label: 'Add your first product',   route: '/products' },
  { id: 'navigation', icon: <Navigation className="w-4 h-4" />,  label: 'Set up menu (Pages)',      route: '/pages' },
  { id: 'theme',      icon: <Palette className="w-4 h-4" />,     label: 'Choose a theme',           route: '/themes' },
  { id: 'pages',      icon: <FileText className="w-4 h-4" />,    label: 'Create your first page',   route: '/pages' },
  { id: 'publish',    icon: <Rocket className="w-4 h-4" />,      label: 'Publish your website',     route: '/deployments' },
]

// ── Zod schemas ───────────────────────────────────────────────────────────────

const orgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  type: z.string().min(1, 'Select an organization type'),
})
type OrgForm = z.infer<typeof orgSchema>

const siteSchema = z.object({
  name:     z.string().min(2, 'Site name must be at least 2 characters').max(60),
  template: z.string().min(1, 'Select a template'),
})
type SiteForm = z.infer<typeof siteSchema>

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={[
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
            i + 1 < step   ? 'bg-[var(--lito-teal)] text-white' : '',
            i + 1 === step ? 'bg-[var(--lito-gold)] text-[var(--lito-dark)] ring-4 ring-[var(--lito-gold)]/20' : '',
            i + 1 > step   ? 'bg-[var(--cms-surface-3)] text-[var(--text-muted)]' : '',
          ].join(' ')}>
            {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={[
              'w-12 h-0.5 transition-all',
              i + 1 < step ? 'bg-[var(--lito-teal)]' : 'bg-[var(--cms-surface-3)]',
            ].join(' ')} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Create Organization ───────────────────────────────────────────────

function CreateOrgStep({ onComplete }: { onComplete: (org: Organization) => void }) {
  const [selectedType, setSelectedType] = useState('')
  const qc = useQueryClient()
  const { setOrg } = useOrgStore()
  const { user, setUser } = useAuthStore()

  const form = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: '', type: '' },
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit, setValue, formState: { errors } } = form

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string }) =>
      orgService.createOrg(payload),
    onSuccess: (newOrg) => {
      if (!newOrg) return
      // ── Invalidate all org + site queries so stale cache is cleared ─────
      qc.invalidateQueries({ queryKey: ['org', 'current'] })
      qc.invalidateQueries({ queryKey: ['orgs'] })
      qc.invalidateQueries({ queryKey: ['sites'] })
      setOrg(newOrg)
      if (user) setUser({ ...user, org_id: newOrg.id, org_role: 'owner' })
      onComplete(newOrg)
    },
  })

  const onSubmit = async (values: OrgForm) => {
    const slug = values.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    await createMutation.mutateAsync({ name: values.name, slug })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          Create your organization
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          Your organization is your workspace. You can manage multiple websites from here.
        </p>
      </div>

      <FormInput
        name="name"
        control={form.control}
        label="Organization name"
        placeholder="e.g. Lito Creative Studio"
        required
        autoFocus
      />

      {/* Org type grid (not a standard input — manual setValue) */}
      <div className="space-y-2">
        <label className="cms-label">
          Organization type <span className="text-[var(--s-danger)] ml-0.5">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ORG_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setSelectedType(t.value)
                setValue('type', t.value, { shouldValidate: true })
              }}
              className={[
                'p-3 rounded-xl border-2 text-center transition-all text-sm font-body',
                selectedType === t.value
                  ? 'border-[var(--lito-teal)] bg-[var(--lito-teal)]/10 text-[var(--lito-teal)]'
                  : 'border-[var(--lito-border)] text-[var(--text-muted)] hover:border-[var(--lito-teal)]/40',
              ].join(' ')}
            >
              <div className="mb-1 flex items-center justify-center"><BlockIcon name={t.icon} size={20} /></div>
              <div className="text-xs leading-tight">{t.label}</div>
            </button>
          ))}
        </div>
        {errors.type && (
          <p className="text-xs text-[var(--s-danger)] font-body" role="alert">{errors.type.message}</p>
        )}
        <input type="hidden" {...form.register('type')} />
      </div>

      {createMutation.error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200" role="alert">
          <p className="text-xs text-red-600 font-body">{String(createMutation.error)}</p>
        </div>
      )}

      <Button skin="cms"
        type="submit"
        className="w-full"
        rightIcon={<ArrowRight className="w-4 h-4" />}
        loading={createMutation.isPending}
        disabled={createMutation.isPending}
      >
        Create organization & continue
      </Button>
    </form>
  )
}

// ── Step 2: Create Website ─────────────────────────────────────────────────────

function CreateSiteStep({
  org,
  onComplete,
  onSkip,
}: {
  org: Organization
  onComplete: (site: Site) => void
  onSkip:     () => void
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('blank')
  const { setActiveSite } = useWebsiteStore()
  const qc = useQueryClient()

  const form = useForm<SiteForm>({
    resolver: zodResolver(siteSchema),
    defaultValues: { name: org.name + ' Website', template: 'blank' },
    mode: 'onChange',
    reValidateMode: 'onChange',
  })
  const { handleSubmit, setValue, formState: { errors } } = form

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string; template_slug?: string }) =>
      orgService.createSite(payload),
    onSuccess: (newSite) => {
      if (!newSite) return
      // ── Invalidate site queries so stale cache is cleared ─────────────
      qc.invalidateQueries({ queryKey: ['sites'] })
      qc.invalidateQueries({ queryKey: ['sites', org.id] })
      setActiveSite(newSite)
      onComplete(newSite)
    },
  })

  const onSubmit = async (values: SiteForm) => {
    const slug = values.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    // Pass selected template so the backend stores it in sites.settings.template_slug
    await createMutation.mutateAsync({
      name: values.name,
      slug,
      template_slug: selectedTemplate !== 'blank' ? selectedTemplate : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-full bg-[var(--lito-teal)]/10 text-[var(--lito-teal)] text-xs font-medium font-body">
            {org.name}
          </span>
        </div>
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          Create your first website
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          Choose a starting template. You can always change it later.
        </p>
      </div>

      <FormInput
        name="name"
        control={form.control}
        label="Website name"
        placeholder="e.g. My Fashion Store"
        required
      />

      {/* Template grid */}
      <div className="space-y-2">
        <label className="cms-label">
          Template <span className="text-[var(--s-danger)] ml-0.5">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setSelectedTemplate(t.value)
                setValue('template', t.value, { shouldValidate: true })
              }}
              className={[
                'p-4 rounded-xl border-2 text-left transition-all',
                selectedTemplate === t.value
                  ? 'border-[var(--lito-teal)] bg-[var(--lito-teal)]/10'
                  : 'border-[var(--lito-border)] hover:border-[var(--lito-teal)]/40',
              ].join(' ')}
            >
              <div className="mb-2 flex items-center justify-center text-[var(--text-secondary)]"><BlockIcon name={t.preview} size={24} /></div>
              <div className="font-body text-sm font-semibold text-[var(--text-primary)]">{t.label}</div>
              <div className="font-body text-xs text-[var(--text-muted)] mt-0.5 leading-tight">{t.description}</div>
            </button>
          ))}
        </div>
        {errors.template && (
          <p className="text-xs text-[var(--s-danger)] font-body" role="alert">{errors.template.message}</p>
        )}
        <input type="hidden" {...form.register('template')} />
      </div>

      {createMutation.error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200" role="alert">
          <p className="text-xs text-red-600 font-body">{String(createMutation.error)}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button skin="cms" type="button" variant="ghost" className="flex-1" onClick={onSkip}>
          Skip for now
        </Button>
        <Button skin="cms"
          type="submit"
          className="flex-1"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
        >
          Create website
        </Button>
      </div>
    </form>
  )
}

// ── Step 3: Setup Checklist ───────────────────────────────────────────────────

const CHECKLIST_LS_KEY = 'lito_onboarding_tasks'

function SetupChecklistStep({ onDone }: { onDone: () => void }) {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_LS_KEY)
      if (raw) return new Set<string>(JSON.parse(raw) as string[])
    } catch { /* ignore */ }
    return new Set<string>()
  })
  const navigate = useNavigate()

  // Persist to localStorage immediately on every change
  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_LS_KEY, JSON.stringify([...checked]))
    } catch { /* quota exceeded — silently skip */ }
  }, [checked])

  // Persist to Supabase user_metadata with 1.5 s debounce
  // Failure is non-critical — localStorage is the primary source of truth.
  useEffect(() => {
    const id = setTimeout(() => {
      void authService.updateProfile({ onboarding_tasks: [...checked] }).catch(() => {
        // silently ignore — localStorage already has the state
      })
    }, 1_500)
    return () => clearTimeout(id)
  }, [checked])

  const toggle = (id: string) =>
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-[var(--lito-teal)]/10 flex items-center justify-center mb-4">
          <LayoutGrid className="w-6 h-6 text-[var(--lito-teal)]" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          You're all set! 🎉
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          Here's what to do next to launch your website.
        </p>
      </div>

      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => (
          <div
            key={item.id}
            role="checkbox"
            aria-checked={checked.has(item.id)}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggle(item.id) }}
            className={[
              'flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group',
              checked.has(item.id)
                ? 'border-[var(--lito-teal)]/40 bg-[var(--lito-teal)]/5 opacity-60'
                : 'border-[var(--lito-border)] hover:border-[var(--lito-teal)]/40 bg-[var(--cms-surface-2)]',
            ].join(' ')}
            onClick={() => toggle(item.id)}
          >
            <div className="flex items-center gap-3">
              <div className={[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                checked.has(item.id)
                  ? 'border-[var(--lito-teal)] bg-[var(--lito-teal)]'
                  : 'border-[var(--lito-border)]',
              ].join(' ')}>
                {checked.has(item.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className="text-[var(--cms-icon)] w-4 h-4">{item.icon}</span>
              <span className={[
                'font-body text-sm',
                checked.has(item.id) ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]',
              ].join(' ')}>
                {item.label}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); navigate(item.route) }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-[var(--lito-teal)] font-body transition-opacity"
            >
              Go <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="font-body text-xs text-[var(--text-muted)]">
          {checked.size} of {CHECKLIST_ITEMS.length} completed
        </p>
        <Button skin="cms" rightIcon={<Rocket className="w-4 h-4" />} onClick={onDone}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}

// ── Main Onboarding Page ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [createdOrg, setCreatedOrg] = useState<Organization | null>(null)
  const [createdSite, setCreatedSite] = useState<Site | null>(null)
  const navigate = useNavigate()

  const handleOrgCreated = (org: Organization) => {
    setCreatedOrg(org)
    setStep(2)
  }

  const handleSiteCreated = (site: Site) => {
    setCreatedSite(site)
    // Navigate to AI content generation page if a real template was selected
    const templateSlug = (site as Site & { settings?: { template_slug?: string } }).settings?.template_slug
    if (templateSlug && templateSlug !== 'blank') {
      navigate(`/onboarding/generate?siteId=${site.id}&template=${templateSlug}`)
    } else {
      setStep(3)
    }
  }

  const handleSkipSite = () => setStep(3)
  const handleDone     = () => navigate('/dashboard', { replace: true })

  // createdSite retained in state for potential re-use (e.g. going back to step 3)
  void createdSite

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
            Let's get you set up in a few steps
          </p>
        </div>

        {/* Card */}
        <div className="cms-card p-8">
          <StepIndicator step={step} total={3} />

          {/* Step labels */}
          <div className="flex gap-2 mb-6 text-xs font-body">
            {[
              { n: 1, icon: <Building2 className="w-3 h-3" />, label: 'Organization' },
              { n: 2, icon: <Globe className="w-3 h-3" />,     label: 'Website' },
              { n: 3, icon: <Layers className="w-3 h-3" />,    label: 'Setup' },
            ].map(({ n, icon, label }) => (
              <div key={n} className={[
                'flex items-center gap-1 px-2 py-1 rounded-full transition-all',
                step === n ? 'bg-[var(--lito-gold)]/10 text-[var(--lito-gold-deep)]' : 'text-[var(--text-muted)]',
              ].join(' ')}>
                {icon}<span>{label}</span>
              </div>
            ))}
          </div>

          {step === 1 && <CreateOrgStep onComplete={handleOrgCreated} />}
          {step === 2 && createdOrg && (
            <CreateSiteStep
              org={createdOrg}
              onComplete={handleSiteCreated}
              onSkip={handleSkipSite}
            />
          )}
          {step === 3 && <SetupChecklistStep onDone={handleDone} />}
        </div>
      </div>
    </div>
  )
}
