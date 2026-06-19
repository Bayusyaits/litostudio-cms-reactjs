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
      className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.55)] flex items-center justify-center p-5 [animation:cmsPageIn_160ms_ease-out_both]"
    >
      <div className="w-full max-w-[480px] bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.35)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-[18px] border-b border-[var(--lito-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgba(212,168,83,0.12)] flex items-center justify-center">
              <Building2 size={16} className="text-[var(--lito-gold-deep)]" />
            </div>
            <h2
              id="org-modal-title"
              className="font-display text-[18px] font-normal text-[var(--text-muted)]"
            >
              {isEdit ? 'Edit Organization' : 'Create Organization'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="bg-transparent border-none cursor-pointer text-[var(--text-muted)] p-1 rounded flex"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="px-5 pt-5">
          {/* Name */}
          <div className="mb-4">
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
              className="cms-input h-9"
              placeholder="e.g. Lito Studio"
              maxLength={80}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'org-name-error' : undefined}
            />
            {errors.name && (
              <p id="org-name-error" role="alert" className="mt-1 text-[11px] text-[var(--s-danger)] font-body">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Slug */}
          <div className="mb-5">
            <label className="cms-label" htmlFor="org-slug">
              URL slug
              {isEdit && (
                <span className="ml-1.5 text-[10px] normal-case font-normal text-[var(--text-faint)] tracking-normal">
                  (changing may break links)
                </span>
              )}
              <span className="text-[var(--s-danger)] ml-0.5" aria-hidden>*</span>
            </label>
            <div className="relative">
              <input
                {...register('slug', {
                  onChange: e => {
                    // Sanitize on manual edit
                    e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  },
                })}
                id="org-slug"
                type="text"
                className="cms-input h-9 pr-[72px]"
                placeholder="e.g. lito-studio"
                maxLength={48}
                aria-invalid={!!errors.slug}
                aria-describedby={errors.slug ? 'org-slug-error' : 'org-slug-hint'}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-faint)] pointer-events-none">
                {watch('slug')?.length ?? 0}/48
              </span>
            </div>
            {errors.slug ? (
              <p id="org-slug-error" role="alert" className="mt-1 text-[11px] text-[var(--s-danger)] font-body">
                {errors.slug.message}
              </p>
            ) : (
              <p id="org-slug-hint" className="mt-1 text-[11px] text-[var(--text-faint)] font-body">
                Lowercase letters, numbers, hyphens only. Used in URLs.
              </p>
            )}
          </div>

          {/* Server error */}
          {errors.root && (
            <div className="mb-4 px-3 py-2 rounded-md bg-[var(--cms-danger-bg)] text-[var(--cms-danger)] text-xs font-body">
              {errors.root.message}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 py-3 border-t border-[var(--lito-border)] mt-1 pb-[18px]">
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
