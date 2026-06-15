import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebsiteStore } from '@/stores/website.store'
import { pagesService, type PageStatus } from '@/services/pages.service'
// pagesService now includes: updateMenuLabel, updateSortOrder, updateParentId
import { PagesPageView } from './PagesPageView'

interface Filter {
  status: PageStatus | ''
  search: string
  offset: number
}

const LIMIT = 20

export default function PagesPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const siteId = activeSite?.id ?? ''

  const [filter, setFilter] = useState<Filter>({ status: '', search: '', offset: 0 })

  const query = useQuery({
    queryKey: ['pages', siteId, filter],
    queryFn:  () => pagesService.getList({ site_id: siteId, limit: LIMIT, ...filter }),
    enabled:  !!siteId,
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pagesService.remove(id),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: ['pages', siteId] }) },
  })

  const toggleMenuMutation = useMutation({
    mutationFn: ({ id, is_in_menu }: { id: string; is_in_menu: boolean }) =>
      pagesService.toggleMenu(id, is_in_menu),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pages', siteId] }) },
  })

  const toggleHeaderMutation = useMutation({
    mutationFn: ({ id, is_header }: { id: string; is_header: boolean }) =>
      pagesService.toggleHeader(id, is_header),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pages', siteId] }) },
  })

  const toggleFooterMutation = useMutation({
    mutationFn: ({ id, is_footer }: { id: string; is_footer: boolean }) =>
      pagesService.toggleFooter(id, is_footer),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pages', siteId] }) },
  })

  const toggleMobileMenuMutation = useMutation({
    mutationFn: ({ id, is_mobile_menu }: { id: string; is_mobile_menu: boolean }) =>
      pagesService.toggleMobileMenu(id, is_mobile_menu),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pages', siteId] }) },
  })

  const updateMenuLabelMutation = useMutation({
    mutationFn: ({ id, menu_label }: { id: string; menu_label: string | null }) =>
      pagesService.updateMenuLabel(id, menu_label),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pages', siteId] }) },
  })

  const updateSortOrderMutation = useMutation({
    mutationFn: ({ id, sort_order }: { id: string; sort_order: number }) =>
      pagesService.updateSortOrder(id, sort_order),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pages', siteId] }) },
  })

  return (
    <PagesPageView
      pages={query.data?.data ?? []}
      meta={query.data?.meta ?? { total: 0, limit: LIMIT, offset: 0 }}
      isLoading={query.isLoading}
      filter={filter}
      setFilter={(patch) => setFilter((f) => ({ ...f, ...patch }))}
      onDelete={(id) => deleteMutation.mutate(id)}
      onToggleMenu={(id, is_in_menu) => toggleMenuMutation.mutate({ id, is_in_menu })}
      onToggleHeader={(id, is_header) => toggleHeaderMutation.mutate({ id, is_header })}
      onToggleFooter={(id, is_footer) => toggleFooterMutation.mutate({ id, is_footer })}
      onToggleMobileMenu={(id, is_mobile_menu) => toggleMobileMenuMutation.mutate({ id, is_mobile_menu })}
      onUpdateMenuLabel={(id, menu_label) => updateMenuLabelMutation.mutate({ id, menu_label })}
      onUpdateSortOrder={(id, sort_order) => updateSortOrderMutation.mutate({ id, sort_order })}
    />
  )
}
