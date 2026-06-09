import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { galleryService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { GalleryPageView } from './GalleryPageView'

export default function GalleryPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const [filter, setFilter] = useState({ search: '', page: 1, limit: 24 })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', activeSite?.id, filter],
    queryFn: () => galleryService.getList({ site_id: activeSite!.id, ...filter }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => galleryService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gallery', activeSite?.id] }); setSelectedIds([]) },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => galleryService.bulkDelete({ ids }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gallery', activeSite?.id] }); setSelectedIds([]) },
  })

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id))
  }, [])

  return (
    <GalleryPageView
      items={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      selectedIds={selectedIds}
      onSelect={handleSelect}
      onDelete={(id) => deleteMutation.mutate(id)}
      onBulkDelete={(ids) => bulkDeleteMutation.mutate({ ids })}
    />
  )
}
