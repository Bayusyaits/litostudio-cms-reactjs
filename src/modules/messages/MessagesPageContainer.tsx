import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { MessagesPageView } from './MessagesPageView'
import type { ContactMessage } from '@/types/commerce.types'

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

  const markRepliedMutation = useMutation({
    mutationFn: (id: string) => messagesService.markReplied(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', activeSite?.id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => messagesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', activeSite?.id] }),
  })

  /**
   * Open system mail client with message context pre-filled.
   * Marks message as 'replied' after opening mailto link.
   */
  const handleReply = useCallback((msg: ContactMessage) => {
    const subject = encodeURIComponent(`Re: ${msg.subject ?? 'Your message'}`)
    const body    = encodeURIComponent(
      `\n\n---\nOriginal message from ${msg.name}:\n${msg.message}`,
    )
    window.open(`mailto:${msg.email}?subject=${subject}&body=${body}`, '_blank')
    markRepliedMutation.mutate(msg.id)
  }, [markRepliedMutation])

  return (
    <MessagesPageView
      messages={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      onMarkRead={(id) => markReadMutation.mutate(id)}
      onMarkReplied={(id) => markRepliedMutation.mutate(id)}
      onReply={handleReply}
      onDelete={(id) => deleteMutation.mutate(id)}
    />
  )
}
