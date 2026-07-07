/**
 * RepublishPagesModal
 *
 * Shown after the user switches templates. Calls POST /republish-pages and
 * streams the backend log array line-by-line into a terminal-style pane.
 *
 * States:
 *   idle      → user sees summary + "Republish" button
 *   running   → lines append one by one (~80 ms apart)
 *   done      → shows "Staging" badge + "View Deployments" link + "Close" button
 *   error     → shows error message + "Close" button
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import { X, Terminal, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { useFocusTrap } from '@litostudio/ui-cms'
import { Button } from '@litostudio/ui-cms'
import { themeService } from '@litostudio/ui-cms'
import { useNavigate } from 'react-router-dom'

type Phase = 'idle' | 'running' | 'done' | 'error'

interface Props {
  siteId:       string
  templateName: string
  onClose:      () => void
}

export function RepublishPagesModal({ siteId, templateName, onClose }: Props) {
  const dialogRef  = useRef<HTMLDivElement>(null)
  const logEndRef  = useRef<HTMLDivElement>(null)
  const navigate   = useNavigate()

  const [phase,       setPhase]       = useState<Phase>('idle')
  const [visibleLog,  setVisibleLog]  = useState<string[]>([])
  const [pagesCount,  setPagesCount]  = useState<number | null>(null)
  const [deployId,    setDeployId]    = useState<string | null>(null)
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null)

  useFocusTrap(dialogRef, true, onClose)

  // Auto-scroll log pane to bottom as lines appear
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleLog])

  const handleRepublish = useCallback(async () => {
    setPhase('running')
    setVisibleLog([])

    try {
      const result = await themeService.republishPages(siteId)
      setPagesCount(result.pages_updated)
      setDeployId(result.deployment_id)

      // Stream log lines with a small delay between each so it feels live
      const allLines = result.log
      for (let i = 0; i < allLines.length; i++) {
        await new Promise<void>((res) => setTimeout(res, 80))
        setVisibleLog((prev) => [...prev, allLines[i]])
      }

      setPhase('done')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg)
      setPhase('error')
    }
  }, [siteId])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="republish-title"
      className="fixed inset-0 z-[9100] flex items-center justify-center bg-[rgba(0,0,0,0.5)]"
      onClick={(e) => { if (e.target === e.currentTarget && phase !== 'running') onClose() }}
      ref={dialogRef}
    >
      <div className="bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-xl w-[520px] max-w-[94vw] shadow-[0_20px_60px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--lito-border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <Terminal size={16} className="text-[var(--lito-gold)]" />
            <div>
              <p id="republish-title" className="font-display text-[16px] font-semibold text-[var(--text-primary)] m-0 leading-tight">
                Republish All Pages
              </p>
              <p className="font-body text-[11px] text-[var(--text-muted)] mt-0.5 m-0">
                Template: <span className="font-medium text-[var(--text-primary)]">{templateName}</span>
              </p>
            </div>
          </div>
          {phase !== 'running' && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="text-[var(--text-muted)] bg-transparent border-none cursor-pointer p-1 rounded-md"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col gap-4 px-6 py-5 flex-1 overflow-hidden">

          {/* Idle state — description */}
          {phase === 'idle' && (
            <div className="space-y-3">
              <p className="font-body text-[13px] text-[var(--text-primary)] m-0 leading-relaxed">
                This will replace the page sections for all active pages with the
                default sections from the <strong>{templateName}</strong> template.
              </p>
              <ul className="space-y-1.5 m-0 pl-0 list-none">
                {[
                  'Existing sections will be wiped and re-seeded',
                  'Pages without a template default are skipped',
                  'A staging deployment log will be recorded',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 font-body text-[12px] text-[var(--text-muted)]">
                    <span className="mt-[3px] w-1 h-1 rounded-full bg-[var(--lito-gold)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="font-body text-[11px] text-[var(--cms-danger)] m-0 mt-1">
                ⚠ Destructive — custom section edits on affected pages will be lost.
              </p>
            </div>
          )}

          {/* Log pane (running + done + error) */}
          {(phase === 'running' || phase === 'done' || phase === 'error') && (
            <div className="bg-[#0d0d0d] rounded-lg p-4 overflow-y-auto flex-1 min-h-[200px] max-h-[320px] font-mono text-[11px] leading-[1.7]">
              {visibleLog.map((line, i) => {
                const isError = line.includes('ERROR') || line.includes('WARN')
                const isDone  = line.includes('Done ✓') || line.includes('✓')
                return (
                  <div
                    key={i}
                    className={
                      isError ? 'text-[#f87171]'
                      : isDone  ? 'text-[#4ade80]'
                      : 'text-[#a3a3a3]'
                    }
                  >
                    {line}
                  </div>
                )
              })}
              {phase === 'running' && (
                <div className="text-[#facc15] animate-pulse">▋</div>
              )}
              <div ref={logEndRef} />
            </div>
          )}

          {/* Done state — summary */}
          {phase === 'done' && (
            <div className="flex items-center gap-3 px-4 py-3 bg-[var(--s-pub-bg)] rounded-lg border border-[var(--s-pub-fg,#22c55e)]/20">
              <CheckCircle size={16} className="text-[var(--s-pub-fg)] shrink-0" />
              <div className="font-body text-[12px] text-[var(--text-primary)]">
                <span className="font-semibold">{pagesCount ?? 0} page(s) republished</span>
                {' — '}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: 'var(--s-sched-bg)', color: 'var(--s-sched-fg)' }}
                >
                  staging
                </span>
              </div>
            </div>
          )}

          {/* Error state */}
          {phase === 'error' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-[var(--cms-danger-bg)] rounded-lg">
              <AlertCircle size={16} className="text-[var(--cms-danger)] shrink-0 mt-0.5" />
              <p className="font-body text-[12px] text-[var(--cms-danger)] m-0">
                {errorMsg ?? 'Republish failed. Check backend logs.'}
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-[var(--lito-border)] flex items-center justify-between gap-3 shrink-0">
          {/* Left: View Deployments link (done state only) */}
          <div>
            {phase === 'done' && deployId && (
              <button
                type="button"
                onClick={() => { onClose(); navigate('/deployments') }}
                className="flex items-center gap-1.5 font-body text-[11px] text-[var(--text-muted)] bg-transparent border-none cursor-pointer p-0 hover:text-[var(--text-primary)]"
              >
                <ExternalLink size={11} />
                View deployment log
              </button>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex gap-2 ml-auto">
            {phase === 'idle' && (
              <>
                <Button skin="cms" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button skin="cms" variant="primary" size="sm" onClick={handleRepublish}>
                  Republish All Pages
                </Button>
              </>
            )}
            {phase === 'running' && (
              <Button skin="cms" variant="ghost" size="sm" disabled>
                Publishing…
              </Button>
            )}
            {(phase === 'done' || phase === 'error') && (
              <Button skin="cms" variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
