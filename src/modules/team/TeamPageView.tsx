import { useState } from 'react'
import { Users, UserPlus, MoreHorizontal, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { SearchInput } from '@/components/molecules/SearchInput'
import { EmptyState } from '@/components/molecules/EmptyState'
import type { TeamMember, InvitePayload } from '@/services/team.service'
import type { OrgRole } from '@/types/api.types'

const ROLES: OrgRole[] = ['owner', 'admin', 'editor', 'viewer']

const ROLE_LABELS: Record<OrgRole, { label: string; fg: string; bg: string }> = {
  owner:  { label: 'Owner',  fg: 'var(--lito-teal)',    bg: 'rgba(26,74,90,0.10)' },
  admin:  { label: 'Admin',  fg: 'var(--s-draft-fg)',   bg: 'var(--s-draft-bg)' },
  editor: { label: 'Editor', fg: 'var(--text-primary)', bg: 'rgba(17,17,17,0.07)' },
  viewer: { label: 'Viewer', fg: 'var(--text-muted)',   bg: 'rgba(17,17,17,0.04)' },
}

interface Props {
  members: TeamMember[]
  meta?: { total: number; page: number; limit: number; totalPages: number }
  isLoading: boolean
  search: string
  onSearch: (v: string) => void
  page: number
  onPage: (p: number) => void
  onInvite: (payload: InvitePayload) => void
  inviting: boolean
  inviteError: string | null
  onChangeRole: (id: string, role: OrgRole) => void
  onRemove: (id: string) => void
}

function RoleBadge({ role }: { role: OrgRole }) {
  const cfg = ROLE_LABELS[role]
  return (
    <span className="status-badge" style={{ color: cfg.fg, background: cfg.bg }}>
      {cfg.label}
    </span>
  )
}

function StatusDot({ status }: { status: TeamMember['status'] }) {
  const colors: Record<TeamMember['status'], string> = {
    active:    'var(--s-pub-fg)',
    invited:   'var(--s-draft-fg)',
    suspended: 'var(--s-arch-fg)',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[status], flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{status}</span>
    </div>
  )
}

function MemberActions({ onChangeRole, onRemove }: {
  onChangeRole: (role: OrgRole) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(v => !v)} aria-label="Member actions"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', borderRadius: 4 }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--lito-cream-alt)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 50, minWidth: 160,
          background: 'var(--cms-card-bg)', border: '1px solid var(--lito-border)',
          borderRadius: 6, boxShadow: 'var(--shadow-md)', overflow: 'hidden',
        }}>
          <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Change role
          </div>
          {ROLES.filter(r => r !== 'owner').map(role => (
            <button key={role} type="button"
              onClick={() => { setOpen(false); onChangeRole(role) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 12px', background: 'none', border: 'none',
                fontSize: 12, cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--lito-cream-alt)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <RoleBadge role={role} /> {ROLE_LABELS[role].label}
            </button>
          ))}
          <div style={{ height: 1, background: 'var(--lito-border)', margin: '4px 0' }} />
          <button type="button"
            onClick={() => { setOpen(false); onRemove() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '7px 12px', background: 'none', border: 'none',
              fontSize: 12, cursor: 'pointer', color: 'var(--cms-danger)', textAlign: 'left',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--cms-danger-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <Trash2 size={12} /> Remove member
          </button>
        </div>
      )}
    </div>
  )
}

function InviteForm({ onInvite, inviting, error }: { onInvite: (p: InvitePayload) => void; inviting: boolean; error: string | null }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgRole>('editor')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    onInvite({ email: email.trim(), role })
    setEmail('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <label className="cms-label">Email address</label>
        <input
          type="email"
          className="cms-input"
          placeholder="colleague@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ height: 34 }}
        />
      </div>
      <div style={{ width: 130 }}>
        <label className="cms-label">Role</label>
        <select className="cms-input" value={role} onChange={e => setRole(e.target.value as OrgRole)} style={{ height: 34 }}>
          {ROLES.filter(r => r !== 'owner').map(r => (
            <option key={r} value={r}>{ROLE_LABELS[r].label}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={inviting || !email.trim()} className="cms-btn cms-btn-primary cms-btn-sm">
        <UserPlus size={13} /> {inviting ? 'Sending…' : 'Invite'}
      </button>
      {error && (
        <div style={{ width: '100%', padding: '6px 10px', borderRadius: 4, background: 'var(--cms-danger-bg)', fontSize: 12, color: 'var(--cms-danger)' }}>
          {error}
        </div>
      )}
    </form>
  )
}

function MemberAvatar({ member }: { member: TeamMember }) {
  const initials = (member.full_name ?? member.email).split(/[\s@]/)[0]?.slice(0, 2).toUpperCase() ?? '?'
  return member.avatar_url ? (
    <img src={member.avatar_url} alt={member.full_name ?? ''} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
  ) : (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: 'rgba(212,168,83,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 600, color: 'var(--lito-gold-deep)',
      flexShrink: 0,
    }}>{initials}</div>
  )
}

export function TeamPageView({
  members, meta, isLoading, search, onSearch,
  page, onPage, onInvite, inviting, inviteError,
  onChangeRole, onRemove,
}: Props) {
  return (
    <div className="cms-page" style={{ padding: 32, overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)' }}>Team</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
          {meta ? `${meta.total} member${meta.total !== 1 ? 's' : ''}` : 'Manage workspace members and their roles'}
        </p>
      </div>

      {/* Invite form */}
      <div className="cms-card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 12 }}>
          Invite a team member
        </h2>
        <InviteForm onInvite={onInvite} inviting={inviting} error={inviteError} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SearchInput value={search} onChange={onSearch} placeholder="Search members…" className="w-64" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {meta?.total ?? 0} member{(meta?.total ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="cms-card" style={{ overflow: 'hidden' }}>
        <table className="cms-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ width: 48 }} />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div><Skeleton className="h-3.5 w-36 mb-1" /><Skeleton className="h-2.5 w-40" /></div>
                    </div>
                  </td>
                  <td><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td><Skeleton className="h-4 w-16" /></td>
                  <td><Skeleton className="h-4 w-24" /></td>
                  <td />
                </tr>
              ))
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState icon={Users} title="No team members" description="Invite colleagues to collaborate on this workspace" />
                </td>
              </tr>
            ) : (
              members.map(member => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MemberAvatar member={member} />
                      <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {member.full_name ?? '—'}
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><RoleBadge role={member.role} /></td>
                  <td><StatusDot status={member.status} /></td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(member.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td>
                    {member.role !== 'owner' && (
                      <MemberActions
                        onChangeRole={(role) => onChangeRole(member.id, role)}
                        onRemove={() => onRemove(member.id)}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} type="button" onClick={() => onPage(p)}
              style={{
                width: 32, height: 32, borderRadius: 4, border: '1px solid',
                borderColor: p === page ? 'var(--lito-ink)' : 'var(--lito-border)',
                background: p === page ? 'var(--lito-ink)' : 'transparent',
                color: p === page ? 'var(--lito-cream)' : 'var(--text-muted)',
                fontSize: 12, cursor: 'pointer',
              }}
            >{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
