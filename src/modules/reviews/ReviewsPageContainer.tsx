import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { ReviewsPageView } from './ReviewsPageView'
import type { ReviewStatus } from '@/types/content.types'

export default function ReviewsPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({
    search: '',
    status: '' as ReviewStatus | '',
    page: 1,
    limit: 20,
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', activeSite?.id, filter],
    queryFn: () =>
      reviewsService.getList({
        site_id: activeSite!.id,
        search: filter.search || undefined,
        status: filter.status || undefined,
        page: filter.page,
        limit: filter.limit,
      }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewsService.update(id, { status: 'approved' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', activeSite?.id] }),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => reviewsService.update(id, { status: 'rejected' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', activeSite?.id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => reviewsService.bulkDelete({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? (data?.data.map((r) => r.id) ?? []) : [])
    },
    [data],
  )

  return (
    <ReviewsPageView
      reviews={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onSelectAll={handleSelectAll}
      onApprove={(id) => approveMutation.mutate(id)}
      onReject={(id) => rejectMutation.mutate(id)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onBulkDelete={(ids) => bulkDeleteMutation.mutate({ ids })}
    />
  )
}
