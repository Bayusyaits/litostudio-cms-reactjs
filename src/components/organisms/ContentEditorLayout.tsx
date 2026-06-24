/**
 * ContentEditorLayout — 2-panel Editor A shell.
 *
 * Left column:  main content area (children)
 * Right column: sidebar (sidebarContent)
 *
 * Handles the sticky header with back button + title + action buttons.
 */

import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/atoms/Button'

interface ContentEditorLayoutProps {
  /** Page title (e.g. "Edit Service") */
  title: string
  /** Label for the Block Editor link (optional). Defaults to "Block Editor". */
  editorBLabel?: string
  onEditorBClick?: () => void
  onBack?: () => void
  /** Breadcrumb-style subtitle (e.g. "Services / My Service") */
  subtitle?: string
  children: ReactNode
  sidebarContent: ReactNode
  className?: string
}

export function ContentEditorLayout({
  title,
  editorBLabel,
  onEditorBClick,
  onBack,
  subtitle,
  children,
  sidebarContent,
  className,
}: ContentEditorLayoutProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Sticky top bar */}
      <header className="flex items-center gap-3 px-6 py-3 border-b border-[var(--lito-border)] bg-[var(--cms-card-bg)] sticky top-0 z-10">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-bold text-[var(--text-primary)] truncate">{title}</h1>
          {subtitle && (
            <p className="font-body text-xs text-[var(--text-muted)] truncate">{subtitle}</p>
          )}
        </div>

        {onEditorBClick && (
          <Button variant="ghost" size="sm" onClick={onEditorBClick}>
            {editorBLabel ?? 'Block Editor'}
          </Button>
        )}
      </header>

      {/* Main 2-column layout */}
      <div className="flex-1 flex gap-6 p-6 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* Left — main content */}
        <main className="flex-1 min-w-0 space-y-5">
          {children}
        </main>

        {/* Right — sidebar */}
        <aside className="w-72 shrink-0 space-y-4 overflow-y-auto">
          {sidebarContent}
        </aside>
      </div>
    </div>
  )
}
