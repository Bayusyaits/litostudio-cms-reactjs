import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tagService, type TagCreateRequest } from '@/services/taxonomy.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { getErrorMessage } from '@/lib/axios'
import { TagsPageView } from './TagsPageView'

export default function TagsPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tags', activeSite?.id],
    queryFn: () => tagService.getList(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (payload: TagCreateRequest) => tagService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags', activeSite?.id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tagService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags', activeSite?.id] }),
  })

  const tags = (data?.data ?? []).filter(t =>
    search ? t.name.toLowerCase().includes(search.toLowerCase()) : true,
  )

  return (
    <TagsPageView
      tags={tags}
      total={data?.total ?? 0}
      isLoading={isLoading}
      search={search}
      onSearch={setSearch}
      onCreate={(name) => {
        if (!activeSite) return
        const slug = name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
        createMutation.mutate({ site_id: activeSite.id, name, slug })
      }}
      creating={createMutation.isPending}
      createError={createMutation.isError ? getErrorMessage(createMutation.error) : null}
      onDelete={(id) => deleteMutation.mutate(id)}
    />
  )
}
