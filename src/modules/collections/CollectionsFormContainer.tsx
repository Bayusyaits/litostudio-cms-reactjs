import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { collectionsService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { getErrorMessage } from '@/lib/axios'
import { CollectionsFormView } from './CollectionsFormView'

export default function CollectionsFormContainer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { activeSite } = useWebsiteStore()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!id

  const { data: collection, isLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => collectionsService.getById(id!),
    enabled: isEdit,
  })

  const createMutation = useMutation({
    mutationFn: collectionsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections', activeSite?.id] })
      navigate('/collections')
    },
    onError: (err) => setServerError(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof collectionsService.update>[1]) =>
      collectionsService.update(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections', activeSite?.id] })
      navigate('/collections')
    },
    onError: (err) => setServerError(getErrorMessage(err)),
  })

  const handleSubmit = (values: Parameters<typeof collectionsService.create>[0]) => {
    setServerError(null)
    if (isEdit) updateMutation.mutate(values)
    else createMutation.mutate({ ...values, site_id: activeSite!.id })
  }

  return (
    <CollectionsFormView
      collection={collection}
      isLoading={isLoading && isEdit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      isEdit={isEdit}
      serverError={serverError}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/collections')}
    />
  )
}
