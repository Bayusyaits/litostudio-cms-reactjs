import { useState } from 'react'
import { AppImage, Skeleton, SearchInput, EmptyState, EnterpriseDataTable, Select, Button } from '@litostudio/ui-cms'
import { KNOWN_SOURCE_MODULES, sourceModuleLabel } from '@litostudio/ui-cms'
import { FolderOpen, Trash2, Grid, List, Search, X, Plus, Play } from 'lucide-react'
import { formatBytes, isImageMime } from '@/lib/utils'
import type { Media, MediaFileType } from '@litostudio/ui-cms'
import type { EDTColumn } from '@litostudio/ui-cms'
import { FileTypeIcon } from './mediaIcons'

type ViewMode = 'grid' | 'list'

interface MediaFilterState {
  q: string
  file_type: MediaFileType | ''
  source_module: string
  page: number
}

interface Props {
  items: Media[]
  meta?: { total: number; page: number; per_page: number }
  isLoading: boolean
  uploadError: string | null
  filter: MediaFilterState
  setFilter: (f: Partial<MediaFilterState>) => void
  onOpenAddMedia: () => void
  onOpenItem: (item: Media) => void
  onRequestDelete: (item: Media) => void
  selectedIds: string[]
  onToggleSelect: (id: string, checked: boolean) => void
  onToggleSelectAll: (checked: boolean) => void
  onBulkDeleteRequest: (ids: string[]) => void
}

const FILE_TYPE_OPTIONS: { value: MediaFileType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'image', label: 'Images' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'spreadsheet', label: 'Spreadsheets' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Documents' },
]

const CATEGORY_FILTER_OPTIONS = [
  { value: '', label: 'All categories' },
  ...KNOWN_SOURCE_MODULES.map((m) => ({ value: m, label: sourceModuleLabel(m) })),
]

function StorageRing({ usedMb = 240, totalMb = 1000 }) {
  const pct = Math.min(usedMb / totalMb, 1)
  const R = 34
  const circ = 2 * Math.PI * R
  const dash = circ * pct
  return (
    <div className="flex items-center gap-[14px] px-[18px] py-[14px]">
      <svg width={80} height={80} viewBox="0 0 80 80" aria-hidden>
        <circle cx={40} cy={40} r={R} fill="none" stroke="var(--lito-border)" strokeWidth={6} />
        <circle cx={40} cy={40} r={R} fill="none" stroke="var(--lito-gold)" strokeWidth={6}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" />
        <text x={40} y={44} textAnchor="middle" fontFamily="var(--font-display)" fontSize={15} fill="var(--text-primary)">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div>
        <div className="font-body text-xs font-medium text-[var(--text-primary)]">Storage</div>
        <div className="font-body text-[11px] text-[var(--text-muted)] mt-0.5">
          {formatBytes(usedMb * 1024 * 1024)} of {formatBytes(totalMb * 1024 * 1024)}
        </div>
        <div className="font-body text-[11px] text-[var(--text-muted)]">
          {formatBytes((totalMb - usedMb) * 1024 * 1024)} remaining
        </div>
      </div>
    </div>
  )
}

function GridCard({ item, onOpen, onDelete, selected, onToggleSelect }: { item: Media; onOpen: () => void; onDelete: () => void; selected: boolean; onToggleSelect: (checked: boolean) => void }) {
  const previewUrl = item.cdn_url ?? item.file_url
  return (
    <div
      className={`group relative rounded-md overflow-hidden cursor-pointer aspect-[4/3] bg-[var(--lito-cream-alt)] transition-[border-color] duration-150 border-[1.5px] ${selected ? 'border-[var(--lito-gold)]' : 'border-[var(--lito-border)] hover:border-[var(--lito-gold)]'}`}
      onClick={onOpen}
    >
      {/* Bulk-select checkbox — always visible once anything is selected
          (so the user can see/adjust the set at a glance), otherwise only
          on hover, matching the delete button's own hover-reveal below. */}
      <label
        className={`absolute top-[5px] left-[5px] z-10 w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center cursor-pointer transition-opacity duration-150 ${selected ? 'opacity-100 bg-[var(--lito-gold)] border-[var(--lito-gold)]' : 'opacity-0 group-hover:opacity-100 bg-[rgba(17,17,17,0.55)] border-white/70 hover:opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggleSelect(e.target.checked)}
          className="sr-only"
          aria-label={`Select ${item.file_name}`}
        />
        {selected && <span aria-hidden style={{ fontSize: 11, lineHeight: 1, color: '#111' }}>✓</span>}
      </label>
      {item.file_type === 'image' && isImageMime(item.mime_type) ? (
        <AppImage src={previewUrl ?? ''} alt={item.alt_text ?? item.file_name} objectFit="cover" skeleton wrapperStyle={{ position: 'absolute', inset: 0 }} style={{ width: '100%', height: '100%' }} />
      ) : item.file_type === 'video' && previewUrl ? (
        <div className="relative w-full h-full">
          {/* Thumbnail: first frame via preload="metadata" (no server-side
              thumbnail generation exists yet) + a play-icon overlay so video
              cards read as playable at a glance, distinct from static images. */}
          <video src={previewUrl} preload="metadata" muted playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(17,17,17,0.15)]">
            <div className="w-9 h-9 rounded-full bg-[rgba(17,17,17,0.6)] flex items-center justify-center">
              <Play size={14} color="#fff" fill="#fff" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-[6px]">
          <FileTypeIcon fileType={item.file_type} className="w-8 h-8 text-[var(--text-muted)]" />
          <span className="text-[9px] text-[var(--text-muted)] text-center px-[6px] overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
            {item.file_name}
          </span>
        </div>
      )}

      {/* Type + category badges */}
      <div className="absolute top-[5px] left-[28px] flex gap-[4px]">
        <div className="px-[5px] py-[2px] rounded-[3px] bg-[rgba(17,17,17,0.55)] backdrop-blur-[4px] text-[9px] font-semibold text-white tracking-[0.05em] uppercase">
          {item.file_type}
        </div>
      </div>
      <div className="absolute top-[5px] right-[5px] px-[5px] py-[2px] rounded-[3px] bg-[rgba(212,168,83,0.85)] text-[9px] font-semibold text-[#111] tracking-[0.03em] uppercase">
        {sourceModuleLabel(item.source_module)}
      </div>

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex items-end p-[6px] opacity-0 hover:opacity-100 hover:bg-[rgba(17,17,17,0.35)] transition-all duration-150"
      >
        <button
          type="button"
          aria-label={`Delete ${item.file_name}`}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="ml-auto w-6 h-6 rounded-full bg-[rgba(163,48,40,0.8)] border-none cursor-pointer flex items-center justify-center"
        >
          <Trash2 size={11} color="#fff" />
        </button>
      </div>
    </div>
  )
}

function buildMediaColumns(onRequestDelete: (item: Media) => void): EDTColumn<Media>[] {
  return [
    {
      key: 'file_name',
      label: 'File',
      render: (item) => (
        <div className="flex items-center gap-[10px]">
          {item.file_type === 'image' && isImageMime(item.mime_type) ? (
            <AppImage src={item.cdn_url ?? item.file_url ?? ''} alt="" objectFit="cover" skeleton={false} wrapperStyle={{ width: 48, height: 34, flexShrink: 0, borderRadius: 3 }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <div className="w-12 h-[34px] rounded-[3px] bg-[var(--lito-cream-alt)] flex items-center justify-center shrink-0">
              <FileTypeIcon fileType={item.file_type} className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          )}
          <span className="font-body text-[13px] font-medium text-[var(--text-muted)]">{item.file_name}</span>
        </div>
      ),
    },
    {
      key: 'file_type',
      label: 'Type',
      render: (item) => (
        <span className="px-[7px] py-[2px] rounded-[3px] bg-[var(--lito-cream-alt)] text-[10px] font-semibold text-[var(--text-muted)] uppercase">
          {item.file_type}
        </span>
      ),
    },
    {
      key: 'source_module',
      label: 'Category',
      render: (item) => (
        <span className="px-[7px] py-[2px] rounded-[3px] bg-[rgba(212,168,83,0.15)] text-[10px] font-semibold text-[var(--lito-ink)] uppercase">
          {sourceModuleLabel(item.source_module)}
        </span>
      ),
    },
    {
      key: 'file_size',
      label: 'Size',
      render: (item) => <span className="text-xs text-[var(--text-muted)]">{item.file_size ? formatBytes(item.file_size) : '—'}</span>,
    },
    {
      key: 'created_at',
      label: 'Added',
      sortable: true,
      render: (item) => <span className="text-xs text-[var(--text-muted)]">{new Date(item.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      label: '',
      width: 48,
      render: (item) => (
        <button
          type="button"
          aria-label={`Delete ${item.file_name}`}
          onClick={(e) => { e.stopPropagation(); onRequestDelete(item) }}
          className="bg-transparent border-none cursor-pointer p-1 text-[var(--text-muted)] flex rounded hover:text-[var(--cms-danger)] hover:bg-[var(--cms-danger-bg)]"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ]
}

export function MediaPageView({
  items, meta, isLoading, uploadError,
  filter, setFilter, onOpenAddMedia, onOpenItem, onRequestDelete,
  selectedIds, onToggleSelect, onToggleSelectAll, onBulkDeleteRequest,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const iconBtnBase = 'flex items-center justify-center w-8 h-8 rounded border border-[var(--lito-border)] bg-transparent cursor-pointer text-[var(--text-muted)] transition-all duration-150'
  const iconBtnActive = 'bg-[var(--lito-ink)] text-[var(--lito-cream)] border-[var(--lito-ink)]'
  const iconBtnInactive = 'bg-transparent text-[var(--text-muted)] border-[var(--lito-border)]'

  return (
    <div className="cms-page flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-7 pt-6 pb-4 shrink-0 bg-[var(--cms-main-bg)]">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)]">Media Library</h1>
            <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
              {meta ? `${meta.total.toLocaleString()} files` : 'Upload and manage media across every module'}
            </p>
          </div>
          <Button skin="cms" leftIcon={<Plus size={14} />} onClick={onOpenAddMedia}>
            Add Media
          </Button>
        </div>

        {uploadError && (
          <div className="px-3 py-2 rounded-md bg-[var(--cms-danger-bg)] border border-[rgba(163,48,40,0.2)] mb-3" role="alert">
            <p className="font-body text-xs text-[var(--cms-danger)]">{uploadError}</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-[10px] flex-wrap">
          <SearchInput
            skin="cms"
            icon={<Search className="w-3.5 h-3.5" />}
            clearIcon={<X className="w-3.5 h-3.5" />}
            value={filter.q}
            onChange={(q) => setFilter({ q, page: 1 })}
            placeholder="Search media…"
            className="w-56"
          />
          <Select
            size="sm"
            className="w-[140px]"
            value={filter.file_type}
            onChange={(v) => setFilter({ file_type: v as MediaFileType | '', page: 1 })}
            options={FILE_TYPE_OPTIONS}
          />
          <Select
            size="sm"
            className="w-[160px]"
            value={filter.source_module}
            onChange={(v) => setFilter({ source_module: v, page: 1 })}
            options={CATEGORY_FILTER_OPTIONS}
          />

          <div className="ml-auto flex gap-1">
            <button type="button" aria-label="Grid view" onClick={() => setViewMode('grid')}
              className={`${iconBtnBase} ${viewMode === 'grid' ? iconBtnActive : iconBtnInactive}`}>
              <Grid size={14} />
            </button>
            <button type="button" aria-label="List view" onClick={() => setViewMode('list')}
              className={`${iconBtnBase} ${viewMode === 'list' ? iconBtnActive : iconBtnInactive}`}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-7 pb-7">
        {/* Storage ring card */}
        <div className="cms-card mb-4 overflow-hidden">
          <StorageRing usedMb={(meta?.total ?? 0) * 0.8} totalMb={5000} />
        </div>

        {isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid gap-[10px] [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
              {Array.from({ length: 20 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-md" />)}
            </div>
          ) : (
            <div className="cms-card overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-[10px] flex gap-3 border-b border-[var(--lito-border)]">
                  <Skeleton className="h-10 w-14 rounded" />
                  <div className="flex-1"><Skeleton className="h-3.5 w-48 mb-1" /><Skeleton className="h-2.5 w-24" /></div>
                  <Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          )
        ) : items.length === 0 ? (
          <EmptyState skin="cms" icon={<FolderOpen className="w-6 h-6 text-[var(--lito-gold)]" aria-hidden />} title="No media files" description="Upload files or add an approved URL to get started" />
        ) : viewMode === 'grid' ? (
          <div className="grid gap-[10px] [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
            {items.map(item => (
              <GridCard
                key={item.id}
                item={item}
                onOpen={() => onOpenItem(item)}
                onDelete={() => onRequestDelete(item)}
                selected={selectedIds.includes(item.id)}
                onToggleSelect={(checked) => onToggleSelect(item.id, checked)}
              />
            ))}
          </div>
        ) : (
          <div className="cms-card overflow-hidden">
            <EnterpriseDataTable<Media>
              skin="cms"
              columns={buildMediaColumns(onRequestDelete)}
              data={items}
              onRowClick={onOpenItem}
              rowSelection
              bulkActions={[
                {
                  label: 'Delete Selected',
                  icon: <Trash2 className="w-3.5 h-3.5" />,
                  variant: 'danger',
                  onClick: (ids) => onBulkDeleteRequest(ids as string[]),
                },
              ]}
              emptyIcon={<FolderOpen className="w-6 h-6 text-[var(--lito-gold)]" aria-hidden />}
              emptyTitle="No media files"
              emptyDescription="Upload files or add an approved URL to get started"
            />
          </div>
        )}
      </div>

      {/* Floating bulk-action bar — grid view only; list view already gets
          an equivalent bar for free from EnterpriseDataTable's own
          rowSelection/bulkActions (same component Products/Promotions use),
          so this is additive, not a duplicate control. */}
      {viewMode === 'grid' && selectedIds.length > 0 && (
        <div
          className="fixed left-1/2 bottom-6 -translate-x-1/2 z-40 flex items-center gap-[14px] px-[18px] py-[10px] rounded-[10px] bg-[var(--lito-ink)] shadow-[0_12px_32px_rgba(17,17,17,0.35)]"
        >
          <span className="font-body text-[13px] font-medium text-[var(--lito-cream)] whitespace-nowrap">
            {selectedIds.length} item{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <button
            type="button"
            onClick={() => onToggleSelectAll(true)}
            className="font-body text-[12px] font-medium text-[var(--lito-cream)] opacity-80 hover:opacity-100 bg-transparent border-none cursor-pointer underline"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => onToggleSelectAll(false)}
            className="font-body text-[12px] font-medium text-[var(--lito-cream)] opacity-80 hover:opacity-100 bg-transparent border-none cursor-pointer underline"
          >
            Deselect All
          </button>
          <button
            type="button"
            onClick={() => onBulkDeleteRequest(selectedIds)}
            className="flex items-center gap-[6px] font-body text-[12.5px] font-semibold text-white bg-[var(--cms-danger)] px-[12px] py-[6px] rounded-[6px] border-none cursor-pointer"
          >
            <Trash2 size={13} /> Delete Selected
          </button>
        </div>
      )}
    </div>
  )
}
