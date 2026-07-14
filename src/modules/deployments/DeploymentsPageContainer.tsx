import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { http, EnterpriseDataTable } from '@litostudio/ui-cms'
import type { EDTColumn } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'
import { useOrgStore } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { RepublishPagesModal } from '@/modules/themes/RepublishPagesModal'
import { RefreshCw } from 'lucide-react'

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
  // Index signature — lets this satisfy EnterpriseDataTable's
  // `T extends Record<string, unknown>` generic constraint (an `interface`
  // without one isn't structurally assignable to a Record type, even though
  // every declared property already is). Same convention as
  // apps/cms-superadmin/src/types/api.types.ts's SAOrganization/SAUser.
  [key: string]: unknown
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

const deploymentColumns: EDTColumn<Deployment>[] = [
  {
    key: 'site',
    label: 'Site',
    render: (dep) => <span className="text-[var(--text-primary)]">{dep.sites?.name ?? dep.site_id.slice(0, 8)}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (dep) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[dep.status] ?? ''}`}>
        {dep.status.replace('_', ' ')}
      </span>
    ),
  },
  {
    key: 'environment',
    label: 'Environment',
    render: (dep) => <span className="text-[var(--text-muted)]">{dep.environment ?? '—'}</span>,
  },
  {
    key: 'version',
    label: 'Version',
    render: (dep) => (
      <span className="font-mono text-xs text-[var(--text-muted)]">
        {dep.version ?? dep.commit_hash?.slice(0, 8) ?? '—'}
      </span>
    ),
  },
  {
    key: 'started_at',
    label: 'Started',
    sortable: true,
    render: (dep) => <span className="text-[var(--text-muted)] text-xs">{formatDate(dep.started_at)}</span>,
  },
  {
    key: 'completed_at',
    label: 'Completed',
    render: (dep) => <span className="text-[var(--text-muted)] text-xs">{formatDate(dep.completed_at)}</span>,
  },
]

export default function DeploymentsPageContainer() {
  const { org } = useOrgStore()
  const { activeSite } = useWebsiteStore()
  const [siteFilter, setSiteFilter] = useState(activeSite?.id ?? '')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const limit = 20
  const [showRepublish, setShowRepublish] = useState(false)

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
    <>
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Deployments</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Deployment history for your sites.</p>
        </div>
        {activeSite && (
          <button
            type="button"
            onClick={() => setShowRepublish(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--lito-border)] bg-transparent font-body text-[12px] text-[var(--text-muted)] cursor-pointer hover:border-[var(--lito-gold)] hover:text-[var(--text-primary)] transition-colors duration-150 shrink-0 mt-1"
          >
            <RefreshCw size={13} />
            Republish All Pages
          </button>
        )}
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
        <EnterpriseDataTable<Deployment>
          skin="cms"
          columns={deploymentColumns}
          data={deployments}
          loading={query.isLoading}
          server={{
            total,
            limit,
            offset: page * limit,
            onPageChange: (offset) => setPage(Math.floor(offset / limit)),
          }}
          emptyTitle="No deployments found"
        />
      </div>
    </div>

    {showRepublish && activeSite && (
      <RepublishPagesModal
        siteId={activeSite.id}
        templateName={
          (activeSite.settings as Record<string, unknown> | null)?.['template_slug'] as string
          ?? activeSite.template_slug
          ?? 'Current Template'
        }
        onClose={() => { setShowRepublish(false); query.refetch() }}
      />
    )}
    </>
  )
}
