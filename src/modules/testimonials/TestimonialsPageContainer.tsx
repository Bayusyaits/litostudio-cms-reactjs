import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { testimonialsService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { TestimonialsPageView } from './TestimonialsPageView'
import type { ContentStatus } from '@/types/api.types'

export default function TestimonialsPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({
    search: '',
    status: '' as ContentStatus | '',
    page: 1,
    limit: 20,
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['testimonials', activeSite?.id, filter],
    queryFn: () =>
      testimonialsService.getList({
        site_id: activeSite!.id,
        search: filter.search || undefined,
        status: filter.status || undefined,
        page: filter.page,
        limit: filter.limit,
      }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => testimonialsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonials', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => testimonialsService.bulkDelete({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['testimonials', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? (data?.data.map((t) => t.id) ?? []) : [])
    },
    [data],
  )

  return (
    <TestimonialsPageView
      testimonials={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onSelectAll={handleSelectAll}
      onDelete={(id) => deleteMutation.mutate(id)}
      onBulkDelete={(ids) => bulkDeleteMutation.mutate({ ids })}
    />
  )
}
