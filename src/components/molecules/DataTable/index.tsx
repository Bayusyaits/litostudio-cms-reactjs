import { useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { TableSkeleton } from '@/components/atoms/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Button } from '@/components/atoms/Button'
import { cn } from '@/lib/utils'
import type { DataTableProps } from './types'

export function DataTable<T>({
  data,
  columns,
  keyField,
  loading,
  selectedIds = [],
  onSelect,
  onSelectAll,
  sortKey,
  sortOrder,
  onSort,
  emptyTitle = 'No items found',
  emptyDescription,
  emptyIcon,
  bulkActions,
  className,
}: DataTableProps<T>) {
  const allSelected = data.length > 0 && selectedIds.length === data.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length
  const hasBulkActions = bulkActions && bulkActions.length > 0 && onSelect

  const sortIcon = useMemo(() => (key: string) => {
    if (sortKey !== key) return <ChevronsUpDown className="w-3 h-3 opacity-40" />
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 text-[var(--lito-gold)]" />
      : <ChevronDown className="w-3 h-3 text-[var(--lito-gold)]" />
  }, [sortKey, sortOrder])

  if (loading) return <TableSkeleton rows={6} cols={columns.length + (onSelect ? 1 : 0)} />

  return (
    <div className={cn('w-full', className)}>
      {/* Bulk action bar */}
      {hasBulkActions && selectedIds.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 bg-[var(--lito-gold-soft)] border-b border-[var(--lito-border)]"
          role="toolbar"
          aria-label="Bulk actions"
        >
          <span className="font-body text-xs font-medium text-[var(--text-primary)]">
            {selectedIds.length} selected
          </span>
          <div className="flex gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.key}
                size="sm"
                variant={action.variant === 'danger' ? 'danger' : 'ghost'}
                leftIcon={action.icon}
                onClick={() => action.onClick(selectedIds)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="cms-table" role="table">
          <thead>
            <tr>
              {onSelect && (
                <th className="w-10" aria-label="Select all">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(col.headerClass, col.sortable && 'cursor-pointer select-none')}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  aria-sort={sortKey === col.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortIcon(col.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelect ? 1 : 0)} className="p-0">
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const id = String(item[keyField])
                const isSelected = selectedIds.includes(id)
                return (
                  <tr
                    key={id}
                    className={cn(isSelected && 'selected')}
                    role="row"
                    aria-selected={isSelected}
                  >
                    {onSelect && (
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelect(id, e.target.checked)}
                          aria-label={`Select row ${index + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={col.className}>
                        {col.render
                          ? col.render(item, index)
                          : String((item as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
