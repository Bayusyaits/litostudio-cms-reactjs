// 2026-08-10 (user-requested independence split, follow-up to Blog/
// Portfolio): independent News CMS module, mirrors modules/blog/
// BlogPageContainer.tsx exactly — own service instance (newsService,
// content_type='news'), own query key ('news'), own routes (/news,
// /news/new, /news/:id/edit). No longer a website-only alias of Journal.
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { newsService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { NewsPageView } from './NewsPageView'

export default function NewsPageContainer() {
  const navigate = useNavigate()
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({ search: '', status: '', page: 1, limit: 20 })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['news', activeSite?.id, filter],
    queryFn: () =>
      newsService.getList({
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
    mutationFn: (id: string) => newsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => newsService.bulkDelete({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['news', activeSite?.id] })
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
    <NewsPageView
      posts={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onSelectAll={handleSelectAll}
      onNew={() => navigate('/news/new')}
      onEdit={(id) => navigate(`/news/${id}/edit`)}
      onOpenEditor={(id) => navigate(`/news/${id}/edit`)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onBulkDelete={(ids) => bulkDeleteMutation.mutate({ ids })}
    />
  )
}
