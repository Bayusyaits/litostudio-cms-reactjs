import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { heroService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { HeroPageView } from './HeroPageView'
import { HeroFormModal } from './HeroFormModal'
import type { HeroSlide, HeroStatus } from '@/types/content.types'

export default function HeroPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({
    search: '',
    status: '' as HeroStatus | '',
    page: 1,
    limit: 20,
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // null = closed | undefined = create mode | HeroSlide = edit mode
  const [modalSlide, setModalSlide] = useState<HeroSlide | undefined | null>(null)
  const isModalOpen = modalSlide !== null

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['hero', activeSite?.id, filter],
    queryFn: () =>
      heroService.getList({
        site_id: activeSite!.id,
        search:  filter.search || undefined,
        status:  filter.status || undefined,
        page:    filter.page,
        limit:   filter.limit,
      }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  // ── Mutations ─────────────────────────────────────────────────────────────

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

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedIds(checked ? (data?.data.map((h) => h.id) ?? []) : [])
    },
    [data],
  )

  const handleSaved = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['hero', activeSite?.id] })
    setModalSlide(null)
  }, [qc, activeSite?.id])

  return (
    <>
      <HeroPageView
        slides={data?.data ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        filter={filter}
        setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onCreate={() => setModalSlide(undefined)}
        onEdit={(slide) => setModalSlide(slide)}
        onDelete={(id) => deleteMutation.mutate(id)}
        onBulkDelete={(ids) => bulkDeleteMutation.mutate({ ids })}
      />

      {isModalOpen && activeSite && (
        <HeroFormModal
          slide={modalSlide ?? undefined}
          siteId={activeSite.id}
          onClose={() => setModalSlide(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
