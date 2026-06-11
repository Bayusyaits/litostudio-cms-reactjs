import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { productsService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { getErrorMessage } from '@/lib/axios'
import { ProductsFormView } from './ProductsFormView'

export default function ProductsFormContainer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { activeSite } = useWebsiteStore()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!id

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getById(id!),
    enabled: isEdit,
  })

  const createMutation = useMutation({
    mutationFn: productsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', activeSite?.id] })
      navigate('/products')
    },
    onError: (err) => setServerError(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof productsService.update>[1]) =>
      productsService.update(id!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', activeSite?.id] })
      navigate('/products')
    },
    onError: (err) => setServerError(getErrorMessage(err)),
  })

  const handleSubmit = (values: Parameters<typeof productsService.create>[0]) => {
    setServerError(null)
    if (isEdit) updateMutation.mutate(values)
    else createMutation.mutate({ ...values, site_id: activeSite!.id })
  }

  return (
    <ProductsFormView
      product={product}
      isLoading={isLoading && isEdit}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      isEdit={isEdit}
      serverError={serverError}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/products')}
    />
  )
}
