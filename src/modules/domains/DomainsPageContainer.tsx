import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrgStore, orgService, useToast, getErrorMessage, ConfirmDialog } from '@litostudio/ui-cms'
import type { Site } from '@litostudio/ui-cms'
import { domainsService } from '@/services/domains.service'
import type { DomainRecord, DomainDnsRecord } from '@/services/domains.service'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTracking } from '@/tracking'
import { FormInput, FormCheckbox } from '@litostudio/ui-cms'
import { useAuthStore } from '@/stores/auth.store'

// ── Redesign notes (2026-08-26) ─────────────────────────────────────────────
// Previous version of this page connected domains at the ORG level with no
// site selection at all — the only thing on screen was a domain textbox.
// That broke down for any org with more than one site (several already
// exist in production) since there was no way to say which site a domain
// should route to. This follows Shopify/Wix/WordPress.com's own model
// instead: a domain is connected to one SITE, listed under that site, with
// both the ownership (TXT) and routing (CNAME/A) records shown together —
// not a TXT-only instruction with routing left to guesswork — and a real
// "Verify" action that reports which of the two actually failed.

const domainSchema = z.object({
  domain: z.string()
    .min(1, 'Domain is required')
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/, 'Enter a valid domain (e.g. example.com)'),
  redirect_to_www: z.boolean().optional(),
})
type DomainFormValues = z.infer<typeof domainSchema>

const SSL_BADGE: Record<string, string> = {
  active:  'text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)]',
  pending: 'text-[var(--s-sched-fg)] bg-[var(--s-sched-bg)]',
  expired: 'text-[var(--cms-danger)] bg-[var(--cms-danger-bg)]',
  error:   'text-[var(--cms-danger)] bg-[var(--cms-danger-bg)]',
}

function RecordRow({ record }: { record: DomainDnsRecord }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className={`mt-0.5 shrink-0 text-xs ${record.verified ? 'text-[var(--s-pub-fg)]' : 'text-[var(--text-faint)]'}`}>
        {record.verified ? '✓' : '○'}
      </span>
      <div className="min-w-0 font-mono text-xs text-[var(--text-muted)]">
        <span className="text-[var(--text-faint)]">{record.type}</span>{' '}
        <span className="break-all">{record.name}</span> →{' '}
        <span className="break-all font-semibold">{record.value}</span>
        {record.note && <div className="font-sans text-[var(--text-faint)] mt-0.5">{record.note}</div>}
      </div>
    </div>
  )
}

function DomainCard({
  domain,
  onVerify,
  onSetPrimary,
  onRemove,
  verifyPending,
  canEdit,
}: {
  domain: DomainRecord
  onVerify: () => void
  onSetPrimary: () => void
  onRemove: () => void
  verifyPending: boolean
  canEdit: boolean
}) {
  const records = domain.dns_records ?? []
  const [showRecords, setShowRecords] = useState(!domain.is_verified)

  return (
    <div className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-[var(--text-muted)]">{domain.domain}</span>
            {domain.is_primary && (
              <span className="px-2 py-0.5 text-xs text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)] rounded-full">Primary</span>
            )}
            {domain.is_verified ? (
              <span className="px-2 py-0.5 text-xs text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)] rounded-full">✓ Connected</span>
            ) : (
              <span className="px-2 py-0.5 text-xs text-[var(--s-draft-fg)] bg-[var(--s-draft-bg)] rounded-full">Not connected</span>
            )}
            {domain.ssl_status && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${SSL_BADGE[domain.ssl_status] ?? ''}`}>
                SSL: {domain.ssl_status}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowRecords((v) => !v)}
            className="mt-2 text-xs text-[var(--lito-teal)] hover:underline"
          >
            {showRecords ? 'Hide DNS records' : 'Show DNS records'}
          </button>

          {showRecords && (
            <div className="mt-2 p-2 bg-[var(--cms-surface-2,rgba(0,0,0,0.02))] border border-[var(--lito-border)] rounded">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Add these records at your DNS provider:</p>
              {records.length === 0 ? (
                <p className="text-xs text-[var(--text-faint)]">No records recorded yet.</p>
              ) : (
                records.map((rec, i) => <RecordRow key={i} record={rec} />)
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 items-end shrink-0">
          {!domain.is_verified && (
            <button
              onClick={onVerify}
              disabled={verifyPending || !canEdit}
              title={!canEdit ? 'Contact store owner to modify settings' : undefined}
              className="text-xs text-[var(--lito-teal)] hover:underline whitespace-nowrap disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            >
              {verifyPending ? 'Checking…' : 'Verify connection'}
            </button>
          )}
          {!domain.is_primary && domain.is_verified && (
            <button
              onClick={onSetPrimary}
              disabled={!canEdit}
              title={!canEdit ? 'Contact store owner to modify settings' : undefined}
              className="text-xs text-[var(--text-muted)] hover:underline whitespace-nowrap disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            >
              Set as primary
            </button>
          )}
          <button
            onClick={onRemove}
            disabled={!canEdit}
            title={!canEdit ? 'Contact store owner to modify settings' : undefined}
            className="text-xs text-[var(--s-danger)] hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DomainsPageContainer() {
  const { org } = useOrgStore()
  const qc = useQueryClient()
  const orgId = org?.id ?? ''
  const { trackDomainConnected } = useTracking()
  const toast = useToast()
  // Connect/verify/remove/set-primary are all admin+-gated on the backend
  // (see organization.routes.ts's domains routes) — mirrored here so
  // non-admins see disabled controls instead of a 403 after clicking. See
  // cms-settings-rbac-audit-2026-08-27.md §3a and §9 Phase 4.
  const { user } = useAuthStore()
  const canEdit = user?.org_role === 'admin' || user?.org_role === 'owner'

  const sitesQuery = useQuery({
    queryKey: ['org-sites', orgId],
    queryFn: () => orgService.getSitesByOrg(orgId),
    enabled: !!orgId,
  })

  const domainsQuery = useQuery({
    queryKey: ['domains', orgId],
    queryFn: () => domainsService.list(orgId),
    enabled: !!orgId,
  })

  // Which site the "connect domain" form is currently open for — null means
  // closed. One site connects one domain at a time, same as clicking into a
  // single store's Domains settings on Shopify.
  const [connectingSiteId, setConnectingSiteId] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<DomainRecord | null>(null)

  const { control, handleSubmit, reset } = useForm<DomainFormValues>({
    resolver: zodResolver(domainSchema),
    mode: 'onChange',
    defaultValues: { redirect_to_www: false },
  })

  const addMutation = useMutation({
    mutationFn: (v: DomainFormValues & { site_id: string }) =>
      domainsService.add(orgId, { domain: v.domain, site_id: v.site_id, redirect_to_www: v.redirect_to_www }),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['domains', orgId] })
      setConnectingSiteId(null)
      setAddError(null)
      reset()
      trackDomainConnected({ site_id: variables.site_id, org_id: orgId, domain_type: 'custom' })
    },
    onError: (err) => setAddError(getErrorMessage(err)),
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => domainsService.verify(orgId, id),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['domains', orgId] })
      const result = res.data
      if (result && !result.ownershipVerified) {
        toast.show({ message: 'Ownership not verified', description: result.ownershipNote ?? 'TXT record not found yet.', variant: 'error' })
      } else if (result && !result.routingVerified) {
        toast.show({ message: 'Routing not verified', description: result.routingNote ?? 'CNAME/A record not found yet.', variant: 'error' })
      } else {
        toast.show({ message: 'Domain connected', variant: 'success' })
      }
    },
    onError: (err) => {
      toast.show({ message: 'Verification check failed', description: getErrorMessage(err), variant: 'error' })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => domainsService.remove(orgId, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['domains', orgId] }),
    onError: (err) => {
      toast.show({ message: 'Could not remove domain', description: getErrorMessage(err), variant: 'error' })
      void qc.invalidateQueries({ queryKey: ['domains', orgId] })
    },
  })

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => domainsService.update(orgId, id, { is_primary: true }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['domains', orgId] }),
    onError: (err) => {
      toast.show({ message: 'Could not set primary domain', description: getErrorMessage(err), variant: 'error' })
      void qc.invalidateQueries({ queryKey: ['domains', orgId] })
    },
  })

  if (!orgId) {
    return <div className="p-6 text-[var(--text-muted)]">Select an organization to manage domains.</div>
  }

  const sites: Site[] = sitesQuery.data?.data ?? []
  const domains = domainsQuery.data?.data ?? []
  const domainsBySite = new Map<string, DomainRecord[]>()
  const unassigned: DomainRecord[] = []
  for (const d of domains) {
    if (d.site_id) {
      const list = domainsBySite.get(d.site_id) ?? []
      list.push(d)
      domainsBySite.set(d.site_id, list)
    } else {
      unassigned.push(d)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Domains</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Each site gets its own domain — connect one below, the same way you would in Shopify or Wix.
        </p>
      </div>

      {sitesQuery.isLoading ? (
        <p className="text-sm text-[var(--text-faint)]">Loading sites…</p>
      ) : sites.length === 0 ? (
        <div className="text-center py-12 bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px]">
          <p className="text-[var(--text-muted)] text-sm">No sites yet.</p>
          <p className="text-[var(--text-faint)] text-xs mt-1">Create a site first, then connect a domain to it.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sites.map((site) => {
            const siteDomains = domainsBySite.get(site.id) ?? []
            const isConnecting = connectingSiteId === site.id
            return (
              <section key={site.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">{site.name}</h2>
                    <p className="text-xs text-[var(--text-faint)]">{site.slug}</p>
                  </div>
                  {!isConnecting && (
                    <button
                      onClick={() => { setAddError(null); reset(); setConnectingSiteId(site.id) }}
                      disabled={!canEdit}
                      title={!canEdit ? 'Contact store owner to modify settings' : undefined}
                      className="cms-btn cms-btn-secondary cms-btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {siteDomains.length === 0 ? '+ Connect Domain' : '+ Add Another Domain'}
                    </button>
                  )}
                </div>

                {isConnecting && (
                  <form
                    onSubmit={handleSubmit((v) => addMutation.mutate({ ...v, site_id: site.id }))}
                    className="p-4 border border-[var(--lito-border)] rounded-[6px] bg-[var(--cms-surface-3)] space-y-3"
                  >
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Connect a domain to {site.name}</h3>
                    <FormInput name="domain" control={control} placeholder="shop.yourbrand.com" inputClassName="font-mono" />
                    {addError && (
                      <div className="px-3 py-2 rounded-lg border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)]" role="alert">
                        <p className="text-xs text-[var(--cms-danger)]">{addError}</p>
                      </div>
                    )}
                    <FormCheckbox name="redirect_to_www" control={control} label="Redirect to www" />
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => { setConnectingSiteId(null); setAddError(null); reset() }} className="text-sm text-[var(--text-muted)]">
                        Cancel
                      </button>
                      <button type="submit" disabled={addMutation.isPending || !canEdit} className="cms-btn cms-btn-primary cms-btn-sm">
                        {addMutation.isPending ? 'Connecting…' : 'Connect Domain'}
                      </button>
                    </div>
                  </form>
                )}

                {siteDomains.length === 0 && !isConnecting ? (
                  <div className="text-center py-6 bg-[var(--cms-card-bg)] border border-dashed border-[var(--lito-border)] rounded-[8px]">
                    <p className="text-[var(--text-faint)] text-xs">No domain connected — visitors reach this site on its default URL only.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {siteDomains.map((domain) => (
                      <DomainCard
                        key={domain.id}
                        domain={domain}
                        verifyPending={verifyMutation.isPending && verifyMutation.variables === domain.id}
                        onVerify={() => domain.id && verifyMutation.mutate(domain.id)}
                        onSetPrimary={() => domain.id && setPrimaryMutation.mutate(domain.id)}
                        onRemove={() => setRemoveTarget(domain)}
                        canEdit={canEdit}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {unassigned.length > 0 && (
        <section className="space-y-2">
          <div>
            <h2 className="text-sm font-semibold text-[var(--cms-danger)]">Needs attention</h2>
            <p className="text-xs text-[var(--text-faint)]">
              These domains predate per-site connections and aren&apos;t linked to a site yet — remove and reconnect them to the right site.
            </p>
          </div>
          <div className="space-y-2">
            {unassigned.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                verifyPending={verifyMutation.isPending && verifyMutation.variables === domain.id}
                onVerify={() => domain.id && verifyMutation.mutate(domain.id)}
                onSetPrimary={() => domain.id && setPrimaryMutation.mutate(domain.id)}
                onRemove={() => setRemoveTarget(domain)}
                canEdit={canEdit}
              />
            ))}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => { if (removeTarget?.id) removeMutation.mutate(removeTarget.id); setRemoveTarget(null) }}
        title="Remove this domain?"
        description={`Visitors using "${removeTarget?.domain}" will no longer reach your site until it's reconnected. This cannot be undone.`}
        confirmLabel="Remove"
        variant="danger"
        closeIcon={<span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>×</span>}
      />
    </div>
  )
}
