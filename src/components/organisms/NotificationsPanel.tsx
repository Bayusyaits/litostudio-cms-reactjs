// apps/cms/src/components/organisms/NotificationsPanel.tsx
// Realtime notifications panel — polling via TanStack Query (30s interval).
// Upgrade path: replace polling with Supabase Realtime once
// @supabase/supabase-js is added to apps/cms/package.json.
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

export function NotificationsPanel({ open, onClose }: Props) {
  const qc = useQueryClient()

  // ── Fetch notifications (polling every 30 s) ──────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationsService.list({ limit: 30 }),
    refetchInterval: POLL_MS,
    staleTime: POLL_MS,
    enabled: open, // only poll while panel is open (unread badge uses separate hook)
  })

  const notifications: Notification[] = data?.data ?? []
  const unread = data?.meta?.unread ?? 0

  // ── Mark single as read ───────────────────────────────────────────────────
  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  // ── Delete ────────────────────────────────────────────────────────────────
  const remove = useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  // ── Close on outside click ────────────────────────────────────────────────
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
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 360,
        maxHeight: 520,
        background: 'var(--cms-sidebar-bg)',
        border: '1px solid var(--lito-border)',
        borderRadius: 12,
        boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--lito-border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Bell size={14} style={{ color: 'var(--text-primary)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Notifications
          </span>
          {unread > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, padding: '0 4px',
              borderRadius: 999,
              background: 'var(--lito-gold)',
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
              color: '#fff',
            }}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              title="Mark all as read"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
            >
              {markAll.isPending
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <CheckCheck size={13} />
              }
            </button>
          )}
          <button
            onClick={onClose}
            title="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {isLoading && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Loader2 size={20} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        )}

        {isError && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--s-danger)' }}>
              Failed to load notifications
            </p>
          </div>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <Bell size={28} style={{ color: 'var(--lito-border)', margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
              You're all caught up!
            </p>
          </div>
        )}

        {notifications.map((n) => {
          const isRead = !!n.read_at
          return (
            <div
              key={n.id}
              style={{
                display: 'flex', gap: 10, padding: '10px 16px',
                borderBottom: '1px solid var(--lito-border)',
                background: isRead ? 'transparent' : 'var(--lito-gold-soft)',
                transition: 'background 150ms',
                cursor: 'default',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--cms-surface-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = isRead ? 'transparent' : 'var(--lito-gold-soft)')}
            >
              {/* Dot */}
              <div style={{
                width: 7, height: 7,
                borderRadius: '50%',
                background: isRead ? 'var(--lito-border)' : typeDot(n.type),
                marginTop: 5,
                flexShrink: 0,
              }} />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12, fontWeight: isRead ? 400 : 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {n.title}
                </p>
                {n.body && (
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11, color: 'var(--text-muted)',
                    margin: '2px 0 0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {n.body}
                  </p>
                )}
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10, color: 'var(--text-muted)',
                  margin: '4px 0 0',
                }}>
                  {formatRelative(n.created_at)}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 2, flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}>
                {!isRead && (
                  <button
                    onClick={() => markRead.mutate(n.id)}
                    disabled={markRead.isPending}
                    title="Mark as read"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                  >
                    <Check size={11} />
                  </button>
                )}
                <button
                  onClick={() => remove.mutate(n.id)}
                  disabled={remove.isPending}
                  title="Delete"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid var(--lito-border)',
        flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>
          Refreshes every 30s
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-muted)' }}>
          {data?.meta?.total ?? 0} total
        </span>
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
