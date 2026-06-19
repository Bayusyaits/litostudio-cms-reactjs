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
  success:     'text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)]',
  in_progress: 'text-[var(--s-sched-fg)] bg-[var(--s-sched-bg)]',
  pending:     'text-[var(--s-draft-fg)] bg-[var(--s-draft-bg)]',
  failed:      'text-[var(--cms-danger)] bg-[var(--cms-danger-bg)]',
  rolled_back: 'bg-[var(--cms-surface-3,rgba(0,0,0,0.04))] text-[var(--text-muted)]',
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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Deployments</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Deployment history for your sites.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={siteFilter}
          onChange={e => { setSiteFilter(e.target.value); setPage(0) }}
          className="border border-[var(--lito-border)] rounded px-3 py-2 text-sm !text-[#000000]"
        >
          <option value="">All sites</option>
          {activeSite && <option value={activeSite.id}>{activeSite.name ?? activeSite.id}</option>}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="border border-[var(--lito-border)] rounded px-3 py-2 text-sm !text-[#000000]"
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
      <div className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-[8px] overflow-hidden">
        {query.isLoading ? (
          <div className="p-8 text-center text-[var(--text-faint)] text-sm">Loading…</div>
        ) : deployments.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">No deployments found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--cms-surface-2,rgba(0,0,0,0.02))] border-b border-[var(--lito-border)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Site</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Status</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Environment</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Version</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Started</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--lito-border)]">
              {deployments.map(dep => (
                <tr key={dep.id} className="hover:bg-[var(--cms-surface-2,rgba(0,0,0,0.02))]">
                  <td className="px-4 py-3 text-[var(--text-primary)]">
                    {dep.sites?.name ?? dep.site_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[dep.status] ?? ''}`}>
                      {dep.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{dep.environment ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                    {dep.version ?? dep.commit_hash?.slice(0, 8) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{formatDate(dep.started_at)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{formatDate(dep.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-between items-center text-sm text-[var(--text-muted)]">
          <span>Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 border border-[var(--lito-border)] rounded disabled:opacity-40 hover:bg-[var(--cms-surface-2,rgba(0,0,0,0.02))]"
            >← Prev</button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
              className="px-3 py-1 border border-[var(--lito-border)] rounded disabled:opacity-40 hover:bg-[var(--cms-surface-2,rgba(0,0,0,0.02))]"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
