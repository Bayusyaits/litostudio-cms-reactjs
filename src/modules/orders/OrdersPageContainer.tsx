import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersService } from '@/services/content.service'
import { useWebsiteStore, useToast, getErrorMessage } from '@litostudio/ui-cms'
import { OrdersPageView } from './OrdersPageView'
import type { OrderStatus } from '@/types/commerce.types'

export default function OrdersPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const toast = useToast()

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

  // Bug hunt fix (2026-07-16): this mutation had no onError at all. The
  // status <select> in OrdersPageView is controlled directly off the
  // `orders` list-query data (no local pending state), so on failure it
  // silently reverts to the pre-change value with zero feedback — the user
  // has no way to tell a permission error / invalid transition / network
  // blip from "it just didn't visually update." Surfacing the failure via
  // the shared toast system (mounted at app root, previously unused by any
  // module) and re-invalidating so the select is guaranteed to reflect the
  // server's real, authoritative status either way.
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders', activeSite?.id] }),
    onError: (err) => {
      toast.show({ message: 'Could not update order status', description: getErrorMessage(err), variant: 'error' })
      qc.invalidateQueries({ queryKey: ['orders', activeSite?.id] })
    },
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
