import { Building2, Trash2, LayoutTemplate, Pencil, Plus, Search, X } from 'lucide-react'
import { Button, SearchInput, DataTable, type DataTableColumn as Column } from '@litostudio/ui-cms'
import { getTitle } from '@/types/content.types'
import type { Brand } from '@/types/content.types'

interface Props {
  brands: Brand[]
  isLoading: boolean
  search: string
  onSearch: (v: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onOpenEditor: (id: string) => void
  onNew: () => void
}

export function BrandsPageView({ brands, isLoading, search, onSearch, onEdit, onDelete, onOpenEditor, onNew }: Props) {
  const columns: Column<Brand>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (b) => <span className="font-body text-sm font-medium text-[var(--text-muted)]">{getTitle(b)}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (b) => <span className="font-body text-xs text-[var(--text-muted)]">{b.category || '—'}</span>,
    },
    {
      key: 'slug',
      header: 'Slug',
      render: (b) => <span className="font-body text-xs text-[var(--text-muted)]">{b.slug}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (b) => (
        <div className="flex items-center gap-1 justify-end">
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onEdit(b.id)} aria-label="Edit fields" title="Edit fields">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onOpenEditor(b.id)} aria-label="Open in editor" title="Open in editor">
            <LayoutTemplate className="w-3.5 h-3.5" />
          </Button>
          <Button skin="cms" size="icon" variant="ghost" onClick={() => onDelete(b.id)} aria-label="Delete brand">
            <Trash2 className="w-3.5 h-3.5 text-[var(--s-danger)]" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Brands</h1>
        <Button skin="cms" onClick={onNew} leftIcon={<Plus className="w-4 h-4" />}>
          New Brand
        </Button>
      </div>
      <SearchInput skin="cms" icon={<Search className="w-3.5 h-3.5" />} clearIcon={<X className="w-3.5 h-3.5" />} value={search} onChange={onSearch} placeholder="Search brands…" className="w-64" />
      <div className="cms-card overflow-hidden">
        <DataTable
          data={brands}
          columns={columns}
          keyField="id"
          loading={isLoading}
          emptyTitle="No brands"
          emptyIcon={<Building2 />}
        />
      </div>
    </div>
  )
}
