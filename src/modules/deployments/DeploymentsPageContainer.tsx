import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { http } from '@/lib/request'
import type { ApiResponse } from '@/types/api.types'
import { useOrgStore } from '@/stores/org.store'
import { useWebsiteStore } from '@/stores/website.store'

interface Deployment {
  id: string
  site_id: string
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back'
  environment: string
  version: string | null
  commit_hash: string | null
  deployed_by: string | null
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
  sites?: { id: string; name: string; domain: string }
}

const STATUS_STYLE: Record<string, string> = {
  success:     'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  pending:     'bg-yellow-100 text-yellow-700',
  failed:      'bg-red-100 text-red-700',
  rolled_back: 'bg-gray-100 text-gray-600',
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

export default function DeploymentsPageContainer() {
  const { org } = useOrgStore()
  const { activeSite } = useWebsiteStore()
  const [siteFilter, setSiteFilter] = useState(activeSite?.id ?? '')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20

  const query = useQuery({
    queryKey: ['deployments', org?.id, siteFilter, statusFilter, page],
    queryFn: () => {
      const qs = new URLSearchParams({ limit: String(limit), offset: String(page * limit) })
      if (siteFilter) qs.set('site_id', siteFilter)
      if (statusFilter) qs.set('status', statusFilter)
      return http.get<ApiResponse<Deployment[]> & { total?: number }>(
        `/api/v1/cms/deployments?${qs.toString()}`,
      )
    },
    enabled: !!org?.id,
  })

  const deployments = query.data?.data ?? []
  const total = (query.data as { total?: number })?.total ?? 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
        <p className="text-sm text-gray-500 mt-1">Deployment history for your sites.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={siteFilter}
          onChange={e => { setSiteFilter(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">All sites</option>
          {activeSite && <option value={activeSite.id}>{activeSite.name ?? activeSite.id}</option>}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="in_progress">In Progress</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="rolled_back">Rolled Back</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {query.isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : deployments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No deployments found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Site</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Environment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Version</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Started</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deployments.map(dep => (
                <tr key={dep.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">
                    {dep.sites?.name ?? dep.site_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[dep.status] ?? ''}`}>
                      {dep.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{dep.environment ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {dep.version ?? dep.commit_hash?.slice(0, 8) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(dep.started_at)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(dep.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >← Prev</button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
