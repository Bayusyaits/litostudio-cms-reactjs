import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, EnterpriseDataTable, Select } from '@litostudio/ui-cms'
import type { EDTColumn } from '@litostudio/ui-cms'
import type { ApiResponse } from '@/types/api.types'
import { useOrgStore } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { RepublishPagesModal } from '@/modules/themes/RepublishPagesModal'
import { RefreshCw, Rocket } from 'lucide-react'

// Field names/status values below match the REAL `deployments` table
// (migrations/*.sql, DB.sql) and apps/backend/src/modules/deployments —
// verified 2026-07-16 while adding the Deploy button below. Previously this
// interface listed fields that don't exist in the schema at all
// (commit_hash, deployed_by, completed_at, error_message, version, and a
// status value 'in_progress'/'rolled_back' the real CHECK constraint never
// allowed) — dead code that never matched what the API actually returns.
interface Deployment {
  id: string
  site_id: string
  status: 'pending' | 'building' | 'success' | 'failed' | 'cancelled' | 'blocked'
  environment: string
  deploy_url: string | null
  git_commit: string | null
  triggered_by: string | null
  provider: string
  started_at: string | null
  finished_at: string | null
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
  success:  'text-[var(--s-pub-fg)] bg-[var(--s-pub-bg)]',
  building: 'text-[var(--s-sched-fg)] bg-[var(--s-sched-bg)]',
  pending:  'text-[var(--s-draft-fg)] bg-[var(--s-draft-bg)]',
  failed:   'text-[var(--cms-danger)] bg-[var(--cms-danger-bg)]',
  cancelled: 'bg-[var(--cms-surface-3,rgba(0,0,0,0.04))] text-[var(--text-muted)]',
  blocked:  'bg-[var(--cms-surface-3,rgba(0,0,0,0.04))] text-[var(--text-muted)]',
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
    key: 'git_commit',
    label: 'Commit',
    render: (dep) => (
      <span className="font-mono text-xs text-[var(--text-muted)]">
        {dep.git_commit ? dep.git_commit.slice(0, 8) : '—'}
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
    key: 'finished_at',
    label: 'Finished',
    render: (dep) => <span className="text-[var(--text-muted)] text-xs">{formatDate(dep.finished_at)}</span>,
  },
  {
    key: 'deploy_url',
    label: 'URL',
    render: (dep) => dep.deploy_url
      ? <a href={dep.deploy_url} target="_blank" rel="noreferrer" className="text-[var(--lito-gold)] text-xs hover:underline">View</a>
      : <span className="text-[var(--text-muted)] text-xs">—</span>,
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
  const [deployError, setDeployError] = useState<string | null>(null)
  const queryClient = useQueryClient()

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

  // 2026-07-16: fires the site's Vercel Deploy Hook via the backend
  // (apps/backend sites.routes.ts POST /:siteId/deploy — shares its core
  // logic with cms-superadmin's Rebuild button, not a duplicate). Requires
  // the site to have vercel_deploy_hook_url configured first — the backend
  // returns a clear 503 message if it isn't, surfaced below as-is.
  const deployMutation = useMutation({
    mutationFn: () => {
      if (!activeSite) throw new Error('No active site selected')
      return http.post<ApiResponse<Deployment>>(`/api/v1/cms/sites/${activeSite.id}/deploy`, {})
    },
    onSuccess: () => {
      setDeployError(null)
      void queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },
    onError: (err: unknown) => {
      setDeployError(err instanceof Error ? err.message : 'Deploy failed — see console for details')
    },
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
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <button
              type="button"
              onClick={() => deployMutation.mutate()}
              disabled={deployMutation.isPending}
              title="Triggers a new build via this site's Vercel Deploy Hook"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--lito-gold)] bg-[var(--lito-gold)] font-body text-[12px] text-[var(--cms-bg,#fff)] cursor-pointer hover:opacity-90 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Rocket size={13} />
              {deployMutation.isPending ? 'Deploying…' : 'Deploy Now'}
            </button>
            <button
              type="button"
              onClick={() => setShowRepublish(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--lito-border)] bg-transparent font-body text-[12px] text-[var(--text-muted)] cursor-pointer hover:border-[var(--lito-gold)] hover:text-[var(--text-primary)] transition-colors duration-150"
            >
              <RefreshCw size={13} />
              Republish All Pages
            </button>
          </div>
        )}
      </div>

      {deployError && (
        <div className="px-4 py-2.5 rounded-lg text-[var(--cms-danger)] bg-[var(--cms-danger-bg)] text-sm" role="alert">
          {deployError}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select
          value={siteFilter}
          onChange={(v) => { setSiteFilter(v); setPage(0) }}
          options={[
            { value: '', label: 'All sites' },
            ...(activeSite ? [{ value: activeSite.id, label: activeSite.name ?? activeSite.id }] : []),
          ]}
        />
        <Select
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(0) }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'success', label: 'Success' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'pending', label: 'Pending' },
            { value: 'failed', label: 'Failed' },
            { value: 'rolled_back', label: 'Rolled Back' },
          ]}
        />
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
