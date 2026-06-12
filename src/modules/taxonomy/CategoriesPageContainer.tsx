import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService, type CategoryCreateRequest } from '@/services/taxonomy.service'
import { useWebsiteStore } from '@/stores/website.store'
import { getErrorMessage } from '@/lib/axios'
import { CategoriesPageView } from './CategoriesPageView'

export default function CategoriesPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['categories', activeSite?.id],
    queryFn: () => categoryService.getList(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CategoryCreateRequest) => categoryService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', activeSite?.id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', activeSite?.id] }),
  })

  const categories = (data?.data ?? []).filter(c =>
    search ? c.translations?.[0]?.name?.toLowerCase().includes(search.toLowerCase()) : true,
  )

  return (
    <CategoriesPageView
      categories={categories}
      total={data?.total ?? 0}
      isLoading={isLoading}
      search={search}
      onSearch={setSearch}
      onCreate={(payload) => {
        if (!activeSite) return
        createMutation.mutate({ ...payload, site_id: activeSite.id })
      }}
      creating={createMutation.isPending}
      createError={createMutation.isError ? getErrorMessage(createMutation.error) : null}
      onDelete={(id) => deleteMutation.mutate(id)}
    />
  )
}
