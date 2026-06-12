import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { heroService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { HeroPageView } from './HeroPageView'
import type { ContentStatus } from '@/types/api.types'

export default function HeroPageContainer() {
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
    queryKey: ['hero', activeSite?.id, filter],
    queryFn: () =>
      heroService.getList({
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
    mutationFn: (id: string) => heroService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => heroService.bulkDelete({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hero', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? (data?.data.map((h) => h.id) ?? []) : [])
    },
    [data],
  )

  return (
    <HeroPageView
      slides={data?.data ?? []}
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
