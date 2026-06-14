import { Map, Trash2, LayoutTemplate, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { SearchInput } from '@/components/molecules/SearchInput'
import { DataTable } from '@/components/molecules/DataTable'
import type { Column } from '@/components/molecules/DataTable/types'
import { getDestName } from '@/types/content.types'
import type { Destination } from '@/types/content.types'

interface Props {
  destinations: Destination[]
  isLoading: boolean
  search: string
  onSearch: (v: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onOpenEditor: (id: string) => void
  onNew: () => void
}

export function DestinationsPageView({ destinations, isLoading, search, onSearch, onEdit, onDelete, onOpenEditor, onNew }: Props) {
  const columns: Column<Destination>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (d) => <span className="font-body text-sm font-medium text-[var(--text-primary)]">{getDestName(d)}</span>,
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (d) => <span className="font-body text-xs text-[var(--text-muted)]">{d.slug}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (d) => (
        <div className="flex items-center gap-1 justify-end">
          <Button size="icon" variant="ghost" onClick={() => onEdit(d.id)} aria-label="Edit fields" title="Edit fields">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onOpenEditor(d.id)} aria-label="Open in editor" title="Open in editor">
            <LayoutTemplate className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(d.id)} aria-label="Delete destination">
            <Trash2 className="w-3.5 h-3.5 text-[var(--s-danger)]" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Destinations</h1>
        <Button onClick={onNew} leftIcon={<Plus className="w-4 h-4" />}>
          New Destination
        </Button>
      </div>
      <SearchInput value={search} onChange={onSearch} placeholder="Search destinations…" className="w-64" />
      <div className="cms-card overflow-hidden">
        <DataTable
          data={destinations}
          columns={columns}
          keyField="id"
          loading={isLoading}
          emptyTitle="No destinations"
          emptyIcon={Map}
        />
      </div>
    </div>
  )
}
