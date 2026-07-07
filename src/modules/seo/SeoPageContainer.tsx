import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { seoService } from '@/services/content.service'
import { pagesService } from '@litostudio/ui-cms'
import { useWebsiteStore } from '@litostudio/ui-cms'
import { getErrorMessage } from '@litostudio/ui-cms'
import { SeoPageView } from './SeoPageView'
import type { SeoSaveRequest } from '@/types/content.types'

/** Static base types — always present regardless of CMS pages */
const BASE_PAGE_TYPES = [
  { key: 'site',         label: 'Site Default' },
  { key: 'home',         label: 'Home' },
  { key: 'stories',      label: 'Stories' },
  { key: 'destinations', label: 'Destinations' },
  { key: 'gallery',      label: 'Gallery' },
  { key: 'journal',      label: 'Journal' },
  { key: 'about',        label: 'About' },
  { key: 'contact',      label: 'Contact' },
] as const

// Keep exported alias for legacy imports
export const PAGE_TYPES = BASE_PAGE_TYPES
export type SeoPageType = (typeof BASE_PAGE_TYPES)[number]['key']

export default function SeoPageContainer() {
  const { activeSite } = useWebsiteStore()
  const [activeTab, setActiveTab] = useState<string>('site')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['seo', activeSite?.id, activeTab],
    queryFn:  () => seoService.get(activeSite!.id, activeTab),
    enabled:  !!activeSite,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch published pages and merge slugs not in base list as dynamic tabs
  const { data: pagesData } = useQuery({
    queryKey: ['pages-list-seo', activeSite?.id],
    queryFn:  () => pagesService.getList({ site_id: activeSite!.id, status: 'active' as const, limit: 100 }),
    enabled:  !!activeSite,
    staleTime: 60 * 1000,
  })

  const pageTypes = useMemo(() => {
    const baseKeys = new Set<string>(BASE_PAGE_TYPES.map(t => t.key))
    const dynamic = (pagesData?.data ?? [])
      .filter(p => !baseKeys.has(p.slug))
      .map(p => ({
        key: p.slug,
        label: p.page_translations?.[0]?.title ?? p.slug.replace(/-/g, ' '),
      }))
    return [...BASE_PAGE_TYPES, ...dynamic]
  }, [pagesData])

  const saveMutation = useMutation({
    mutationFn: (payload: SeoSaveRequest) => seoService.save(activeSite!.id, payload),
    onMutate: () => {
      setSaveStatus('saving')
      setServerError(null)
    },
    onSuccess: () => {
      setSaveStatus('saved')
      refetch()
      setTimeout(() => setSaveStatus('idle'), 2500)
    },
    onError: (err) => {
      setSaveStatus('error')
      setServerError(getErrorMessage(err))
    },
  })

  const handleSave = useCallback((values: SeoSaveRequest) => {
    saveMutation.mutate({ ...values, page_type: activeTab, locale: 'id' })
  }, [saveMutation, activeTab])

  return (
    <SeoPageView
      pageTypes={pageTypes as unknown as typeof BASE_PAGE_TYPES}
      activeTab={activeTab as SeoPageType}
      onTabChange={setActiveTab}
      data={data ?? {}}
      isLoading={isLoading}
      saveStatus={saveStatus}
      serverError={serverError}
      onSave={handleSave}
    />
  )
}
