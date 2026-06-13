import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { newsletterService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { NewsletterPageView } from './NewsletterPageView'
import type { NewsletterStatus } from '@/types/commerce.types'

export default function NewsletterPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({
    search: '',
    status: '' as NewsletterStatus | '',
    page: 1,
    limit: 50,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['newsletter', activeSite?.id, filter],
    queryFn: () =>
      newsletterService.getList({
        site_id: activeSite!.id,
        search:  filter.search || undefined,
        status:  filter.status || undefined,
        page:    filter.page,
        limit:   filter.limit,
      }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: NewsletterStatus }) =>
      newsletterService.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsletter', activeSite?.id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsletterService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['newsletter', activeSite?.id] }),
  })

  return (
    <NewsletterPageView
      subscribers={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      onUpdateStatus={(id, status) => updateMutation.mutate({ id, status })}
      onDelete={(id) => deleteMutation.mutate(id)}
    />
  )
}
