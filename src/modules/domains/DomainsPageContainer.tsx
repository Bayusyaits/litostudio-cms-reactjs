import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrgStore } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { useToast, getErrorMessage } from '@litostudio/ui-cms'
import { domainsService } from '@/services/domains.service'
import type { DomainRecord } from '@/services/domains.service'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTracking } from '@/tracking'
import { FormInput, FormCheckbox } from '@litostudio/ui-cms'

// ── Schema ────────────────────────────────────────────────────────────────────

const domainSchema = z.object({
  domain:           z.string()
    .min(1, 'Domain is required')
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/, 'Enter a valid domain (e.g. example.com)'),
  is_primary:       z.boolean().optional(),
  redirect_to_www:  z.boolean().optional(),
})

const SSL_BADGE: Record<string, string> = {
  active:  'text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)]',
  pending: 'text-[var(--s-sched-fg)] bg-[var(--s-sched-bg)]',
  expired: 'text-[var(--cms-danger)] bg-[var(--cms-danger-bg)]',
  error:   'text-[var(--cms-danger)] bg-[var(--cms-danger-bg)]',
}

export default function DomainsPageContainer() {
  const { org } = useOrgStore()
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const orgId = org?.id ?? ''
  const { trackDomainConnected } = useTracking()
  const toast = useToast()

  const domainsQuery = useQuery({
    queryKey: ['domains', orgId],
    queryFn: () => domainsService.list(orgId),
    enabled: !!orgId,
  })

  const [showAdd, setShowAdd] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  // 2026-07 standardization pass: register() → Controller (see
  // cms-form-standardization-execution-plan-2026-07-16.md, Track A). `errors`
  // no longer destructured here — FormInput/FormCheckbox read fieldState
  // internally via Controller.
  const { control, handleSubmit, reset } = useForm<Pick<DomainRecord, 'domain' | 'is_primary' | 'redirect_to_www'>>({
    resolver: zodResolver(domainSchema),
    mode: 'onChange',
  })

  // Bug hunt fix (2026-07-16): NONE of this module's 4 mutations had an
  // onError handler, and — unlike every other module audited in this pass —
  // there was no error surface anywhere for add/verify/remove/set-primary,
  // not even a toast. A rejected domain add (duplicate, already claimed by
  // another org, invalid DNS target) silently left the form open with no
  // explanation; a failed verify/remove/set-primary gave literally nothing.
  // Wiring all 4 through the same toast + re-invalidate pattern used in
  // orders/promotions/shipping this session. Add also gets its own inline
  // error (mirrors promotions/shipping's saveError-in-form convention) since
  // that failure needs to stay visible next to the form, not just flash by
  // in a toast.
  const addMutation = useMutation({
    mutationFn: (v: Pick<DomainRecord, 'domain' | 'is_primary' | 'redirect_to_www'>) =>
      domainsService.add(orgId, v),
    onSuccess: (_, _variables) => {
      void qc.invalidateQueries({ queryKey: ['domains', orgId] })
      setShowAdd(false)
      setAddError(null)
      reset()
      if (activeSite) {
        trackDomainConnected({
          site_id:     activeSite.id,
          org_id:      orgId,
          domain_type: 'custom',
        })
      }
    },
    onError: (err) => setAddError(getErrorMessage(err)),
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => domainsService.verify(orgId, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['domains', orgId] }),
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

  const domains = domainsQuery.data?.data ?? []

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Custom Domains</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Connect custom domains to your organization.</p>
        </div>
        <button
          onClick={() => { setAddError(null); setShowAdd(true) }}
          className="cms-btn cms-btn-primary cms-btn-sm"
        >
          + Add Domain
        </button>
      </div>

      {/* Add domain form */}
      {showAdd && (
        <form
          onSubmit={handleSubmit(v => addMutation.mutate(v))}
          className="p-4 border border-[var(--lito-border)] rounded-[6px] bg-[var(--cms-surface-3)] space-y-3"
        >
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Add Custom Domain</h3>
          <FormInput
            name="domain"
            control={control}
            placeholder="shop.yourbrand.com"
            inputClassName="font-mono"
          />
          {addError && (
            <div className="px-3 py-2 rounded-lg border border-[var(--cms-danger)] bg-[var(--cms-danger-bg)]" role="alert">
              <p className="text-xs text-[var(--cms-danger)]">{addError}</p>
            </div>
          )}
          <div className="flex gap-6">
            <FormCheckbox name="is_primary" control={control} label="Set as primary domain" />
            <FormCheckbox name="redirect_to_www" control={control} label="Redirect to www" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowAdd(false); setAddError(null); reset() }} className="text-sm text-[var(--text-muted)]">Cancel</button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="cms-btn cms-btn-primary cms-btn-sm"
            >
              {addMutation.isPending ? 'Adding…' : 'Add Domain'}
            </button>
          </div>
        </form>
      )}

      {/* Domain list */}
      {domainsQuery.isLoading ? (
        <p className="text-sm text-[var(--text-faint)]">Loading…</p>
      ) : domains.length === 0 ? (
        <div className="text-center py-12 bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px]">
          <p className="text-[var(--text-muted)] text-sm">No custom domains yet.</p>
          <p className="text-[var(--text-faint)] text-xs mt-1">Add a domain to connect it to your organization.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {domains.map(domain => (
            <div key={domain.id} className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-[var(--text-muted)]">{domain.domain}</span>
                    {domain.is_primary && (
                      <span className="px-2 py-0.5 text-xs text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)] rounded-full">Primary</span>
                    )}
                    {domain.is_verified ? (
                      <span className="px-2 py-0.5 text-xs text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)] rounded-full">✓ Verified</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs text-[var(--s-draft-fg)] bg-[var(--s-draft-bg)] rounded-full">Unverified</span>
                    )}
                    {domain.ssl_status && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${SSL_BADGE[domain.ssl_status] ?? ''}`}>
                        SSL: {domain.ssl_status}
                      </span>
                    )}
                  </div>

                  {!domain.is_verified && domain.verification_token && (
                    <div className="mt-2 p-2 bg-[var(--cms-surface-2,rgba(0,0,0,0.02))] border border-[var(--lito-border)] rounded text-xs">
                      <p className="font-medium text-[var(--text-muted)] mb-1">Add this DNS TXT record to verify:</p>
                      {(domain.dns_records ?? []).map((rec, i) => (
                        <div key={i} className="font-mono text-[var(--text-muted)]">
                          <span className="text-[var(--text-faint)]">{rec.type} </span>{rec.name} → <span className="break-all">{rec.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 items-end shrink-0">
                  {!domain.is_verified && (
                    <button
                      onClick={() => domain.id && verifyMutation.mutate(domain.id)}
                      disabled={verifyMutation.isPending}
                      className="text-xs text-[var(--lito-teal)] hover:underline whitespace-nowrap"
                    >
                      Check verification
                    </button>
                  )}
                  {!domain.is_primary && domain.is_verified && (
                    <button
                      onClick={() => domain.id && setPrimaryMutation.mutate(domain.id)}
                      className="text-xs text-[var(--text-muted)] hover:underline whitespace-nowrap"
                    >
                      Set as primary
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!domain.id) return
                      // Bug hunt fix (2026-07-16): this was the only
                      // destructive action found across the whole audited
                      // codebase with zero confirmation of any kind — one
                      // misclick disconnects a live custom domain from the
                      // storefront. Shipping origins uses window.confirm()
                      // for its own "deactivate" action and promotions uses
                      // a full step-up MFA gate; a plain confirm() here
                      // matches the lower-severity end of that same
                      // established pattern.
                      if (window.confirm(`Remove ${domain.domain}? Visitors using this domain will no longer reach your site until it's reconnected.`)) {
                        removeMutation.mutate(domain.id)
                      }
                    }}
                    className="text-xs text-[var(--s-danger)] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
