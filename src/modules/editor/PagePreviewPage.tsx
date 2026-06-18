/**
 * PagePreviewPage — full-screen, chrome-free preview of a CMS page.
 *
 * Opens as a standalone route (/pages/:pageId/preview) in a new browser tab.
 * Fetches the saved BlockDocument from the backend, applies the active template's
 * CSS tokens, and renders blocks in read-only mode with no editor chrome.
 *
 * Why CMS-internal instead of opening the website URL:
 *   - The live website renders from the `page_sections` table (legacy format).
 *   - The block editor saves to `page_translations[n].body` (BlockDocument JSON).
 *   - The two data sources are different — the website does not yet render BlockDocuments.
 *   - This preview page reads the BlockDocument directly so it always shows
 *     the content the user just saved in the editor.
 */

import { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { pagesService }    from '@/services/pages.service'
import { useEditorStore }  from '@/stores/editor.store'
import { useWebsiteStore } from '@/stores/website.store'
import { getCanvasTokens } from './templateCanvasTokens'
import { BlockRenderer }   from './blocks/BlockRenderer'
import type { BlockDocument, Block } from '@/types/editor.types'

// ── Constants ─────────────────────────────────────────────────────────────────

const LOCALE = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('locale')) || 'id'

/** Google Fonts URLs keyed by template slug */
const GOOGLE_FONTS: Record<string, string> = {
  lito:        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap',
  photography: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap',
  beauty:      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap',
  travel:      'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
  fashion:     'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBlockDocument(v: unknown): v is BlockDocument {
  return typeof v === 'object' && v !== null && Array.isArray((v as BlockDocument).blocks)
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ bg, fg }: { bg: string; fg: string }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: bg }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: `3px solid ${fg}22`,
        borderTopColor: fg,
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p className="text-[13px] m-0 opacity-60" style={{ fontFamily: 'system-ui', color: fg }}>
        Loading preview…
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PagePreviewPage() {
  const { pageId } = useParams<{ pageId: string }>()

  // activeSite is persisted to localStorage under 'cms-website' key —
  // it is available even when opened in a new browser tab.
  const { activeSite } = useWebsiteStore()
  const { init, setEditorMode, blockDoc } = useEditorStore()

  const settings     = activeSite?.settings as Record<string, unknown> | undefined
  const templateSlug = (settings?.template_slug as string | undefined) ?? 'lito'
  const tokens       = getCanvasTokens(templateSlug)

  const {
    headerBg,
    headerText,
    headerAccent,
    siteName,
    '--font-display': fontDisplay,
    '--font-body':    fontBody,
    ...cssVars
  } = tokens

  // ── Fetch page ──────────────────────────────────────────────────────────────

  const { data: page, isLoading } = useQuery({
    queryKey:  ['page-preview', pageId],
    queryFn:   () => pagesService.getOne(pageId!),
    enabled:   !!pageId,
    staleTime: 0,
  })

  // ── Load Google Fonts ───────────────────────────────────────────────────────

  useEffect(() => {
    const href = GOOGLE_FONTS[templateSlug] ?? GOOGLE_FONTS.lito
    // Avoid duplicate links
    if (document.querySelector(`link[href="${href}"]`)) return
    const link  = document.createElement('link')
    link.rel    = 'preconnect'
    const link2 = document.createElement('link')
    link2.rel  = 'stylesheet'
    link2.href = href
    const preconnect = document.createElement('link')
    preconnect.rel   = 'preconnect'
    preconnect.href  = 'https://fonts.googleapis.com'
    const preconnect2 = document.createElement('link')
    preconnect2.rel        = 'preconnect'
    preconnect2.href       = 'https://fonts.gstatic.com'
    preconnect2.crossOrigin = 'anonymous'
    document.head.append(preconnect, preconnect2, link2)
    return () => {
      ;[preconnect, preconnect2, link2].forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el)
      })
    }
  }, [templateSlug])

  // ── Set page title ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (page) {
      const tr = (page.page_translations ?? []).find((t) => t.locale === LOCALE)
      document.title = `Preview — ${tr?.title ?? page.slug} | ${siteName}`
    }
  }, [page, siteName])

  // ── Init editor store in preview mode ───────────────────────────────────────

  useEffect(() => {
    if (!page || !pageId) return
    const translation = (page.page_translations ?? []).find((t) => t.locale === LOCALE)
    const rawBody     = translation?.body
    const doc: BlockDocument = isBlockDocument(rawBody)
      ? { ...(rawBody as BlockDocument), version: '1.0', locale: LOCALE }
      : { version: '1.0', locale: LOCALE, blocks: [] }
    init(doc, pageId, LOCALE)
    setEditorMode('preview')
  }, [page, pageId, init, setEditorMode])

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (!pageId) return <Navigate to="/pages" replace />

  if (isLoading) {
    return <Spinner bg={cssVars['--cms-card-bg'] as string} fg={tokens['--lito-teal']} />
  }

  if (!page) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: cssVars['--cms-card-bg'] as string,
        fontFamily: fontBody,
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: cssVars['--text-primary'] as string, margin: '0 0 8px' }}>
            Page not found
          </p>
          <p style={{ fontSize: 13, color: cssVars['--text-muted'] as string, margin: 0 }}>
            The page "{pageId}" could not be loaded.
          </p>
        </div>
      </div>
    )
  }

  const blocks: Block[] = blockDoc.blocks

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      data-preview-page
      style={{
        minHeight: '100vh',
        background: cssVars['--cms-main-bg'] as string,
        // Inject template CSS vars at the root so BlockRenderer's CSS-var classes resolve correctly
        '--font-display': fontDisplay,
        '--font-body':    fontBody,
        ...cssVars,
      } as React.CSSProperties}
    >
      {/* Preview banner — floating notice at top */}
      <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 px-4 py-2 bg-[rgba(26,74,90,0.92)] backdrop-blur-[8px] text-white text-xs font-medium"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <span
          className="w-2 h-2 rounded-full bg-[#4ade80] shrink-0"
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        <span>Preview — <strong>{(page.page_translations ?? []).find(t => t.locale === LOCALE)?.title ?? page.slug}</strong></span>
        <span className="opacity-50">·</span>
        <span className="opacity-70">Template: {templateSlug}</span>
        <button
          type="button"
          onClick={() => window.close()}
          className="ml-4 px-[10px] py-[3px] rounded-[20px] border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.1)] text-white cursor-pointer text-[11px]"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          Close
        </button>
      </div>

      {/* Page column — dynamic bg + shadow uses template tokens, must keep style */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        paddingTop: 36, // offset for preview banner
        minHeight: '100vh',
        background: cssVars['--cms-card-bg'] as string,
        boxShadow: '0 0 0 1px var(--lito-border), 0 8px 48px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Site header — all colors dynamic from template tokens */}
        <header style={{
          background: headerBg,
          color: headerText,
          padding: '0 48px',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: fontDisplay, fontSize: 20, fontWeight: 600,
            letterSpacing: '0.04em', color: headerText,
            userSelect: 'none',
          }}>
            <span style={{
              width: 9, height: 9, borderRadius: '50%',
              background: headerAccent, display: 'inline-block',
            }} />
            {siteName}
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {['Home', 'About', 'Portfolio', 'Journal', 'Contact'].map((item) => (
              <span
                key={item}
                style={{
                  fontFamily: fontBody, fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: `${headerText}bb`,
                  userSelect: 'none',
                }}
              >
                {item}
              </span>
            ))}
          </nav>

          {/* CTA */}
          <div style={{
            padding: '8px 20px', borderRadius: 4,
            border: `1px solid ${headerAccent}`,
            fontFamily: fontBody, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: headerAccent, cursor: 'default',
            userSelect: 'none',
          }}>
            Book Now
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1 }}>
          {blocks.length === 0 ? (
            <div style={{
              padding: '100px 48px', textAlign: 'center',
              fontFamily: fontBody,
            }}>
              <p style={{ fontSize: 16, color: cssVars['--text-muted'] as string, margin: '0 0 8px' }}>
                No content to preview.
              </p>
              <p style={{ fontSize: 13, color: cssVars['--text-muted'] as string, margin: 0, opacity: 0.6 }}>
                Add blocks in the editor and save (⌘S) before previewing.
              </p>
            </div>
          ) : (
            blocks.map((block: Block) => {
              const isHidden =
                block.visibility?.desktop === false &&
                block.visibility?.tablet  === false &&
                block.visibility?.mobile  === false
              if (isHidden) return null
              return <BlockRenderer key={block.id} block={block} />
            })
          )}
        </main>

        {/* Site footer — all colors dynamic from template tokens */}
        <footer style={{
          background: headerBg,
          color: `${headerText}77`,
          padding: '48px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          borderTop: `1px solid ${headerAccent}22`,
          flexShrink: 0,
          gap: 16,
        }}>
          <span style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 600, color: headerText }}>
            {siteName}
          </span>
          <span style={{ fontFamily: fontBody, fontSize: 11, textAlign: 'center', userSelect: 'none' }}>
            © {new Date().getFullYear()} {siteName} · All rights reserved
          </span>
          <span style={{
            fontFamily: fontBody, fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: headerAccent, textAlign: 'right', userSelect: 'none',
          }}>
            Powered by Lito Studio
          </span>
        </footer>
      </div>
    </div>
  )
}
