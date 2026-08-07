/**
 * ProductVideoField — single optional product video, tied into the real
 * data model (products.video_url, migration 20260722190000). Grill-me
 * decision (2026-07-22, user request): parallel to cover_image, not part
 * of the images[] gallery array — matches the one-hero-video model
 * confirmed with the user.
 *
 * Deliberately NOT built on ImageUploader — that component hard-codes an
 * image MIME allowlist, a 5MB cap, and an <img> preview, none of which fit
 * video. Instead calls `mediaService.upload()` directly (the same
 * presign → PUT R2 → confirm pipeline ImageUploader's own deferred
 * draftMediaStore path ultimately calls) — immediate upload rather than
 * deferred-until-save, since holding a multi-MB video blob in memory until
 * the wizard's next Save is a worse tradeoff here than it is for a small
 * compressed image.
 */
import { useRef, useState } from 'react'
import { mediaService } from '@litostudio/ui-cms'

const ACCEPTED = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_BYTES = 100 * 1024 * 1024 // 100 MB — generous for a short product clip, well under typical R2/CDN limits

interface ProductVideoFieldProps {
  value: string | null
  onChange: (url: string | null) => void
  siteId?: string | null
}

export function ProductVideoField({ value, onChange, siteId }: ProductVideoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!ACCEPTED.includes(file.type)) {
      setError('Only MP4, WebM, or MOV videos are allowed.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`File must be under ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`)
      return
    }
    setUploading(true)
    try {
      const media = await mediaService.upload(file, { folder: 'products/video', site_id: siteId ?? undefined })
      onChange(media.cdn_url ?? media.original_url ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="cms-label">Product Video (optional)</label>

      {value ? (
        <div className="space-y-2">
          <video src={value} controls className="w-full max-w-[360px] rounded-lg border border-[var(--lito-border)]" />
          <div className="flex items-center gap-2">
            <button type="button" className="cms-btn cms-btn-ghost cms-btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Replace'}
            </button>
            <button type="button" className="font-body text-xs text-[var(--s-danger)] hover:underline" onClick={() => onChange(null)} disabled={uploading}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="cms-btn cms-btn-ghost cms-btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Upload video'}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
        aria-label="Upload product video"
      />

      {error && <p className="font-body text-xs text-[var(--s-danger)]">{error}</p>}
      <p className="font-body text-[11px] text-[var(--text-faint)]">MP4, WebM, or MOV — up to 100MB. Shown first in the product's media carousel on the storefront.</p>
    </div>
  )
}
