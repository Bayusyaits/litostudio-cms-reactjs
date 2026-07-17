import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shippingOriginsService, type ShippingOrigin, type ShippingOriginPayload } from '@/services/shipping-origins.service'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { getErrorMessage, useToast } from '@litostudio/ui-cms'
import { ShippingOriginsPageView } from './ShippingOriginsPageView'

export default function ShippingOriginsPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const toast = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing]   = useState<ShippingOrigin | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: origins, isLoading } = useQuery({
    queryKey: ['shipping-origins', activeSite?.id],
    queryFn: () => shippingOriginsService.getList(activeSite!.id),
    enabled: !!activeSite,
    staleTime: 60 * 1000,
  })

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['shipping-origins', activeSite?.id] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: ShippingOriginPayload) => shippingOriginsService.create(activeSite!.id, payload),
    onSuccess: () => { invalidate(); setFormOpen(false); setSaveError(null) },
    onError: (err) => setSaveError(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ShippingOriginPayload> }) =>
      shippingOriginsService.update(activeSite!.id, id, payload),
    onSuccess: () => { invalidate(); setFormOpen(false); setEditing(null); setSaveError(null) },
    onError: (err) => setSaveError(getErrorMessage(err)),
  })

  // Bug hunt fix (2026-07-16): same silent-failure class as promotions'
  // delete and orders' status update — no onError, and neither this
  // container nor ShippingOriginsPageView surfaces any delete-specific
  // error state (saveError/error prop is wired only to the create/update
  // form). A failed deactivation (e.g. last remaining origin, or a
  // courier-registered origin the backend refuses to remove) previously
  // gave zero feedback after the user confirmed the browser confirm()
  // dialog — the card just silently stays. Toast + re-invalidate, same
  // pattern as the other two fixes.
  const deleteMutation = useMutation({
    mutationFn: (id: string) => shippingOriginsService.remove(activeSite!.id, id),
    onSuccess: () => invalidate(),
    onError: (err) => {
      toast.show({ message: 'Could not deactivate shipping origin', description: getErrorMessage(err), variant: 'error' })
      invalidate()
    },
  })

  return (
    <ShippingOriginsPageView
      origins={origins ?? []}
      isLoading={isLoading}
      formOpen={formOpen}
      editing={editing}
      onOpenAdd={() => { setEditing(null); setSaveError(null); setFormOpen(true) }}
      onOpenEdit={(origin) => { setEditing(origin); setSaveError(null); setFormOpen(true) }}
      onCloseForm={() => { setFormOpen(false); setEditing(null); setSaveError(null) }}
      onSubmit={(payload) => {
        if (!activeSite) return
        if (editing) updateMutation.mutate({ id: editing.id, payload })
        else createMutation.mutate(payload)
      }}
      submitting={createMutation.isPending || updateMutation.isPending}
      saveError={saveError}
      onDelete={(id) => {
        if (confirm('Deactivate this shipping origin? Orders already using it are unaffected.')) {
          deleteMutation.mutate(id)
        }
      }}
      onSetDefault={(origin) => updateMutation.mutate({ id: origin.id, payload: { is_default: true } })}
    />
  )
}
