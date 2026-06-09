import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebsiteStore } from '@/stores/website.store'
import { pagesService, type PageStatus } from '@/services/pages.service'
import { PagesPageView } from './PagesPageView'

interface Filter {
  status: PageStatus | ''
  search: string
  page: number
}

export default function PagesPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const siteId = activeSite?.id ?? ''

  const [filter, setFilter] = useState<Filter>({ status: '', search: '', page: 1 })

  const query = useQuery({
    queryKey: ['pages', siteId, filter],
    queryFn:  () => pagesService.getList({ site_id: siteId, ...filter, limit: 20 }),
    enabled:  !!siteId,
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pagesService.remove(id),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: ['pages', siteId] }) },
  })

  return (
    <PagesPageView
      pages={query.data?.data ?? []}
      meta={query.data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 }}
      isLoading={query.isLoading}
      filter={filter}
      setFilter={(patch) => setFilter((f) => ({ ...f, ...patch }))}
      onDelete={(id) => deleteMutation.mutate(id)}
    />
  )
}
