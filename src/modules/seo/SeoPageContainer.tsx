import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { seoService } from '@/services/content.service'
import { useWebsiteStore } from '@/stores/website.store'
import { getErrorMessage } from '@/lib/axios'
import { SeoPageView } from './SeoPageView'
import type { SeoSaveRequest } from '@/types/content.types'

const PAGE_TYPES = [
  { key: 'site',         label: 'Site Default' },
  { key: 'home',         label: 'Home' },
  { key: 'stories',      label: 'Stories' },
  { key: 'destinations', label: 'Destinations' },
  { key: 'gallery',      label: 'Gallery' },
  { key: 'journal',      label: 'Journal' },
  { key: 'about',        label: 'About' },
  { key: 'contact',      label: 'Contact' },
] as const

export type SeoPageType = (typeof PAGE_TYPES)[number]['key']

export { PAGE_TYPES }

export default function SeoPageContainer() {
  const { activeSite } = useWebsiteStore()
  const [activeTab, setActiveTab] = useState<SeoPageType>('site')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [serverError, setServerError] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['seo', activeSite?.id, activeTab],
    queryFn:  () => seoService.get(activeSite!.id, activeTab),
    enabled:  !!activeSite,
    staleTime: 5 * 60 * 1000,
  })

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
      pageTypes={PAGE_TYPES}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      data={data ?? {}}
      isLoading={isLoading}
      saveStatus={saveStatus}
      serverError={serverError}
      onSave={handleSave}
    />
  )
}
