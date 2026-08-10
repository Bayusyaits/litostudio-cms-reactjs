// 2026-08-10 (user-requested independence split): independent Portfolio CMS
// module, mirrors modules/journal/JournalPageContainer.tsx exactly — own
// service instance (portfolioService, content_type='portfolio'), own query
// key ('portfolio'), own routes (/portfolio, /portfolio/new,
// /portfolio/:id/edit). No longer an alias of Stories.
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portfolioService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { PortfolioPageView } from './PortfolioPageView'

export default function PortfolioPageContainer() {
  const navigate = useNavigate()
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({ search: '', status: '', page: 1, limit: 20 })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio', activeSite?.id, filter],
    queryFn: () =>
      portfolioService.getList({
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
    mutationFn: (id: string) => portfolioService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => portfolioService.bulkDelete({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id))
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? (data?.data.map((p) => p.id) ?? []) : [])
  }, [data])

  return (
    <PortfolioPageView
      posts={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onSelectAll={handleSelectAll}
      onNew={() => navigate('/portfolio/new')}
      onEdit={(id) => navigate(`/portfolio/${id}/edit`)}
      onOpenEditor={(id) => navigate(`/portfolio/${id}/edit`)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onBulkDelete={(ids) => bulkDeleteMutation.mutate({ ids })}
    />
  )
}
