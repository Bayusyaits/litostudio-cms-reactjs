import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { faqsService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { FaqsPageView } from './FaqsPageView'

export default function FaqsPageContainer() {
  const navigate = useNavigate()
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 20,
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['faqs', activeSite?.id, filter],
    queryFn: () =>
      faqsService.getList({
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
    mutationFn: (id: string) => faqsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => faqsService.bulkDelete({ ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faqs', activeSite?.id] })
      setSelectedIds([])
    },
  })

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? (data?.data.map((f) => f.id) ?? []) : [])
    },
    [data],
  )

  return (
    <FaqsPageView
      faqs={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onSelectAll={handleSelectAll}
      onNew={() => navigate('/faqs/new')}
      onEdit={(id) => navigate(`/faqs/${id}/edit`)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onBulkDelete={(ids) => bulkDeleteMutation.mutate({ ids })}
    />
  )
}
