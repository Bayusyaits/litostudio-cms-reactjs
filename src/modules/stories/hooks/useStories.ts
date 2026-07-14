import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storiesService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import type { ContentStatus } from '@litostudio/ui-cms'

export interface StoriesFilter {
  search: string
  status: ContentStatus | ''
  page: number
  limit: number
}

// Fixed server-sort — there's no sort-column UI on StoriesPageView (never
// was, even before the EnterpriseDataTable migration), so this doesn't need
// to be mutable state. Kept as a named constant rather than inlined into the
// query below purely for readability.
const SORT_KEY = 'updated_at'
const SORT_ORDER = 'desc'

export function useStories() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState<StoriesFilter>({
    search: '',
    status: '',
    page: 1,
    limit: 20,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['stories', activeSite?.id, filter],
    queryFn: () =>
      storiesService.getList({
        site_id: activeSite!.id,
        search: filter.search || undefined,
        status: filter.status || undefined,
        page: filter.page,
        limit: filter.limit,
        sort: SORT_KEY,
        order: SORT_ORDER,
      }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storiesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories', activeSite?.id] }),
  })

  // Backs EnterpriseDataTable's `bulkActions` "Delete" button
  // (StoriesPageView.tsx) — row-selection state itself is owned internally
  // by EnterpriseDataTable, not here.
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => storiesService.bulkDelete({ ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories', activeSite?.id] }),
  })

  return {
    stories: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    filter,
    setFilter,
    deleteMutation,
    bulkDeleteMutation,
  }
}
