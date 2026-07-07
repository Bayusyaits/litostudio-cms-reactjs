import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignsService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { CampaignsPageView } from './CampaignsPageView'
import type { ContentStatus } from '@/types/api.types'

export default function CampaignsPageContainer() {
  const navigate = useNavigate()
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
    queryKey: ['campaigns', activeSite?.id, filter],
    queryFn:  () =>
      campaignsService.getList({
        site_id: activeSite!.id,
        search:  filter.search || undefined,
        status:  filter.status || undefined,
        page:    filter.page,
        limit:   filter.limit,
      }),
    enabled:   !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => campaignsService.bulkDelete({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? (data?.data.map((c) => c.id) ?? []) : [])
    },
    [data],
  )

  return (
    <CampaignsPageView
      campaigns={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onSelectAll={handleSelectAll}
      onNew={() => navigate('/campaigns/new')}
      onEdit={(id) => navigate(`/campaigns/${id}/edit`)}
      onOpenEditor={(id) => navigate(`/campaigns/${id}/edit`)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onBulkDelete={(ids) => bulkDeleteMutation.mutate({ ids })}
    />
  )
}
