/**
 * ProductMediaUploader — cover image + gallery. Uses the shared
 * ImageUploader's deferred-upload mode (selecting a file just registers it
 * in draftMediaStore and returns a blob: URL) — the parent resolves every
 * URL to a real CDN URL via draftMediaStore.resolveUrl(s) at actual save
 * time, same pattern VariantsCard already uses for its color photos.
 */
import { ImageUploader } from '@litostudio/ui-cms'

interface ProductMediaUploaderProps {
  coverImage: string | null
  images: string[]
  onCoverImageChange: (url: string | null) => void
  onImagesChange: (images: string[]) => void
}

export function ProductMediaUploader({ coverImage, images, onCoverImageChange, onImagesChange }: ProductMediaUploaderProps) {
  function updateImageAt(index: number, url: string | null) {
    const next = [...images]
    if (url === null) next.splice(index, 1)
    else next[index] = url
    onImagesChange(next)
  }

  return (
    <div className="cms-card p-5 space-y-4">
      <div className="space-y-1.5">
        <label className="cms-label">Cover Image</label>
        <ImageUploader value={coverImage} onChange={onCoverImageChange} folder="products" />
      </div>

      <div className="space-y-1.5">
        <label className="cms-label">Gallery ({images.length}/9)</label>
        <div className="grid grid-cols-3 gap-3">
          {images.map((url, i) => (
            <ImageUploader key={i} value={url} onChange={(u) => updateImageAt(i, u)} folder="products" />
          ))}
          {images.length < 9 && (
            <ImageUploader value={null} onChange={(u) => { if (u) onImagesChange([...images, u]) }} folder="products" />
          )}
        </div>
      </div>
    </div>
  )
}
