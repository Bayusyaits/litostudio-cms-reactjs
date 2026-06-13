import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { MessagesPageView } from './MessagesPageView'

export default function MessagesPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 20,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['messages', activeSite?.id, filter],
    queryFn: () =>
      messagesService.getList({
        site_id: activeSite!.id,
        search:  filter.search || undefined,
        status:  filter.status || undefined,
        page:    filter.page,
        limit:   filter.limit,
      }),
    enabled: !!activeSite,
    staleTime: 60 * 1000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => messagesService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', activeSite?.id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => messagesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', activeSite?.id] }),
  })

  return (
    <MessagesPageView
      messages={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      onMarkRead={(id) => markReadMutation.mutate(id)}
      onDelete={(id) => deleteMutation.mutate(id)}
    />
  )
}
