import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mediaService, useWebsiteStore, useToast, getErrorMessage, ConfirmDialog } from '@litostudio/ui-cms'
import type { Media, MediaFileType } from '@litostudio/ui-cms'
import { MediaPageView } from './MediaPageView'
import { AddMediaModal } from './AddMediaModal'
import { MediaLightboxModal } from './MediaLightboxModal'

interface MediaFilter {
  q: string
  file_type: MediaFileType | ''
  source_module: string
  page: number
  per_page: number
}

export default function MediaPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const toast = useToast()
  const [filter, setFilter] = useState<MediaFilter>({ q: '', file_type: '', source_module: '', page: 1, per_page: 40 })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [addMediaOpen, setAddMediaOpen] = useState(false)
  const [lightboxItem, setLightboxItem] = useState<Media | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Media | null>(null)
  const [bulkConfirmIds, setBulkConfirmIds] = useState<string[] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['media', activeSite?.id, filter],
    queryFn: () => mediaService.getList({
      site_id: activeSite!.id,
      q: filter.q || undefined,
      file_type: filter.file_type || undefined,
      source_module: filter.source_module || undefined,
      page: filter.page,
      per_page: filter.per_page,
    }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['media', activeSite?.id] }), [qc, activeSite?.id])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaService.remove(id),
    onSuccess: () => {
      invalidate()
      toast.show({ message: 'Media deleted', variant: 'success' })
    },
    onError: (err) => toast.show({ message: 'Could not delete media', description: getErrorMessage(err), variant: 'error' }),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => mediaService.bulkDelete(ids),
    onSuccess: (result) => {
      invalidate()
      setSelectedIds([])
      if (result.blocked.length > 0) {
        toast.show({
          message: `${result.deleted.length} of ${result.deleted.length + result.blocked.length} deleted`,
          description: `Not deleted — ${result.blocked.map((b) => `${b.file_name} (${b.reason})`).join('; ')}`,
          variant: result.deleted.length > 0 ? 'success' : 'error',
        })
      } else {
        toast.show({ message: `${result.deleted.length} media deleted`, variant: 'success' })
      }
    },
    onError: (err) => toast.show({ message: 'Bulk delete failed', description: getErrorMessage(err), variant: 'error' }),
  })

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? (data?.data.map((m) => m.id) ?? []) : [])
  }, [data])

  const retagMutation = useMutation({
    mutationFn: ({ id, source_module }: { id: string; source_module: string }) => mediaService.update(id, { source_module }),
    onSuccess: (updated) => {
      invalidate()
      setLightboxItem((prev) => (prev && updated ? { ...prev, ...updated } : prev))
    },
  })

  const handleUpload = useCallback(async (files: File[], category: string) => {
    if (!activeSite) return
    setUploading(true)
    setUploadError(null)
    try {
      for (const file of files) {
        await mediaService.upload(file, { site_id: activeSite.id, source_module: category })
      }
      invalidate()
      toast.show({ message: files.length > 1 ? `${files.length} files uploaded` : 'File uploaded', variant: 'success' })
      setAddMediaOpen(false)
    } catch (err) {
      const msg = getErrorMessage(err)
      setUploadError(msg)
      toast.show({ message: 'Upload failed', description: msg, variant: 'error' })
    } finally {
      setUploading(false)
    }
  }, [activeSite, invalidate, toast])

  const handleLinkUrl = useCallback(async (url: string, category: string) => {
    if (!activeSite) return
    await mediaService.link({ url, site_id: activeSite.id, source_module: category })
    invalidate()
  }, [activeSite, invalidate])

  return (
    <>
      <MediaPageView
        items={data?.data ?? []}
        meta={data?.meta}
        isLoading={isLoading}
        uploadError={uploadError}
        filter={filter}
        setFilter={(f) => setFilter((prev) => ({ ...prev, ...f } as MediaFilter))}
        onOpenAddMedia={() => setAddMediaOpen(true)}
        onOpenItem={(item) => setLightboxItem(item)}
        onRequestDelete={(item) => setDeleteTarget(item)}
        selectedIds={selectedIds}
        onToggleSelect={handleSelect}
        onToggleSelectAll={handleSelectAll}
        onBulkDeleteRequest={(ids) => setBulkConfirmIds(ids)}
      />
      <AddMediaModal
        open={addMediaOpen}
        uploading={uploading}
        onClose={() => setAddMediaOpen(false)}
        onUploadFiles={handleUpload}
        onLinkUrl={handleLinkUrl}
      />
      <MediaLightboxModal
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
        onRetag={async (id, source_module) => { await retagMutation.mutateAsync({ id, source_module }) }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null) }}
        title="Delete media file?"
        description={`Are you sure you want to delete "${deleteTarget?.file_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        closeIcon={<span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>×</span>}
      />
      <ConfirmDialog
        open={!!bulkConfirmIds}
        onClose={() => setBulkConfirmIds(null)}
        onConfirm={() => { if (bulkConfirmIds) bulkDeleteMutation.mutate(bulkConfirmIds); setBulkConfirmIds(null) }}
        title="Delete selected media?"
        description={`Are you sure you want to permanently delete ${bulkConfirmIds?.length ?? 0} media item(s)? Any item still linked to an active Product, Portfolio entry, or page will be skipped and reported back — this cannot be undone for the rest.`}
        confirmLabel="Delete All"
        variant="danger"
        closeIcon={<span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>×</span>}
      />
    </>
  )
}

