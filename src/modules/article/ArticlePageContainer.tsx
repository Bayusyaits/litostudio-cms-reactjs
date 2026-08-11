// 2026-08-10 (user-requested independence split): independent Article CMS
// module, mirrors modules/blog/BlogPageContainer.tsx exactly — own service
// instance (articleService, content_type='article'), own query key
// ('article'), own routes (/articles, /articles/new, /articles/:id/edit).
// Article never had any prior UI (content_type='article' was an unused
// content_types seed row) — this is the first real module for it.
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { articleService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { ArticlePageView } from './ArticlePageView'

export default function ArticlePageContainer() {
  const navigate = useNavigate()
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({ search: '', status: '', page: 1, limit: 20 })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['article', activeSite?.id, filter],
    queryFn: () =>
      articleService.getList({
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
    mutationFn: (id: string) => articleService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => articleService.bulkDelete({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['article', activeSite?.id] })
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
    <ArticlePageView
      posts={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onSelectAll={handleSelectAll}
      onNew={() => navigate('/articles/new')}
      onEdit={(id) => navigate(`/articles/${id}/edit`)}
      onOpenEditor={(id) => navigate(`/articles/${id}/edit`)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onBulkDelete={(ids) => bulkDeleteMutation.mutate({ ids })}
    />
  )
}
