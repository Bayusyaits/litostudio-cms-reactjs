import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { storiesService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { StoryFormView } from './StoryFormView'
import { getErrorMessage } from '@/lib/axios'
import { useState } from 'react'

export default function StoryFormContainer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { activeSite } = useWebsiteStore()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!id

  const { data: story, isLoading } = useQuery({
    queryKey: ['story', id],
    queryFn: () => storiesService.getById(id!),
    enabled: isEdit,
    staleTime: 2 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: storiesService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] })
      navigate('/stories')
    },
    onError: (err) => setServerError(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ payload }: { payload: Parameters<typeof storiesService.update>[1] }) =>
      storiesService.update(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories'] })
      qc.invalidateQueries({ queryKey: ['story', id] })
      navigate('/stories')
    },
    onError: (err) => setServerError(getErrorMessage(err)),
  })

  const handleSubmit = (values: Parameters<typeof storiesService.create>[0]) => {
    setServerError(null)
    if (isEdit) {
      updateMutation.mutate({ payload: values })
    } else {
      createMutation.mutate({ ...values, site_id: activeSite!.id })
    }
  }

  return (
    <StoryFormView
      story={story}
      isLoading={isLoading && isEdit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      isEdit={isEdit}
      serverError={serverError}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/stories')}
    />
  )
}
