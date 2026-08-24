import { Users, Trash2, Plus, PenLine, Search, X, Star } from 'lucide-react'
import { Button, StatusBadge, Badge, SearchInput, DataTable, Select, AppImageThumb, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { formatRelative } from '@/lib/utils'
import type { TeamMember } from '@/types/content.types'

function getName(m: TeamMember): string {
  return m.team_member_translations?.[0]?.name ?? '—'
}
function getRole(m: TeamMember): string | undefined {
  return m.team_member_translations?.[0]?.role
}

interface Filter {
  search: string
  status: string
  department: string
  page: number
  limit: number
}

interface Props {
  members: TeamMember[]
  meta?: { total: number; page: number; limit: number }
  isLoading: boolean
  filter: Filter
  setFilter: (f: Partial<Filter>) => void
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onNew: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function TeamMembersPageView({
  members, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onSelectAll,
  onNew, onEdit, onDelete, onBulkDelete,
}: Props) {
  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: 'Member',
      sortable: true,
      render: (m) => (
        <div className="flex items-center gap-3">
          {m.photo ? (
            <AppImageThumb src={m.photo} alt={getName(m)} size={36} radius="4px" skeleton={false} />
          ) : (
            <div className="w-9 h-9 rounded bg-[var(--lito-cream-alt)] flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
            </div>
          )}
          <div>
            <p className="font-body text-sm font-medium text-[var(--text-muted)]">{getName(m)}</p>
            {getRole(m) && <p className="font-body text-xs text-[var(--text-muted)]">{getRole(m)}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      width: '140px',
      render: (m) => (
        m.department
          ? <Badge variant="default">{m.department}</Badge>
          : <span className="font-body text-xs text-[var(--text-faint)]">—</span>
      ),
    },
    {
      key: 'featured',
      header: '',
      width: '36px',
      render: (m) => (
        m.is_featured
          ? <Star className="w-4 h-4 text-[var(--s-warning,#d4a017)] fill-current" aria-label="Featured" />
          : null
      ),
    },
    {
      key: 'sort_order',
      header: 'Order',
      width: '80px',
      render: (m) => <span className="font-body text-xs text-[var(--text-muted)]">{m.sort_order}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (m) => <StatusBadge skin="cms" status={m.status} />,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      width: '120px',
      render: (m) => <span className="font-body text-xs text-[var(--text-muted)]">{formatRelative(m.updated_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onEdit(m.id)} aria-label="Edit">
            <PenLine className="w-3.5 h-3.5" />
          </Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onDelete(m.id)} aria-label="Delete">
            <Trash2 className="w-3.5 h-3.5 text-[var(--s-danger)]" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Team Members</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} member${meta.total !== 1 ? 's' : ''}` : 'Manage the people shown on your Our Team page'}
          </p>
        </div>
        <Button skin="cms" leftIcon={<Plus className="w-4 h-4" />} onClick={onNew}>
          New Team Member
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <SearchInput
          skin="cms"
          icon={<Search className="w-3.5 h-3.5" />}
          clearIcon={<X className="w-3.5 h-3.5" />}
          value={filter.search}
          onChange={(search) => setFilter({ search, page: 1 })}
          placeholder="Search team members…"
          className="w-64"
        />
        <Select
          className="w-40"
          value={filter.status}
          onChange={(v) => setFilter({ status: v, page: 1 })}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'active', label: 'Published' },
            { value: 'draft', label: 'Draft' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
      </div>

      <div className="cms-card overflow-hidden">
        <DataTable
          data={members}
          columns={columns}
          keyField="id"
          loading={isLoading}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onSelectAll={onSelectAll}
          emptyTitle="No team members yet"
          emptyDescription="Add the people who make up your team"
          emptyIcon={<Users />}
          bulkActions={[
            {
              key: 'delete',
              label: 'Delete',
              icon: <Trash2 className="w-3.5 h-3.5" />,
              variant: 'danger',
              onClick: onBulkDelete,
            },
          ]}
        />
      </div>
    </div>
  )
}
