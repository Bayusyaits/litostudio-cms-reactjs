import { useState, useCallback } from 'react'
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

export function useStories() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState<StoriesFilter>({
    search: '',
    status: '',
    page: 1,
    limit: 20,
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sortKey, setSortKey] = useState('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const queryKey = ['stories', activeSite?.id, filter, sortKey, sortOrder]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      storiesService.getList({
        site_id: activeSite!.id,
        search: filter.search || undefined,
        status: filter.status || undefined,
        page: filter.page,
        limit: filter.limit,
        sort: sortKey,
        order: sortOrder,
      }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storiesService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => storiesService.bulkDelete({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ContentStatus }) =>
      storiesService.bulkUpdate({ ids, data: { status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
      else { setSortOrder('desc') }
      return key
    })
  }, [])

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id))
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? (data?.data.map((s) => s.id) ?? []) : [])
  }, [data])

  return {
    stories: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    filter,
    setFilter,
    selectedIds,
    handleSelect,
    handleSelectAll,
    sortKey,
    sortOrder,
    handleSort,
    deleteMutation,
    bulkDeleteMutation,
    bulkStatusMutation,
  }
}
