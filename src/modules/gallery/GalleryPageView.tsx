import { Image, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { SearchInput } from '@/components/molecules/SearchInput'
import { MediaSkeleton } from '@/components/atoms/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState'
import { cn } from '@/lib/utils'
import { getTitle } from '@/types/content.types'
import type { GalleryItem } from '@/types/content.types'

interface Props {
  items: GalleryItem[]
  meta?: { total: number; page: number; limit: number }
  isLoading: boolean
  filter: { search: string; page: number; limit: number }
  setFilter: (f: Partial<{ search: string; page: number }>) => void
  selectedIds: string[]
  onSelect: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
}

export function GalleryPageView({
  items, meta, isLoading, filter, setFilter,
  selectedIds, onSelect, onDelete, onBulkDelete,
}: Props) {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Gallery</h1>
          <p className="font-body text-sm text-[var(--text-muted)] mt-0.5">
            {meta ? `${meta.total} items` : 'Manage gallery collections'}
          </p>
        </div>
        {selectedIds.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => onBulkDelete(selectedIds)}
          >
            Delete {selectedIds.length}
          </Button>
        )}
      </div>

      <SearchInput
        value={filter.search}
        onChange={(search) => setFilter({ search, page: 1 })}
        placeholder="Search gallery…"
        className="w-64"
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <MediaSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Image} title="No gallery items" description="Upload images to build your gallery" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id)
            return (
              <div
                key={item.id}
                className={cn(
                  'relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
                  isSelected
                    ? 'border-[var(--lito-gold)]'
                    : 'border-transparent hover:border-[var(--lito-border)]',
                )}
                onClick={() => onSelect(item.id, !isSelected)}
                role="checkbox"
                aria-checked={isSelected}
                aria-label={getTitle(item) ?? 'Gallery item'}
              >
                <div className="aspect-square bg-[var(--cms-surface-2)]">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.translations?.[0]?.title ?? ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-[var(--text-muted)]" aria-hidden />
                    </div>
                  )}
                </div>

                {/* Selection indicator */}
                <div className={cn(
                  'absolute top-1.5 left-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  'transition-all',
                  isSelected
                    ? 'bg-[var(--lito-gold)] border-[var(--lito-gold)]'
                    : 'bg-white/80 border-white opacity-0 group-hover:opacity-100',
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" aria-hidden />}
                </div>

                {/* Delete on hover */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
                  className={cn(
                    'absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60',
                    'flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
                  )}
                  aria-label="Delete item"
                >
                  <Trash2 className="w-3 h-3 text-white" aria-hidden />
                </button>

                {getTitle(item) && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="font-body text-[10px] text-white truncate">{getTitle(item)}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
