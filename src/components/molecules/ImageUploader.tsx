/**
 * ImageUploader — drag-and-drop or click-to-upload image component.
 *
 * Deferred upload pattern:
 *   1. User selects / drops a file.
 *   2. We create a blob URL for instant preview and register the file in
 *      draftMediaStore — NO network request happens here.
 *   3. The parent form receives the blob URL via onChange.
 *   4. When the form saves, the parent calls draftMediaStore.resolveUrl(url)
 *      which uploads the file to R2 and returns the real CDN URL.
 *   5. Only committed (saved) content ever touches R2 storage.
 *
 * Props:
 *   value   — current URL (CDN URL or blob: URL) or null
 *   onChange — called with the new URL after selection, or null on removal
 *   folder  — R2 folder prefix registered in draftMediaStore (default: 'content')
 *   disabled
 */

import { useCallback, useRef, useState } from 'react'
import { UploadCloud, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { draftMediaStore } from '@/stores/draftMedia.store'

interface ImageUploaderProps {
  value?: string | null
  onChange: (url: string | null) => void
  folder?: string
  disabled?: boolean
  className?: string
  /** Max file size in bytes — default 5 MB */
  maxBytes?: number
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const DEFAULT_MAX = 5 * 1024 * 1024 // 5 MB

export function ImageUploader({
  value,
  onChange,
  folder = 'content',
  disabled,
  className,
  maxBytes = DEFAULT_MAX,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      if (!ACCEPTED.includes(file.type)) {
        setError('Only JPEG, PNG, WebP, GIF, or AVIF images are allowed.')
        return
      }
      if (file.size > maxBytes) {
        setError(`File must be under ${Math.round(maxBytes / 1024 / 1024)} MB.`)
        return
      }

      // If the previous value was a blob URL we own, revoke it
      if (value?.startsWith('blob:')) {
        draftMediaStore.revokeDraft(value)
      }

      // Register the new draft — no upload yet
      const blobUrl = draftMediaStore.registerDraft(file, folder)
      onChange(blobUrl)
    },
    [folder, maxBytes, onChange, value],
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      handleFile(files[0])
    },
    [handleFile],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (!disabled) handleFiles(e.dataTransfer.files)
    },
    [disabled, handleFiles],
  )

  const handleRemove = useCallback(() => {
    if (value?.startsWith('blob:')) {
      draftMediaStore.revokeDraft(value)
    }
    onChange(null)
  }, [value, onChange])

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  return (
    <div className={cn('space-y-2', className)}>
      {/* Preview */}
      {value ? (
        <div className="relative group w-full h-40 rounded-[var(--radius-md)] overflow-hidden border border-[var(--lito-border)]">
          <img src={value} alt="Cover" className="w-full h-full object-cover" />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="cms-btn cms-btn-sm bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Upload image"
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={cn(
            'flex flex-col items-center justify-center gap-2 w-full h-36',
            'border-2 border-dashed rounded-[var(--radius-md)] transition-colors cursor-pointer',
            dragging
              ? 'border-[var(--lito-teal)] bg-[rgba(26,74,90,0.06)]'
              : 'border-[var(--lito-border)] hover:border-[var(--lito-teal)] hover:bg-[rgba(26,74,90,0.03)]',
            disabled && 'opacity-60 cursor-not-allowed',
          )}
        >
          <>
            <div className="w-10 h-10 rounded-full bg-[rgba(26,74,90,0.08)] flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-[var(--lito-teal)]" />
            </div>
            <div className="text-center">
              <p className="font-body text-sm text-[var(--text-primary)]">
                <span className="font-medium text-[var(--lito-teal)]">Click to upload</span> or drag & drop
              </p>
              <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
                JPEG, PNG, WebP, GIF up to {Math.round(maxBytes / 1024 / 1024)} MB
              </p>
            </div>
          </>
        </div>
      )}

      {/* URL fallback hint */}
      {!value && (
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[var(--text-faint)]" />
          <span className="font-body text-xs text-[var(--text-faint)]">
            Or paste a URL directly in the cover image field below
          </span>
        </div>
      )}

      {error && (
        <p className="font-body text-xs text-[var(--s-danger)]" role="alert">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
        aria-hidden
        tabIndex={-1}
      />
    </div>
  )
}
