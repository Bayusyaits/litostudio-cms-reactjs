import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mediaService } from '@/services/media.service'
import { useWebsiteStore } from '@/stores/website.store'
import { MediaPageView } from './MediaPageView'
import { getErrorMessage } from '@/lib/axios'

export default function MediaPageContainer() {
  const { activeSite } = useWebsiteStore()
  const qc = useQueryClient()
  const [filter, setFilter] = useState({ search: '', type: '', page: 1, limit: 40 })
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['media', activeSite?.id, filter],
    queryFn: () => mediaService.getList({ site_id: activeSite!.id, ...filter }),
    enabled: !!activeSite,
    staleTime: 2 * 60 * 1000,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media', activeSite?.id] }),
  })

  const handleUpload = useCallback(async (files: File[]) => {
    if (!activeSite) return
    setUploading(true)
    setUploadError(null)
    try {
      for (const file of files) {
        await mediaService.upload(file, { site_id: activeSite.id })
      }
      qc.invalidateQueries({ queryKey: ['media', activeSite.id] })
    } catch (err) {
      setUploadError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }, [activeSite, qc])

  return (
    <MediaPageView
      items={data?.data ?? []}
      meta={data?.meta}
      isLoading={isLoading}
      uploading={uploading}
      uploadError={uploadError}
      filter={filter}
      setFilter={(f) => setFilter((prev) => ({ ...prev, ...f }))}
      onUpload={handleUpload}
      onDelete={(id) => deleteMutation.mutate(id)}
    />
  )
}
