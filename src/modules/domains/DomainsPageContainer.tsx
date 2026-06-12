import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrgStore } from '@/stores/org.store'
import { domainsService } from '@/services/domains.service'
import type { DomainRecord } from '@/services/domains.service'
import { useForm } from 'react-hook-form'

const SSL_BADGE: Record<string, string> = {
  active:  'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-700',
  error:   'bg-red-100 text-red-700',
}

export default function DomainsPageContainer() {
  const { org } = useOrgStore()
  const qc = useQueryClient()
  const orgId = org?.id ?? ''

  const domainsQuery = useQuery({
    queryKey: ['domains', orgId],
    queryFn: () => domainsService.list(orgId),
    enabled: !!orgId,
  })

  const [showAdd, setShowAdd] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Pick<DomainRecord, 'domain' | 'is_primary' | 'redirect_to_www'>>()

  const addMutation = useMutation({
    mutationFn: (v: Pick<DomainRecord, 'domain' | 'is_primary' | 'redirect_to_www'>) =>
      domainsService.add(orgId, v),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['domains', orgId] })
      setShowAdd(false)
      reset()
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => domainsService.verify(orgId, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['domains', orgId] }),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => domainsService.remove(orgId, id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['domains', orgId] }),
  })

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => domainsService.update(orgId, id, { is_primary: true }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['domains', orgId] }),
  })

  if (!orgId) {
    return <div className="p-6 text-gray-500">Select an organization to manage domains.</div>
  }

  const domains = domainsQuery.data?.data ?? []

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Domains</h1>
          <p className="text-sm text-gray-500 mt-1">Connect custom domains to your organization.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800"
        >
          + Add Domain
        </button>
      </div>

      {/* Add domain form */}
      {showAdd && (
        <form
          onSubmit={handleSubmit(v => addMutation.mutate(v))}
          className="p-4 border border-blue-200 rounded-md bg-blue-50 space-y-3"
        >
          <h3 className="text-sm font-semibold text-gray-700">Add Custom Domain</h3>
          <input
            {...register('domain', { required: 'Domain is required' })}
            placeholder="shop.yourbrand.com"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
          />
          {errors.domain && <p className="text-xs text-red-500">{errors.domain.message}</p>}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('is_primary')} className="h-4 w-4" />
              Set as primary domain
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('redirect_to_www')} className="h-4 w-4" />
              Redirect to www
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowAdd(false); reset() }} className="text-sm text-gray-600">Cancel</button>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50"
            >
              {addMutation.isPending ? 'Adding…' : 'Add Domain'}
            </button>
          </div>
        </form>
      )}

      {/* Domain list */}
      {domainsQuery.isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : domains.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">No custom domains yet.</p>
          <p className="text-gray-400 text-xs mt-1">Add a domain to connect it to your organization.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {domains.map(domain => (
            <div key={domain.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-gray-900">{domain.domain}</span>
                    {domain.is_primary && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Primary</span>
                    )}
                    {domain.is_verified ? (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">✓ Verified</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">Unverified</span>
                    )}
                    {domain.ssl_status && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${SSL_BADGE[domain.ssl_status] ?? ''}`}>
                        SSL: {domain.ssl_status}
                      </span>
                    )}
                  </div>

                  {!domain.is_verified && domain.verification_token && (
                    <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                      <p className="font-medium text-gray-700 mb-1">Add this DNS TXT record to verify:</p>
                      {(domain.dns_records ?? []).map((rec, i) => (
                        <div key={i} className="font-mono text-gray-600">
                          <span className="text-gray-400">{rec.type} </span>{rec.name} → <span className="break-all">{rec.value}</span>
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
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                    >
                      Check verification
                    </button>
                  )}
                  {!domain.is_primary && domain.is_verified && (
                    <button
                      onClick={() => domain.id && setPrimaryMutation.mutate(domain.id)}
                      className="text-xs text-gray-600 hover:underline whitespace-nowrap"
                    >
                      Set as primary
                    </button>
                  )}
                  <button
                    onClick={() => domain.id && removeMutation.mutate(domain.id)}
                    className="text-xs text-red-500 hover:underline"
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
