import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService } from '@/services/content.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { OrdersPageView } from './OrdersPageView'
import type { OrderStatus } from '@/types/commerce.types'

export default function OrdersPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState({
    search: '',
    status: '' as OrderStatus | '',
    page: 1,
    limit: 20,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['orders', activeSite?.id, filter],
    queryFn: () =>
      ordersService.getList({
        site_id: activeSite!.id,
        search:  filter.search || undefined,
        status:  filter.status || undefined,
        page:    filter.page,
        limit:   filter.limit,
      }),
    enabled: !!activeSite,
    staleTime: 60 * 1000,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders', activeSite?.id] }),
  })

  const handleStatusChange = useCallback(
    (id: string, status: OrderStatus) => updateStatusMutation.mutate({ id, status }),
    [updateStatusMutation],
  )

  return (
    <OrdersPageView
      orders={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      onStatusChange={handleStatusChange}
    />
  )
}
