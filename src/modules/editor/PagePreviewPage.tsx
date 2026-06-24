/**
 * PagePreviewPage — full-screen, chrome-free preview of a CMS page.
 *
 * Opens as a standalone route (/pages/:pageId/preview) in a new browser tab.
 *
 * Architecture:
 *   Renders blocks directly using the CMS-internal BlockRenderer — the same
 *   component tree used by the editor canvas. This means the preview is
 *   100% independent: it works whether or not the Nuxt website is running.
 *
 * Data flow:
 *   1. EditorShell auto-saves before opening this page.
 *   2. This page fetches the saved BlockDocument from the backend.
 *   3. Template CSS tokens are derived from the active site's template_slug
 *      (persisted to localStorage by the Zustand website store, so available
 *      in a new tab on the same origin).
 *   4. Google Fonts for the template are injected via a <link> element.
 *   5. Blocks are rendered via <BlockRenderer> — zero iframe / postMessage.
 */

import { useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { pagesService }    from '@/services/pages.service'
import { useWebsiteStore } from '@/stores/website.store'
import { getCanvasTokens } from './templateCanvasTokens'
import { BlockRenderer }   from './blocks/BlockRenderer'
import type { BlockDocument, Block } from '@/types/editor.types'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Locale from query param — passed through when EditorShell opens preview */
const LOCALE = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('locale')) || 'id'

/** Height reserved for the preview top banner */
const BANNER_H = 36

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBlockDocument(v: unknown): v is BlockDocument {
  return typeof v === 'object' && v !== null && Array.isArray((v as BlockDocument).blocks)
}

function getBlockDocFromPage(
  page: Awaited<ReturnType<typeof pagesService.getOne>>,
  locale: string,
): BlockDocument {
  const translation = (page.page_translations ?? []).find((t) => t.locale === locale)
  const rawBody = translation?.body
  return isBlockDocument(rawBody)
    ? { ...(rawBody as BlockDocument), version: '1.0', locale }
    : { version: '1.0', locale, blocks: [] }
}

// ── Google Fonts injector ─────────────────────────────────────────────────────

function useFontInjection(fontUrl: string | undefined) {
  useEffect(() => {
    if (!fontUrl) return
    const existing = document.getElementById('preview-font-link')
    if (existing) {
      ;(existing as HTMLLinkElement).href = fontUrl
      return
    }
    const link = document.createElement('link')
    link.id   = 'preview-font-link'
    link.rel  = 'stylesheet'
    link.href = fontUrl
    document.head.appendChild(link)
    return () => {
      const el = document.getElementById('preview-font-link')
      if (el) el.remove()
    }
  }, [fontUrl])
}

// ── Scroll enabler ────────────────────────────────────────────────────────────
// globals.css sets overflow:hidden on html/body/#root for the CMS shell.
// The preview opens as a standalone route in a new tab — we need to
// override that so the page scrolls normally.

function usePreviewScroll() {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')

    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      rootOverflow: root?.style.overflow ?? '',
      htmlHeight:   html.style.height,
      bodyHeight:   body.style.height,
      rootHeight:   root?.style.height ?? '',
    }

    html.style.overflow = 'auto'
    body.style.overflow = 'auto'
    html.style.height   = 'auto'
    body.style.height   = 'auto'
    if (root) {
      root.style.overflow = 'auto'
      root.style.height   = 'auto'
    }

    return () => {
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      html.style.height   = prev.htmlHeight
      body.style.height   = prev.bodyHeight
      if (root) {
        root.style.overflow = prev.rootOverflow
        root.style.height   = prev.rootHeight
      }
    }
  }, [])
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 'calc(100vh - 36px)',
        gap: 16,
        background: '#0D0B09',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid rgba(45,212,191,0.15)',
        borderTopColor: '#2DD4BF',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
        Loading preview…
      </p>
    </div>
  )
}

// ── Banner ────────────────────────────────────────────────────────────────────

interface BannerProps {
  title:        string
  templateSlug: string
  blockCount:   number
}

function PreviewBanner({ title, templateSlug, blockCount }: BannerProps) {
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        height: BANNER_H,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px',
        background: 'rgba(26,74,90,0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.2)',
        color: 'white',
        fontSize: 12,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 500,
      }}
    >
      {/* Live dot */}
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: '#4ade80',
        flexShrink: 0,
        animation: 'pulse 2s ease-in-out infinite',
      }} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>

      <span style={{ color: 'rgba(255,255,255,0.9)' }}>
        Preview —{' '}
        <strong style={{ fontWeight: 700 }}>{title}</strong>
      </span>

      <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>

      <span style={{ color: 'rgba(255,255,255,0.5)' }}>
        {templateSlug} · {blockCount} block{blockCount !== 1 ? 's' : ''}
      </span>

      <span style={{ flex: 1 }} />

      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          padding: '3px 11px', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
        }}
      >
        Reload
      </button>

      <button
        type="button"
        onClick={() => window.close()}
        style={{
          padding: '3px 11px', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
        }}
      >
        Close ✕
      </button>
    </div>
  )
}

// ── Mock site header ──────────────────────────────────────────────────────────

interface MockHeaderProps {
  siteName:    string
  headerBg:    string
  headerText:  string
  headerAccent: string
}

function MockSiteHeader({ siteName, headerBg, headerText, headerAccent }: MockHeaderProps) {
  return (
    <header
      style={{
        position: 'sticky', top: BANNER_H, zIndex: 100,
        background: headerBg,
        borderBottom: `1px solid ${headerAccent}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px',
        height: 64,
      }}
    >
      {/* Logo / site name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            display: 'inline-block',
            width: 28, height: 28,
            borderRadius: '50%',
            background: headerAccent,
            opacity: 0.85,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-display, Georgia, serif)',
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: headerText,
          }}
        >
          {siteName}
        </span>
      </div>

      {/* Nav placeholder */}
      <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {['Home', 'About', 'Portfolio', 'Contact'].map((label) => (
          <span
            key={label}
            style={{
              fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: `${headerText}99`,
              cursor: 'default',
            }}
          >
            {label}
          </span>
        ))}
      </nav>
    </header>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyBlocks({ bg }: { bg: string }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 400, gap: 12,
        background: bg,
      }}
    >
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: '#999', margin: 0 }}>
        No blocks added yet
      </p>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#666', margin: 0 }}>
        Add blocks in the editor and the preview will update here.
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PagePreviewPage() {
  const { pageId } = useParams<{ pageId: string }>()
  const { activeSite } = useWebsiteStore()

  // Derive template slug — falls back to 'lito' if store is empty
  const settings     = activeSite?.settings as Record<string, unknown> | undefined
  const templateSlug = (settings?.template_slug as string | undefined) ?? 'lito'

  // Template tokens — CSS vars, fonts, header branding
  const tokens = getCanvasTokens(templateSlug)

  // Inject Google Fonts for this template
  useFontInjection(tokens.fontUrl)

  // Override the global overflow:hidden so the preview page scrolls normally
  usePreviewScroll()

  // ── Fetch page from DB ──────────────────────────────────────────────────────
  const { data: page, isLoading } = useQuery({
    queryKey:  ['page-preview', pageId],
    queryFn:   () => pagesService.getOne(pageId!),
    enabled:   !!pageId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

  // ── Derived data ─────────────────────────────────────────────────────────────

  const blockDoc: BlockDocument = page
    ? getBlockDocFromPage(page, LOCALE)
    : { version: '1.0', locale: LOCALE, blocks: [] }

  const pageTitle = (() => {
    if (!page) return pageId ?? ''
    const tr = (page.page_translations ?? []).find((t) => t.locale === LOCALE)
    return tr?.title ?? page.slug
  })()

  // ── Document title ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!page) return
    const tr = (page.page_translations ?? []).find((t) => t.locale === LOCALE)
    document.title = `Preview — ${tr?.title ?? page.slug}`
  }, [page])

  // ── Guard ─────────────────────────────────────────────────────────────────────

  if (!pageId) return <Navigate to="/pages" replace />

  // ── CSS token vars for the content wrapper ────────────────────────────────────

  const cssVars = {
    '--cms-card-bg':    tokens['--cms-card-bg'],
    '--cms-main-bg':    tokens['--cms-main-bg'],
    '--cms-surface-2':  tokens['--cms-surface-2'],
    '--cms-surface-3':  tokens['--cms-surface-3'],
    '--text-primary':   tokens['--text-primary'],
    '--text-secondary': tokens['--text-secondary'],
    '--text-muted':     tokens['--text-muted'],
    '--lito-teal':      tokens['--lito-teal'],
    '--lito-gold':      tokens['--lito-gold'],
    '--lito-gold-deep': tokens['--lito-gold-deep'],
    '--lito-border':    tokens['--lito-border'],
    '--font-display':   tokens['--font-display'],
    '--font-body':      tokens['--font-body'],
  } as React.CSSProperties

  return (
    <div style={{ minHeight: '100vh', background: tokens['--cms-card-bg'] }}>

      {/* Fixed preview banner at very top */}
      <PreviewBanner
        title={pageTitle}
        templateSlug={templateSlug}
        blockCount={blockDoc.blocks.length}
      />

      {/* Page content — shifted below the banner */}
      <div style={{ paddingTop: BANNER_H, ...cssVars }}>

        {isLoading ? (
          <Spinner />
        ) : (
          <>
            {/* Mock site header */}
            <MockSiteHeader
              siteName={tokens.siteName}
              headerBg={tokens.headerBg}
              headerText={tokens.headerText}
              headerAccent={tokens.headerAccent}
            />

            {/* Page blocks */}
            <main style={{ background: tokens['--cms-card-bg'] }}>
              {blockDoc.blocks.length === 0 ? (
                <EmptyBlocks bg={tokens['--cms-card-bg']} />
              ) : (
                blockDoc.blocks.map((block: Block) => (
                  <BlockRenderer key={block.id} block={block} />
                ))
              )}
            </main>

            {/* Mock site footer */}
            <footer
              style={{
                background: tokens.headerBg,
                borderTop: `1px solid ${tokens.headerAccent}22`,
                padding: '32px 48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                  fontSize: 12,
                  color: `${tokens.headerText}66`,
                }}
              >
                © {new Date().getFullYear()} {tokens.siteName}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                  fontSize: 11,
                  color: `${tokens.headerText}44`,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Preview Mode
              </span>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
