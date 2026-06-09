import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { journalService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { getErrorMessage } from '@/lib/axios'
import { JournalFormView } from './JournalFormView'

export default function JournalFormContainer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { activeSite } = useWebsiteStore()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!id

  const { data: post, isLoading } = useQuery({
    queryKey: ['journal-post', id],
    queryFn: () => journalService.getById(id!),
    enabled: isEdit,
  })

  const createMutation = useMutation({
    mutationFn: journalService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); navigate('/journal') },
    onError: (err) => setServerError(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof journalService.update>[1]) =>
      journalService.update(id!, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); navigate('/journal') },
    onError: (err) => setServerError(getErrorMessage(err)),
  })

  const handleSubmit = (values: Parameters<typeof journalService.create>[0]) => {
    setServerError(null)
    if (isEdit) updateMutation.mutate(values)
    else createMutation.mutate({ ...values, site_id: activeSite!.id })
  }

  return (
    <JournalFormView
      post={post}
      isLoading={isLoading && isEdit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      isEdit={isEdit}
      serverError={serverError}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/journal')}
    />
  )
}
