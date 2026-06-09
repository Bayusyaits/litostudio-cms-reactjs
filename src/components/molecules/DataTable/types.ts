export interface Column<T> {
  key:          string
  header:       string
  render?:      (item: T, index: number) => React.ReactNode
  sortable?:    boolean
  className?:   string
  headerClass?: string
  width?:       string
}

export interface DataTableProps<T> {
  data:            T[]
  columns:         Column<T>[]
  keyField:        keyof T
  loading?:        boolean
  selectedIds?:    string[]
  onSelect?:       (id: string, checked: boolean) => void
  onSelectAll?:    (checked: boolean) => void
  sortKey?:        string
  sortOrder?:      'asc' | 'desc'
  onSort?:         (key: string) => void
  emptyTitle?:     string
  emptyDescription?: string
  emptyIcon?:      React.ComponentType<{ className?: string }>
  bulkActions?:    BulkAction[]
  className?:      string
}

export interface BulkAction {
  key:      string
  label:    string
  icon?:    React.ReactNode
  variant?: 'default' | 'danger'
  onClick:  (ids: string[]) => void
}
