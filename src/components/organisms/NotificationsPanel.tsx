// apps/cms/src/components/organisms/NotificationsPanel.tsx
// Realtime notifications panel — polling via TanStack Query (30s interval).
import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, CheckCheck, Trash2, X, Loader2 } from 'lucide-react'
import { notificationsService } from '@/services/notifications.service'
import type { Notification } from '@/services/notifications.service'
import { formatRelative } from '@/lib/utils'

// ── Notification type icon / colour ─────────────────────────────────────────
function typeDot(type: string): string {
  if (type.includes('order'))   return 'var(--lito-gold)'
  if (type.includes('contact')) return 'var(--lito-teal)'
  if (type.includes('review'))  return '#8b5cf6'
  if (type.includes('invite'))  return '#3b82f6'
  return 'var(--text-muted)'
}

interface Props {
  open: boolean
  onClose: () => void
}

const QUERY_KEY = ['notifications']
const POLL_MS   = 30_000 // 30 s

const iconBtnClass = 'bg-transparent border-none cursor-pointer text-[var(--text-muted)] px-1 py-[2px] rounded flex items-center'

export function NotificationsPanel({ open, onClose }: Props) {
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationsService.list({ limit: 30 }),
    refetchInterval: POLL_MS,
    staleTime: POLL_MS,
    enabled: open,
  })

  const notifications: Notification[] = data?.data ?? []
  const unread = data?.meta?.unread ?? 0

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Notifications"
      className="absolute top-[calc(100%+8px)] right-0 w-[360px] max-h-[520px] bg-[var(--cms-sidebar-bg)] border border-[var(--lito-border)] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.18)] z-[900] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--lito-border)] shrink-0">
        <div className="flex items-center gap-1.5">
          <Bell size={14} className="text-[var(--text-primary)]" />
          <span className="font-body text-[13px] font-semibold text-[var(--text-primary)]">
            Notifications
          </span>
          {unread > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--lito-gold)] font-body text-[10px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              title="Mark all as read"
              className={iconBtnClass}
            >
              {markAll.isPending
                ? <Loader2 size={13} className="animate-spin" />
                : <CheckCheck size={13} />
              }
            </button>
          )}
          <button onClick={onClose} title="Close" className={iconBtnClass}>
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">
        {isLoading && (
          <div className="p-8 text-center">
            <Loader2 size={20} className="text-[var(--text-muted)] animate-spin mx-auto" />
          </div>
        )}

        {isError && (
          <div className="px-6 py-6 text-center">
            <p className="font-body text-xs text-[var(--s-danger)]">
              Failed to load notifications
            </p>
          </div>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <div className="px-6 py-10 text-center">
            <Bell size={28} className="text-[var(--lito-border)] mx-auto mb-3" />
            <p className="font-body text-[13px] text-[var(--text-muted)]">
              You're all caught up!
            </p>
          </div>
        )}

        {notifications.map((n) => {
          const isRead = !!n.read_at
          return (
            <div
              key={n.id}
              className={`flex gap-2.5 px-4 py-2.5 border-b border-[var(--lito-border)] transition-[background] duration-150 cursor-default ${isRead ? 'bg-transparent' : 'bg-[var(--lito-gold-soft)]'}`}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--cms-surface-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = isRead ? 'transparent' : 'var(--lito-gold-soft)')}
            >
              {/* Dot */}
              <div
                className="w-[7px] h-[7px] rounded-full mt-[5px] shrink-0"
                style={{ background: isRead ? 'var(--lito-border)' : typeDot(n.type) }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-body text-xs text-[var(--text-primary)] m-0 truncate ${isRead ? 'font-normal' : 'font-semibold'}`}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="font-body text-[11px] text-[var(--text-muted)] mt-0.5 mb-0 truncate">
                    {n.body}
                  </p>
                )}
                <p className="font-body text-[10px] text-[var(--text-muted)] mt-1 mb-0">
                  {formatRelative(n.created_at)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-0.5 shrink-0 self-start mt-0.5">
                {!isRead && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    disabled={markRead.isPending}
                    title="Mark as read"
                    className={iconBtnClass}
                  >
                    <Check size={11} />
                  </button>
                )}
                <button
                  onClick={() => remove.mutate(n.id)}
                  disabled={remove.isPending}
                  title="Delete"
                  className={iconBtnClass}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[var(--lito-border)] shrink-0 flex justify-between items-center">
        <span className="font-body text-[10px] text-[var(--text-muted)]">Refreshes every 30s</span>
        <span className="font-body text-[10px] text-[var(--text-muted)]">{data?.meta?.total ?? 0} total</span>
      </div>
    </div>
  )
}

// ── Unread count hook — always polls (even when panel is closed) ──────────────
export function useUnreadCount(): number {
  const { data } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsService.list({ limit: 1 }),
    refetchInterval: POLL_MS,
    staleTime: POLL_MS,
  })
  return data?.meta?.unread ?? 0
}
