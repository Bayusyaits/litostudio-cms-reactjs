/**
 * ImageUploader — drag-and-drop / click-to-upload OR paste-URL image component.
 *
 * Two input modes (toggle tabs):
 *   • Upload — drag-drop / click file picker (deferred R2 upload via draftMediaStore)
 *   • URL    — paste an external image URL directly; no upload required
 *
 * Deferred upload pattern (Upload mode):
 *   1. User selects / drops a file.
 *   2. We create a blob URL for instant preview and register the file in
 *      draftMediaStore — NO network request happens here.
 *   3. The parent form receives the blob URL via onChange.
 *   4. When the form saves, the parent calls draftMediaStore.resolveUrl(url)
 *      which uploads the file to R2 and returns the real CDN URL.
 *   5. Only committed (saved) content ever touches R2 storage.
 *
 * Broken-image handling:
 *   The preview <img> always has an onError handler that swaps to a
 *   built-in placeholder SVG — the broken-image browser icon never shows.
 *
 * Props:
 *   value   — current URL (CDN URL, blob: URL, or external http URL) or null
 *   onChange — called with the new URL after selection, or null on removal
 *   folder  — R2 folder prefix registered in draftMediaStore (default: 'content')
 *   disabled
 */

import { useCallback, useRef, useState } from 'react'
import { UploadCloud, Link2, X, ImageIcon, AlertCircle } from 'lucide-react'
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

/** Inline placeholder SVG — zero network request, scales to any container */
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Crect width='400' height='240' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%239CA3AF'%3ENo image%3C/text%3E%3C/svg%3E"

type Mode = 'upload' | 'url'

function isExternalUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://')
}

export function ImageUploader({
  value,
  onChange,
  folder = 'content',
  disabled,
  className,
  maxBytes = DEFAULT_MAX,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Determine initial mode from current value
  const [mode, setMode] = useState<Mode>(() =>
    value && isExternalUrl(value) && !value.startsWith('blob:') ? 'url' : 'upload',
  )
  const [urlDraft, setUrlDraft] = useState<string>(
    value && isExternalUrl(value) && !value.startsWith('blob:') ? value : '',
  )

  // ── Upload mode handlers ───────────────────────────────────────────────────

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

      // Revoke previous blob if owned by this uploader
      if (value?.startsWith('blob:')) {
        draftMediaStore.revokeDraft(value)
      }

      const blobUrl = draftMediaStore.registerDraft(file, folder)
      setImgError(false)
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
    setUrlDraft('')
    setImgError(false)
    setError(null)
    onChange(null)
  }, [value, onChange])

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  // ── URL mode handler ───────────────────────────────────────────────────────

  const applyUrl = useCallback(() => {
    const trimmed = urlDraft.trim()
    if (!trimmed) {
      setError('Please enter a valid image URL.')
      return
    }
    if (!isExternalUrl(trimmed)) {
      setError('URL must start with http:// or https://')
      return
    }
    setError(null)
    setImgError(false)
    onChange(trimmed)
  }, [urlDraft, onChange])

  // ── Mode switch ────────────────────────────────────────────────────────────

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    // Don't clear value on switch — user might just be switching tabs
  }

  // ── Shared preview (both modes) ────────────────────────────────────────────

  const previewSrc = imgError ? PLACEHOLDER : (value || PLACEHOLDER)

  return (
    <div className={cn('space-y-2', className)}>
      {/* ── Mode tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-[2px] p-[3px] rounded-[6px] bg-[var(--cms-surface-3)] border border-[var(--lito-border)] w-full">
        {(['upload', 'url'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-[4px] rounded-[4px] font-body text-[11px] font-medium transition-all',
              mode === m
                ? 'bg-[var(--cms-card-bg)] text-[var(--text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.06)] w-full'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            )}
          >
            {m === 'upload'
              ? <><UploadCloud size={11} /> Upload</>
              : <><Link2 size={11} /> URL</>
            }
          </button>
        ))}
      </div>

      {/* ── Preview (shown when value is set) ─────────────────────────────── */}
      {value ? (
        <div className="relative group w-full h-40 rounded-[var(--radius-md)] overflow-hidden border border-[var(--lito-border)] bg-[var(--cms-surface-3)]">
          <img
            src={previewSrc}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          {imgError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[var(--cms-surface-3)]">
              <AlertCircle size={20} className="text-[var(--text-faint)]" />
              <span className="font-body text-xs text-[var(--text-faint)]">Image not found</span>
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (mode === 'upload') inputRef.current?.click()
                else {
                  onChange(null)
                  setUrlDraft('')
                  setImgError(false)
                }
              }}
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
        /* ── Upload drop zone (upload mode, no value) ───────────────────── */
        mode === 'upload' && (
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
                ? 'border-[var(--lito-teal-fg)] bg-[var(--lito-teal-subtle)]'
                : 'border-[var(--lito-border)] hover:border-[var(--lito-teal-fg)] hover:bg-[var(--lito-teal-subtle)]',
              disabled && 'opacity-60 cursor-not-allowed',
            )}
          >
            <div className="w-10 h-10 rounded-full bg-[var(--lito-teal-subtle)] flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-[var(--lito-teal-fg)]" />
            </div>
            <div className="text-center">
              <p className="font-body text-sm text-[var(--text-primary)]">
                <span className="font-medium text-[var(--text-muted)]">Click to upload</span> or drag & drop
              </p>
              <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
                JPEG, PNG, WebP, GIF up to {Math.round(maxBytes / 1024 / 1024)} MB
              </p>
            </div>
          </div>
        )
      )}

      {/* ── URL input (url mode) ───────────────────────────────────────────── */}
      {mode === 'url' && !value && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => { setUrlDraft(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
              placeholder="https://example.com/image.jpg"
              disabled={disabled}
              className="flex-1 px-3 py-[7px] rounded-[6px] border border-[var(--lito-border)] bg-[var(--cms-input-bg)] font-body text-xs text-[var(--text-primary)] outline-none focus:border-[var(--lito-teal-fg)] placeholder:text-[var(--text-muted)] transition-colors"
            />
            <button
              type="button"
              onClick={applyUrl}
              disabled={disabled || !urlDraft.trim()}
              className="cms-btn cms-btn-sm shrink-0"
            >
              Use
            </button>
          </div>
          <p className="font-body text-[10px] text-[var(--text-muted)]">
            Paste a publicly accessible image URL (https://…)
          </p>
        </div>
      )}

      {/* ── Empty URL hint (upload mode, no value) ─────────────────────────── */}
      {mode === 'upload' && !value && (
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="font-body text-xs text-[var(--text-muted)]">
            Switch to URL tab to paste an external image link
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
