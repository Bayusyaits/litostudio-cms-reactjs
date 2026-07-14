import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { brandsService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { BrandsPageView } from './BrandsPageView'

export default function BrandsPageContainer() {
  const navigate = useNavigate()
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['brands', activeSite?.id, search],
    queryFn: () => brandsService.getList({ site_id: activeSite!.id, search: search || undefined }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => brandsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brands', activeSite?.id] }),
  })

  return (
    <BrandsPageView
      brands={data?.data ?? []}
      isLoading={isLoading}
      search={search}
      onSearch={setSearch}
      onNew={() => navigate('/brands/new')}
      onEdit={(id) => navigate(`/brands/${id}/edit`)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onOpenEditor={(id) => navigate(`/brands/${id}/edit`)}
    />
  )
}
