// apps/cms/src/modules/shipping/ShippingOriginsPageView.tsx
// Presentation only — list of shipping origins + the add/edit form
// (ShippingOriginForm) toggled inline, same "card list + inline add form"
// layout as CategoriesPageView.

import { Truck, MapPin, Trash2, Star, Plus, CheckCircle2, AlertCircle } from 'lucide-react'
import { Skeleton, EmptyState } from '@litostudio/ui-cms'
import { ShippingOriginForm } from './ShippingOriginForm'
import type { ShippingOrigin, ShippingOriginPayload } from '@/services/shipping-origins.service'

interface Props {
  origins: ShippingOrigin[]
  isLoading: boolean
  formOpen: boolean
  editing: ShippingOrigin | null
  onOpenAdd: () => void
  onOpenEdit: (origin: ShippingOrigin) => void
  onCloseForm: () => void
  onSubmit: (payload: ShippingOriginPayload) => void
  submitting: boolean
  saveError: string | null
  onDelete: (id: string) => void
  onSetDefault: (origin: ShippingOrigin) => void
}

function addressLine(o: ShippingOrigin): string {
  const parts = [o.village?.name, o.district?.name, o.regency?.name, o.province?.name].filter(Boolean)
  return parts.join(', ')
}

function OriginCard({ origin, onEdit, onDelete, onSetDefault }: {
  origin: ShippingOrigin
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}) {
  return (
    <div className="cms-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin size={15} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-body text-[13px] font-semibold text-[var(--text-primary)]">{origin.label}</span>
              {origin.is_default && (
                <span className="font-body text-[10px] font-semibold uppercase tracking-wide text-[var(--lito-teal)] bg-[rgba(0,128,128,0.08)] px-1.5 py-[1px] rounded">Default</span>
              )}
              {origin.biteship_location_id ? (
                <span className="inline-flex items-center gap-1 font-body text-[10px] text-[var(--s-success,#1a7f37)]">
                  <CheckCircle2 size={11} /> Courier-ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-body text-[10px] text-[var(--lito-gold-deep)]">
                  <AlertCircle size={11} /> Not registered with courier
                </span>
              )}
            </div>
            <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">{origin.address_line}</p>
            <p className="font-body text-xs text-[var(--text-faint)]">{addressLine(origin)} {origin.postal_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!origin.is_default && (
            <button type="button" onClick={onSetDefault} title="Set as default" className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-1.5 rounded hover:text-[var(--lito-gold-deep)] hover:bg-[rgba(0,0,0,0.04)]">
              <Star size={13} />
            </button>
          )}
          <button type="button" onClick={onEdit} className="cms-btn cms-btn-ghost cms-btn-sm">Edit</button>
          <button type="button" onClick={onDelete} title="Deactivate" className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-1.5 rounded hover:text-[var(--cms-danger)] hover:bg-[var(--cms-danger-bg)]">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function ShippingOriginsPageView({
  origins, isLoading, formOpen, editing, onOpenAdd, onOpenEdit, onCloseForm,
  onSubmit, submitting, saveError, onDelete, onSetDefault,
}: Props) {
  return (
    <div className="cms-page p-8 overflow-y-auto h-full">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)]">Shipping Origins</h1>
          <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
            Pickup addresses couriers ship from. Add coordinates to register an origin with your courier provider.
          </p>
        </div>
        {!formOpen && (
          <button type="button" onClick={onOpenAdd} className="cms-btn cms-btn-primary cms-btn-sm">
            <Plus size={13} /> Add origin
          </button>
        )}
      </div>

      {formOpen && (
        <div className="mb-6">
          <ShippingOriginForm
            initial={editing}
            onSubmit={onSubmit}
            onCancel={onCloseForm}
            submitting={submitting}
            error={saveError}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : origins.length === 0 ? (
        <EmptyState
          skin="cms"
          icon={<Truck className="w-6 h-6 text-[var(--lito-gold)]" aria-hidden />}
          title="No shipping origins yet"
          description="Add your warehouse or pickup address to start calculating courier rates."
        />
      ) : (
        <div className="space-y-3">
          {origins.map((o) => (
            <OriginCard
              key={o.id}
              origin={o}
              onEdit={() => onOpenEdit(o)}
              onDelete={() => onDelete(o.id)}
              onSetDefault={() => onSetDefault(o)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
