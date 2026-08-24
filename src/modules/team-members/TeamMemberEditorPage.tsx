/**
 * TeamMemberEditorPage — dedicated create/edit page for a single team member.
 *
 * Bespoke, not SimpleContentEditorPage (same reasoning as FaqEditorPage.tsx:
 * team_members is a dedicated table + team_member_translations, not the
 * shared content_items/content_translations shape).
 *
 * Routes: /team-members/new and /team-members/:id/edit.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { teamMembersService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { ContentEditorLayout } from '@/components/organisms/ContentEditorLayout'
import { Switch } from '@/components/atoms/Switch'
import { LocaleSwitcher } from '@/components/molecules/LocaleSwitcher'
import { useOrgLocales } from '@/hooks/useOrgLocales'
import { DashboardSkeleton, TextAreaField, Select, ImageUploader, FormField, draftMediaStore } from '@litostudio/ui-cms'

// Matches the real `team_members.status` CHECK constraint.
const STATUS_OPTIONS = [
  { value: 'draft',    label: 'Draft' },
  { value: 'active',   label: 'Published' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

export default function TeamMemberEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeSite } = useWebsiteStore()
  const isNew = !id

  const { data: member, isLoading, error } = useQuery({
    queryKey: ['team-member', id],
    queryFn: () => teamMembersService.getById(id!),
    enabled: !isNew && !!id,
    staleTime: 0,
  })

  const [name, setName]           = useState('')
  const [role, setRole]           = useState('')
  const [bio, setBio]             = useState('')
  const [slug, setSlug]           = useState('')
  const [photo, setPhoto]         = useState<string | null>(null)
  const [department, setDepartment] = useState('')
  const [email, setEmail]         = useState('')
  const [linkedin, setLinkedin]   = useState('')
  const [twitter, setTwitter]     = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite]     = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [status, setStatus]       = useState('draft')
  const [sortOrder, setSortOrder] = useState(0)

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
    if (!member) return
    setSlug(member.slug ?? '')
    setPhoto(member.photo ?? null)
    setDepartment(member.department ?? '')
    setEmail(member.email ?? '')
    setLinkedin(member.social_links?.linkedin ?? '')
    setTwitter(member.social_links?.twitter ?? '')
    setInstagram(member.social_links?.instagram ?? '')
    setWebsite(member.social_links?.website ?? '')
    setIsFeatured(member.is_featured)
    setStatus(member.status)
    setSortOrder(member.sort_order)
  }, [member])

  // Translation-level fields — re-runs when the selected locale changes.
  useEffect(() => {
    if (!member) return
    const tr = member.team_member_translations?.find((t) => t.locale === locale)
    setName(tr?.name ?? '')
    setRole(tr?.role ?? '')
    setBio(tr?.bio ?? '')
  }, [member, locale])

  const doSave = useCallback(async () => {
    setSaveError(null)
    if (!name.trim()) { setSaveError('Name is required'); return }
    if (!role.trim()) { setSaveError('Role is required'); return }

    setIsSaving(true)
    try {
      // Deferred-upload pattern: photo may be a blob: URL from ImageUploader
      // until now — resolveUrl() is a no-op for already-committed URLs.
      const resolvedPhoto = photo ? await draftMediaStore.resolveUrl(photo) : null

      const socialLinks: Record<string, string> = {}
      if (linkedin.trim())  socialLinks.linkedin  = linkedin.trim()
      if (twitter.trim())   socialLinks.twitter   = twitter.trim()
      if (instagram.trim()) socialLinks.instagram = instagram.trim()
      if (website.trim())   socialLinks.website   = website.trim()

      if (isNew) {
        if (!activeSite?.id) throw new Error('No active site selected')
        const created = await teamMembersService.create({
          site_id: activeSite.id,
          slug: slug.trim() || undefined,
          photo: resolvedPhoto ?? undefined,
          department: department.trim() || undefined,
          email: email.trim() || undefined,
          social_links: socialLinks,
          is_featured: isFeatured,
          status: status as 'draft',
          sort_order: sortOrder,
          translations: [{ locale, name: name.trim(), role: role.trim(), bio: bio.trim() }],
        })
        void queryClient.invalidateQueries({ queryKey: ['team-members'] })
        navigate(`/team-members/${created.id}/edit`, { replace: true })
      } else {
        await teamMembersService.update(id!, {
          slug: slug.trim() || undefined,
          photo: resolvedPhoto ?? undefined,
          department: department.trim() || undefined,
          email: email.trim() || undefined,
          social_links: socialLinks,
          is_featured: isFeatured,
          status: status as 'draft',
          sort_order: sortOrder,
          translations: [{ locale, name: name.trim(), role: role.trim(), bio: bio.trim() }],
        })
        void queryClient.invalidateQueries({ queryKey: ['team-members'] })
        void queryClient.invalidateQueries({ queryKey: ['team-member', id] })
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [isNew, name, role, bio, slug, photo, department, email, linkedin, twitter, instagram, website, isFeatured, status, sortOrder, activeSite, id, navigate, queryClient, locale])

  if (!isNew && isLoading) return <DashboardSkeleton />
  if (!isNew && error) {
    return (
      <div className="p-8 text-center text-[var(--s-danger)] font-body">
        Failed to load this team member. Please go back and try again.
      </div>
    )
  }

  return (
    <ContentEditorLayout
      title={isNew ? 'New Team Member' : 'Edit Team Member'}
      subtitle={isNew ? 'Team Members › New' : `Team Members › ${name || id}`}
      onBack={() => navigate('/team-members')}
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
              {isSaving ? 'Saving…' : isNew ? 'Create Team Member' : 'Save changes'}
            </button>
            {saveError && <p className="font-body text-xs text-[var(--s-danger)]">{saveError}</p>}
          </div>

          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Photo</h3>
            <ImageUploader value={photo} onChange={setPhoto} folder="team-members" disabled={isSaving} />
          </div>

          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Details</h3>
            <FormField
              label="Slug"
              hint="Used for the member's detail page URL — leave blank to auto-generate"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. amara-sutanto"
            />
            <FormField label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Leadership" />
            <FormField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            <div className="space-y-1.5">
              <label className="cms-label">Sort order</label>
              <input type="number" className="cms-input w-full" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-[var(--text-primary)]">
                Featured
                <span className="block font-body text-[11px] text-[var(--text-muted)] font-normal">Shown first / highlighted on the site</span>
              </span>
              <Switch checked={isFeatured} onChange={setIsFeatured} />
            </div>
          </div>

          <div className="cms-card p-4 space-y-3">
            <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Social links</h3>
            <FormField label="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" />
            <FormField label="Twitter / X" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" />
            <FormField label="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/…" />
            <FormField label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
        </>
      }
    >
      <div className="cms-card p-5 space-y-4">
        <FormField label="Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amara Sutanto" />
        <FormField label="Role" required value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Founder & CEO" />
        <TextAreaField
          label="Bio"
          rows={6}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short biography shown on the member's detail page."
        />
      </div>

      {saveError && (
        <div className="px-3 py-2 rounded-lg border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)]" role="alert">
          <p className="font-body text-xs text-[var(--cms-danger)]">{saveError}</p>
        </div>
      )}
    </ContentEditorLayout>
  )
}
