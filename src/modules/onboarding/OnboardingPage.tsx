/**
 * OnboardingPage — Shopify/Wix-style setup wizard.
 *
 * Shown when a user has no organization yet. Three sequential steps:
 *   1. Create Organization
 *   2. Create Website (first site)
 *   3. Setup Checklist (what to do next)
 *
 * Never redirects away from this page. Never reloads.
 * Advances purely through local state after successful API calls.
 */

import { useState } from 'react'
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
import { useOrgStore } from '@/stores/org.store'
import { useWebsiteStore } from '@/stores/website.store'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/atoms/Button'
import { FormField } from '@/components/molecules/FormField'
import type { Organization, Site } from '@/types/auth.types'

// ── Constants ────────────────────────────────────────────────────────────────

const ORG_TYPES = [
  { value: 'fashion',      label: 'Fashion & Apparel',   icon: '👗' },
  { value: 'beauty',       label: 'Beauty & Wellness',   icon: '✨' },
  { value: 'photography',  label: 'Photography',          icon: '📷' },
  { value: 'videography',  label: 'Videography',          icon: '🎬' },
  { value: 'travel',       label: 'Travel & Tourism',    icon: '✈️' },
  { value: 'agency',       label: 'Creative Agency',     icon: '🎨' },
  { value: 'services',     label: 'Professional Services',icon: '💼' },
  { value: 'other',        label: 'Other',               icon: '🌐' },
]

const TEMPLATES = [
  { value: 'fashion',   label: 'Fashion',   preview: '🧣', description: 'Bold, editorial, seasonal collections' },
  { value: 'beauty',    label: 'Beauty',    preview: '💆', description: 'Clean, product-forward, aspirational' },
  { value: 'travel',    label: 'Travel',    preview: '🗺️',  description: 'Immersive, story-driven, destination-rich' },
  { value: 'services',  label: 'Services',  preview: '💼', description: 'Professional, conversion-focused' },
  { value: 'portfolio', label: 'Portfolio', preview: '🎨', description: 'Minimal, work-focused, personal brand' },
  { value: 'blank',     label: 'Blank',     preview: '📄', description: 'Start from scratch with empty canvas' },
]

const CHECKLIST_ITEMS = [
  { id: 'logo',       icon: <Camera className="w-4 h-4" />,      label: 'Upload your logo',         route: '/settings' },
  { id: 'hero',       icon: <Star className="w-4 h-4" />,        label: 'Add a hero banner',        route: '/hero' },
  { id: 'services',   icon: <Layers className="w-4 h-4" />,      label: 'Add your services',        route: '/services' },
  { id: 'products',   icon: <Package className="w-4 h-4" />,     label: 'Add your first product',   route: '/products' },
  { id: 'navigation', icon: <Navigation className="w-4 h-4" />,  label: 'Set up navigation',        route: '/navigation' },
  { id: 'theme',      icon: <Palette className="w-4 h-4" />,     label: 'Choose a theme',           route: '/themes' },
  { id: 'pages',      icon: <FileText className="w-4 h-4" />,    label: 'Create your first page',   route: '/pages' },
  { id: 'publish',    icon: <Rocket className="w-4 h-4" />,      label: 'Publish your website',     route: '/deployments' },
]

// ── Schemas ──────────────────────────────────────────────────────────────────

const orgSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters').max(80),
  type:    z.string().min(1, 'Select an organization type'),
})
type OrgForm = z.infer<typeof orgSchema>

const siteSchema = z.object({
  name:     z.string().min(2, 'Site name must be at least 2 characters').max(60),
  template: z.string().min(1, 'Select a template'),
})
type SiteForm = z.infer<typeof siteSchema>

// ── Step components ──────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={[
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
            i + 1 < step  ? 'bg-[var(--lito-teal)] text-white' : '',
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

// ── Step 1: Create Organization ──────────────────────────────────────────────
interface Step1Props {
  onComplete: (org: Organization) => void
}

function CreateOrgStep({ onComplete }: Step1Props) {
  const [selectedType, setSelectedType] = useState('')
  const qc = useQueryClient()
  const { setOrg } = useOrgStore()
  const { user, setUser } = useAuthStore()

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: { type: '' },
  })

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string }) =>
      orgService.createOrg(payload),
    onSuccess: (newOrg) => {
      if (!newOrg) return
      qc.invalidateQueries({ queryKey: ['orgs'] })
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
    // org type is UI-only; backend createOrg accepts { name, slug?, plan? }
    await createMutation.mutateAsync({ name: values.name, slug })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
          Create your organization
        </h2>
        <p className="font-body text-sm text-[var(--text-muted)]">
          Your organization is your workspace. You can manage multiple websites from here.
        </p>
      </div>

      <FormField
        label="Organization name"
        placeholder="e.g. Lito Creative Studio"
        required
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="space-y-2">
        <label className="font-body text-sm font-medium text-[var(--text-primary)]">
          Organization type <span className="text-red-500">*</span>
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
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-xs leading-tight">{t.label}</div>
            </button>
          ))}
        </div>
        {errors.type && (
          <p className="text-xs text-red-500 font-body">{errors.type.message}</p>
        )}
        <input type="hidden" {...register('type')} />
      </div>

      {createMutation.error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-600 font-body">
            {String(createMutation.error)}
          </p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        rightIcon={<ArrowRight className="w-4 h-4" />}
        loading={createMutation.isPending}
      >
        Create organization & continue
      </Button>
    </form>
  )
}

// ── Step 2: Create Website ───────────────────────────────────────────────────
interface Step2Props {
  org: Organization
  onComplete: (site: Site) => void
  onSkip: () => void
}

function CreateSiteStep({ org, onComplete, onSkip }: Step2Props) {
  const [selectedTemplate, setSelectedTemplate] = useState('blank')
  const { setActiveSite } = useWebsiteStore()
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<SiteForm>({
    resolver: zodResolver(siteSchema),
    defaultValues: { name: org.name + ' Website', template: 'blank' },
  })

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; slug: string }) =>
      orgService.createSite(payload),
    onSuccess: (newSite) => {
      if (!newSite) return
      qc.invalidateQueries({ queryKey: ['sites'] })
      setActiveSite(newSite)
      onComplete(newSite)
    },
  })

  const onSubmit = async (values: SiteForm) => {
    const slug = values.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    // template selection is UI-only; backend createSite accepts { name, slug }
    await createMutation.mutateAsync({ name: values.name, slug })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <FormField
        label="Website name"
        placeholder="e.g. My Fashion Store"
        required
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="space-y-2">
        <label className="font-body text-sm font-medium text-[var(--text-primary)]">
          Template <span className="text-red-500">*</span>
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
              <div className="text-2xl mb-2">{t.preview}</div>
              <div className="font-body text-sm font-semibold text-[var(--text-primary)]">{t.label}</div>
              <div className="font-body text-xs text-[var(--text-muted)] mt-0.5 leading-tight">{t.description}</div>
            </button>
          ))}
        </div>
        {errors.template && (
          <p className="text-xs text-red-500 font-body">{errors.template.message}</p>
        )}
        <input type="hidden" {...register('template')} />
      </div>

      {createMutation.error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs text-red-600 font-body">{String(createMutation.error)}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onSkip}
        >
          Skip for now
        </Button>
        <Button
          type="submit"
          className="flex-1"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          loading={createMutation.isPending}
        >
          Create website
        </Button>
      </div>
    </form>
  )
}

// ── Step 3: Setup Checklist ──────────────────────────────────────────────────
interface Step3Props {
  onDone: () => void
}

function SetupChecklistStep({ onDone }: Step3Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
        <Button
          rightIcon={<Rocket className="w-4 h-4" />}
          onClick={onDone}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}

// ── Main Onboarding Page ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [createdOrg, setCreatedOrg] = useState<Organization | null>(null)
  const navigate = useNavigate()

  const handleOrgCreated = (org: Organization) => {
    setCreatedOrg(org)
    setStep(2)
  }

  const handleSiteCreated = () => {
    setStep(3)
  }

  const handleSkipSite = () => {
    setStep(3)
  }

  const handleDone = () => {
    navigate('/dashboard', { replace: true })
  }

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
