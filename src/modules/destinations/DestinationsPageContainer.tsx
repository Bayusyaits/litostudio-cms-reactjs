import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { destinationsService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { DestinationsPageView } from './DestinationsPageView'

export default function DestinationsPageContainer() {
  const navigate = useNavigate()
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['destinations', activeSite?.id, search],
    queryFn: () => destinationsService.getList({ site_id: activeSite!.id, search: search || undefined }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => destinationsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['destinations', activeSite?.id] }),
  })

  return (
    <DestinationsPageView
      destinations={data?.data ?? []}
      isLoading={isLoading}
      search={search}
      onSearch={setSearch}
      onNew={() => navigate('/destinations/new')}
      onEdit={(id) => navigate(`/destinations/${id}/edit`)}
      onDelete={(id) => deleteMutation.mutate(id)}
      onOpenEditor={(id) => navigate(`/destinations/${id}/edit`)}
    />
  )
}
