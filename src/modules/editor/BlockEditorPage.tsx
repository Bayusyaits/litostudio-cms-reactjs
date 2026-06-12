/**
 * BlockEditorPage — route component for /pages/:pageId/edit.
 *
 * Loads the page (+ its translations) from the backend, parses the
 * existing BlockDocument from `page_translations[n].body`, initialises
 * the editor store, then renders EditorShell.
 *
 * Falls back to an empty document if no body exists yet.
 */

import { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { pagesService }         from '@/services/pages.service'
import { useEditorStore }       from '@/stores/editor.store'
import { useWebsiteStore }      from '@/stores/website.store'
import { EditorShell }          from './EditorShell'
import { DashboardSkeleton }    from '@/components/atoms/Skeleton'
import type { BlockDocument }   from '@/types/editor.types'

const LOCALE = 'id'

function isBlockDocument(v: unknown): v is BlockDocument {
  return (
    typeof v === 'object' &&
    v !== null &&
    'version' in v &&
    (v as BlockDocument).version === '1.0' &&
    Array.isArray((v as BlockDocument).blocks)
  )
}

export default function BlockEditorPage() {
  const { pageId } = useParams<{ pageId: string }>()
  const { activeSite } = useWebsiteStore()
  const { init, reset } = useEditorStore()

  // Fetch the page with all translations
  const { data: page, isLoading, error } = useQuery({
    queryKey:  ['page-editor', pageId],
    queryFn:   () => pagesService.getOne(pageId!),
    enabled:   !!pageId,
    staleTime: 0,
  })

  // Initialise the editor store when the page loads
  useEffect(() => {
    if (!page || !pageId) return

    // Find body from the preferred locale translation
    const translation = (page.page_translations ?? []).find((t) => t.locale === LOCALE)
    const rawBody     = translation?.body

    const doc: BlockDocument = isBlockDocument(rawBody)
      ? rawBody
      : { version: '1.0', locale: LOCALE, blocks: [] }

    init(doc, pageId, LOCALE)

    return () => { reset() }
  }, [page, pageId, init, reset])

  if (!pageId)                return <Navigate to="/pages" replace />
  if (!activeSite)            return <Navigate to="/organizations" replace />

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cms-main-bg)]">
        <div className="w-full max-w-xl p-6">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cms-main-bg)]">
        <div className="text-center space-y-2">
          <p className="font-display text-lg font-semibold text-[var(--text-primary)]">Page not found</p>
          <p className="font-body text-sm text-[var(--text-muted)]">
            The page "{pageId}" could not be loaded.
          </p>
          <a href="/pages" className="font-body text-sm text-[var(--lito-teal)] underline">
            ← Back to pages
          </a>
        </div>
      </div>
    )
  }

  const translation = (page.page_translations ?? []).find((t) => t.locale === LOCALE)
  const pageTitle   = translation?.title ?? page.slug

  return (
    <EditorShell
      pageId={pageId}
      pageTitle={pageTitle}
      locale={LOCALE}
    />
  )
}
