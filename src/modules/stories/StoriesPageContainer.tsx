import { useNavigate } from 'react-router-dom'
import { StoriesPageView } from './StoriesPageView'
import { useStories } from './hooks/useStories'

// Bulk-delete (`bulkDeleteMutation`) already existed fully wired in
// useStories() but was never surfaced in the UI — the old raw <table> had a
// decorative, non-functional "select all"/per-row checkbox column with no
// onChange handlers at all. EnterpriseDataTable's `rowSelection`+
// `bulkActions` (skin="cms") makes that real. `selectedIds`/`handleSelect`/
// `handleSelectAll`/`sortKey`/`sortOrder`/`handleSort` from useStories() stay
// unused here — EnterpriseDataTable owns row-selection state internally
// (bulkActions.onClick receives the selected ids directly) and the original
// view never exposed sortable column headers either.
export default function StoriesPageContainer() {
  const navigate = useNavigate()
  const {
    stories, meta, isLoading,
    filter, setFilter,
    deleteMutation, bulkDeleteMutation,
  } = useStories()

  return (
    <StoriesPageView
      stories={stories}
      isLoading={isLoading}
      search={filter.search}
      onSearchChange={(search) => setFilter({ ...filter, search, page: 1 })}
      total={meta?.total ?? 0}
      limit={filter.limit}
      offset={(filter.page - 1) * filter.limit}
      onPageChange={(offset) => setFilter({ ...filter, page: Math.floor(offset / filter.limit) + 1 })}
      onEdit={(id) => navigate(`/stories/${id}/edit`)}
      onOpenEditor={(id) => navigate(`/stories/${id}/edit`)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onBulkDelete={(ids) => bulkDeleteMutation.mutate(ids)}
      statusCounts={undefined}
    />
  )
}
