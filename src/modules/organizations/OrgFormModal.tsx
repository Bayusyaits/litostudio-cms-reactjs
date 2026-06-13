// apps/cms/src/modules/organizations/OrgFormModal.tsx
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Building2 } from 'lucide-react'
import type { Organization } from '@/types/auth.types'

// ── Schema ────────────────────────────────────────────────────────────────────

const orgSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Max 80 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(48, 'Max 48 characters')
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'Lowercase letters, numbers, and hyphens only'),
})

type OrgFormValues = z.infer<typeof orgSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  org?: Organization | null
  onSave: (payload: { name: string; slug: string }) => Promise<void>
  onClose: () => void
}

export function OrgFormModal({ org, onSave, onClose }: Props) {
  const isEdit = !!org
  const nameRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    mode: 'onChange',
    defaultValues: {
      name: org?.name ?? '',
      slug: org?.slug ?? '',
    },
  })

  const nameValue = watch('name')

  // Auto-derive slug from name in create mode only
  useEffect(() => {
    if (!isEdit) {
      setValue('slug', toSlug(nameValue ?? ''), { shouldValidate: true })
    }
  }, [nameValue, isEdit, setValue])

  // Focus name on mount
  useEffect(() => {
    setTimeout(() => nameRef.current?.focus(), 60)
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function onSubmit(values: OrgFormValues) {
    try {
      await onSave({ name: values.name.trim(), slug: values.slug.trim() })
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Something went wrong' })
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="org-modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'cmsPageIn 160ms ease-out both',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--cms-card-bg)',
        border: '1px solid var(--lito-border)',
        borderRadius: 12,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid var(--lito-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(212,168,83,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={16} style={{ color: 'var(--lito-gold-deep)' }} />
            </div>
            <h2
              id="org-modal-title"
              style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--text-primary)' }}
            >
              {isEdit ? 'Edit Organization' : 'Create Organization'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ padding: '20px 20px 0' }}>
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label className="cms-label" htmlFor="org-name">
              Organization name
              <span className="text-[var(--s-danger)] ml-0.5" aria-hidden>*</span>
            </label>
            <input
              {...register('name')}
              ref={e => {
                register('name').ref(e)
                ;(nameRef as React.MutableRefObject<HTMLInputElement | null>).current = e
              }}
              id="org-name"
              type="text"
              className="cms-input"
              placeholder="e.g. Lito Studio"
              maxLength={80}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'org-name-error' : undefined}
              style={{ height: 36 }}
            />
            {errors.name && (
              <p id="org-name-error" role="alert" style={{ marginTop: 4, fontSize: 11, color: 'var(--s-danger)', fontFamily: 'var(--font-body)' }}>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Slug */}
          <div style={{ marginBottom: 20 }}>
            <label className="cms-label" htmlFor="org-slug">
              URL slug
              {isEdit && (
                <span style={{ marginLeft: 6, fontSize: 10, textTransform: 'none', fontWeight: 400, color: 'var(--text-faint)', letterSpacing: 0 }}>
                  (changing may break links)
                </span>
              )}
              <span className="text-[var(--s-danger)] ml-0.5" aria-hidden>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                {...register('slug', {
                  onChange: e => {
                    // Sanitize on manual edit
                    e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  },
                })}
                id="org-slug"
                type="text"
                className="cms-input"
                placeholder="e.g. lito-studio"
                maxLength={48}
                aria-invalid={!!errors.slug}
                aria-describedby={errors.slug ? 'org-slug-error' : 'org-slug-hint'}
                style={{ height: 36, paddingRight: 72 }}
              />
              <span style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 10, color: 'var(--text-faint)', pointerEvents: 'none',
              }}>
                {watch('slug')?.length ?? 0}/48
              </span>
            </div>
            {errors.slug ? (
              <p id="org-slug-error" role="alert" style={{ marginTop: 4, fontSize: 11, color: 'var(--s-danger)', fontFamily: 'var(--font-body)' }}>
                {errors.slug.message}
              </p>
            ) : (
              <p id="org-slug-hint" style={{ marginTop: 4, fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-body)' }}>
                Lowercase letters, numbers, hyphens only. Used in URLs.
              </p>
            )}
          </div>

          {/* Server error */}
          {errors.root && (
            <div style={{
              marginBottom: 16, padding: '8px 12px', borderRadius: 6,
              background: 'var(--cms-danger-bg)', color: 'var(--cms-danger)',
              fontSize: 12, fontFamily: 'var(--font-body)',
            }}>
              {errors.root.message}
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            padding: '12px 0 18px',
            borderTop: '1px solid var(--lito-border)',
            marginTop: 4,
          }}>
            <button type="button" onClick={onClose} className="cms-btn cms-btn-ghost cms-btn-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid || (isEdit && !isDirty)}
              className="cms-btn cms-btn-primary cms-btn-sm"
            >
              {isSubmitting
                ? (isEdit ? 'Saving…' : 'Creating…')
                : (isEdit ? 'Save changes' : 'Create organization')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
