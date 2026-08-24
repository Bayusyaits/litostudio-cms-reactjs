/**
 * JobEditorPage — dedicated create/edit page for a single job posting.
 *
 * Bespoke, not SimpleContentEditorPage (same reasoning as FaqEditorPage.tsx /
 * TeamMemberEditorPage.tsx: job_postings is a dedicated table +
 * job_posting_translations).
 *
 * External application flow: `applicationType` toggles between the site's
 * own internal apply form ('internal') and a real external ATS/job-board URL
 * ('external', requires externalApplyUrl) — the External Apply URL field
 * only renders when 'external' is selected (conditional display logic per
 * the task requirement), and the backend's own CHECK constraint +
 * assertValidApplication() reject the combination server-side regardless of
 * what this form does, so this is UX, not the only safeguard.
 *
 * Routes: /careers/new and /careers/:id/edit.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { careersService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { ContentEditorLayout } from '@/components/organisms/ContentEditorLayout'
import { Switch } from '@/components/atoms/Switch'
import { LocaleSwitcher } from '@/components/molecules/LocaleSwitcher'
import { useOrgLocales } from '@/hooks/useOrgLocales'
import { DashboardSkeleton, TextAreaField, Select, FormField } from '@litostudio/ui-cms'
import type { ApplicationType, EmploymentType } from '@/types/content.types'

const STATUS_OPTIONS = [
  { value: 'draft',    label: 'Draft' },
  { value: 'active',   label: 'Published' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

const EMPLOYMENT_TYPE_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'full_time',  label: 'Full-time' },
  { value: 'part_time',  label: 'Part-time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary',  label: 'Temporary' },
]

export default function JobEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeSite } = useWebsiteStore()
  const isNew = !id

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job-posting', id],
    queryFn: () => careersService.getById(id!),
    enabled: !isNew && !!id,
    staleTime: 0,
  })

  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [benefits, setBenefits]       = useState('')

  const [slug, setSlug]               = useState('')
  const [department, setDepartment]   = useState('')
  const [location, setLocation]       = useState('')
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time')
  const [isRemote, setIsRemote]       = useState(false)
  const [salaryMin, setSalaryMin]     = useState<string>('')
  const [salaryMax, setSalaryMax]     = useState<string>('')
  const [salaryCurrency, setSalaryCurrency] = useState('USD')
  const [applicationType, setApplicationType] = useState<ApplicationType>('internal')
  const [externalApplyUrl, setExternalApplyUrl] = useState('')
  const [isFeatured, setIsFeatured]   = useState(false)
  const [status, setStatus]           = useState('draft')
  const [sortOrder, setSortOrder]     = useState(0)

  const [isSaving, setIsSaving]   = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { primaryLocale, isLoading: localesLoading } = useOrgLocales()
  const [locale, setLocale] = useState('id')
  const [localeTouched, setLocaleTouched] = useState(false)
  useEffect(() => {
    if (!localeTouched && !localesLoading && primaryLocale) setLocale(primaryLocale)
  }, [localeTouched, localesLoading, primaryLocale])
  const handleLocaleChange = useCallback((next: string) => {
    setLocale(next)
    setLocaleTouched(true)
  }, [])

  // Entity-level fields — not per-locale.
  useEffect(() => {
    if (!job) return
    setSlug(job.slug ?? '')
    setDepartment(job.department ?? '')
    setLocation(job.location ?? '')
    setEmploymentType(job.employment_type)
    setIsRemote(job.is_remote)
    setSalaryMin(job.salary_min != null ? String(job.salary_min) : '')
    setSalaryMax(job.salary_max != null ? String(job.salary_max) : '')
    setSalaryCurrency(job.salary_currency)
    setApplicationType(job.application_type)
    setExternalApplyUrl(job.external_apply_url ?? '')
    setIsFeatured(job.is_featured)
    setStatus(job.status)
    setSortOrder(job.sort_order)
  }, [job])

  // Translation-level fields.
  useEffect(() => {
    if (!job) return
    const tr = job.job_posting_translations?.find((t) => t.locale === locale)
    setTitle(tr?.title ?? '')
    setDescription(tr?.description ?? '')
    setRequirements(tr?.requirements ?? '')
    setBenefits(tr?.benefits ?? '')
  }, [job, locale])

  const doSave = useCallback(async () => {
    setSaveError(null)
    if (!title.trim()) { setSaveError('Job title is required'); return }
    if (applicationType === 'external' && !externalApplyUrl.trim()) {
      setSaveError('External Apply URL is required when Application Type is "External"')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        slug: slug.trim() || undefined,
        department: department.trim() || undefined,
        location: location.trim() || undefined,
        employment_type: employmentType,
        is_remote: isRemote,
        salary_min: salaryMin.trim() ? Number(salaryMin) : null,
        salary_max: salaryMax.trim() ? Number(salaryMax) : null,
        salary_currency: salaryCurrency.trim() || 'USD',
        application_type: applicationType,
        external_apply_url: applicationType === 'external' ? externalApplyUrl.trim() : null,
        is_featured: isFeatured,
        status: status as 'draft',
        sort_order: sortOrder,
        translations: [{ locale, title: title.trim(), description: description.trim(), requirements: requirements.trim(), benefits: benefits.trim() }],
      }

      if (isNew) {
        if (!activeSite?.id) throw new Error('No active site selected')
        const created = await careersService.create({ site_id: activeSite.id, ...payload })
        void queryClient.invalidateQueries({ queryKey: ['careers'] })
        navigate(`/careers/${created.id}/edit`, { replace: true })
      } else {
        await careersService.update(id!, payload)
        void queryClient.invalidateQueries({ queryKey: ['careers'] })
        void queryClient.invalidateQueries({ queryKey: ['job-posting', id] })
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [isNew, title, description, requirements, benefits, slug, department, location, employmentType, isRemote, salaryMin, salaryMax, salaryCurrency, applicationType, externalApplyUrl, isFeatured, status, sortOrder, activeSite, id, navigate, queryClient, locale])

  if (!isNew && isLoading) return <DashboardSkeleton />
  if (!isNew && error) {
    return (
      <div className="p-8 text-center text-[var(--s-danger)] font-body">
        Failed to load this job posting. Please go back and try again.
      </div>
    )
  }

  return (
    <ContentEditorLayout
      title={isNew ? 'New Job Posting' : 'Edit Job Posting'}
      subtitle={isNew ? 'Careers › New' : `Careers › ${title || id}`}
      onBack={() => navigate('/careers')}
      headerExtra={!isNew ? <LocaleSwitcher value={locale} onChange={handleLocaleChange} /> : undefined}
      sidebarContent={
        <>
          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Publish</h3>
            <div className="space-y-1.5">
              <label className="cms-label">Status</label>
              <Select className="w-full" value={status} onChange={setStatus} disabled={isSaving} options={STATUS_OPTIONS} />
            </div>
            <button type="button" className="cms-btn cms-btn-primary w-full justify-center" onClick={doSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : isNew ? 'Create Job Posting' : 'Save changes'}
            </button>
            {saveError && <p className="font-body text-xs text-[var(--s-danger)]">{saveError}</p>}
          </div>

          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Position details</h3>
            <FormField label="Slug" hint="Used for the job's detail page URL" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. sales-associate" />
            <FormField label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Sales" />
            <FormField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Los Angeles, CA" />
            <div className="space-y-1.5">
              <label className="cms-label">Employment type</label>
              <Select className="w-full" value={employmentType} onChange={(v) => setEmploymentType(v as EmploymentType)} options={EMPLOYMENT_TYPE_OPTIONS} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-[var(--text-primary)]">Remote-friendly</span>
              <Switch checked={isRemote} onChange={setIsRemote} />
            </div>
          </div>

          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Salary range</h3>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Min" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} placeholder="45000" />
              <FormField label="Max" type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} placeholder="75000" />
            </div>
            <FormField label="Currency" value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value.toUpperCase())} placeholder="USD" maxLength={3} />
          </div>

          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Application</h3>
            <div className="space-y-1.5">
              <label className="cms-label">Application type</label>
              <Select
                className="w-full"
                value={applicationType}
                onChange={(v) => setApplicationType(v as ApplicationType)}
                options={[
                  { value: 'internal', label: 'Internal (site apply form)' },
                  { value: 'external', label: 'External (ATS / job board link)' },
                ]}
              />
            </div>
            {/* Conditional display: only shown — and only required — when
                Application Type is "external". */}
            {applicationType === 'external' && (
              <FormField
                label="External Apply URL"
                required
                value={externalApplyUrl}
                onChange={(e) => setExternalApplyUrl(e.target.value)}
                placeholder="https://jobs.example.com/apply/…"
                hint="Visitors are sent here instead of the site's own apply form"
              />
            )}
            <div className="space-y-1.5">
              <label className="cms-label">Sort order</label>
              <input type="number" className="cms-input w-full" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-[var(--text-primary)]">
                Featured
                <span className="block font-body text-[11px] text-[var(--text-muted)] font-normal">Shows a "New" badge on the listing</span>
              </span>
              <Switch checked={isFeatured} onChange={setIsFeatured} />
            </div>
          </div>
        </>
      }
    >
      <div className="cms-card p-5 space-y-4">
        <FormField label="Job Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sales Associate" />
        <TextAreaField label="Description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this role does and why it matters." />
        <TextAreaField label="Requirements" rows={5} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="What we're looking for." />
        <TextAreaField label="Benefits" rows={4} value={benefits} onChange={(e) => setBenefits(e.target.value)} placeholder="What's in it for them." />
      </div>

      {saveError && (
        <div className="px-3 py-2 rounded-lg border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)]" role="alert">
          <p className="font-body text-xs text-[var(--cms-danger)]">{saveError}</p>
        </div>
      )}
    </ContentEditorLayout>
  )
}
