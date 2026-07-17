import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users, UserPlus, MoreHorizontal, Trash2 } from 'lucide-react'
import { AppImageThumb, EnterpriseDataTable, Select } from '@litostudio/ui-cms'
import type { TeamMember, InvitePayload } from '@/services/team.service'
import type { OrgRole, EDTColumn } from '@litostudio/ui-cms'

const ROLES: OrgRole[] = ['owner', 'admin', 'editor', 'viewer']

const ROLE_LABELS: Record<OrgRole, { label: string; fg: string; bg: string }> = {
  owner:  { label: 'Owner',  fg: 'var(--lito-teal)',    bg: 'rgba(26,74,90,0.10)' },
  admin:  { label: 'Admin',  fg: 'var(--s-draft-fg)',   bg: 'var(--s-draft-bg)' },
  editor: { label: 'Editor', fg: 'var(--text-primary)', bg: 'rgba(17,17,17,0.07)' },
  viewer: { label: 'Viewer', fg: 'var(--text-muted)',   bg: 'rgba(17,17,17,0.04)' },
}

interface Props {
  members: TeamMember[]
  isLoading: boolean
  onInvite: (payload: InvitePayload) => void
  inviting: boolean
  inviteError: string | null
  onChangeRole: (id: string, role: OrgRole) => void
  onRemove: (id: string) => void
}

function RoleBadge({ role }: { role: OrgRole }) {
  const cfg = ROLE_LABELS[role]
  // Dynamic color from lookup map — keep as style
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
    <div className="flex items-center gap-[6px]">
      <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: colors[status] }} />
      <span className="text-xs text-[var(--text-muted)] capitalize">{status}</span>
    </div>
  )
}

function MemberActions({ onChangeRole, onRemove }: {
  onChangeRole: (role: OrgRole) => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Member actions"
        className="bg-transparent border-none cursor-pointer p-1 text-[var(--text-muted)] flex rounded hover:bg-[var(--lito-cream-alt)]"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 min-w-[160px] bg-[var(--cms-card-bg)] border border-[var(--lito-border)] rounded-md shadow-[var(--shadow-md)] overflow-hidden">
          <div className="px-3 pt-[6px] pb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Change role
          </div>
          {ROLES.filter(r => r !== 'owner').map(role => (
            <button
              key={role}
              type="button"
              onClick={() => { setOpen(false); onChangeRole(role) }}
              className="flex items-center gap-2 w-full px-3 py-[7px] bg-transparent border-none text-xs cursor-pointer text-[var(--text-primary)] text-left hover:bg-[var(--lito-cream-alt)]"
            >
              <RoleBadge role={role} /> {ROLE_LABELS[role].label}
            </button>
          ))}
          <div className="h-px bg-[var(--lito-border)] my-1" />
          <button
            type="button"
            onClick={() => { setOpen(false); onRemove() }}
            className="flex items-center gap-2 w-full px-3 py-[7px] bg-transparent border-none text-xs cursor-pointer text-[var(--cms-danger)] text-left hover:bg-[var(--cms-danger-bg)]"
          >
            <Trash2 size={12} /> Remove member
          </button>
        </div>
      )}
    </div>
  )
}

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role:  z.enum(['admin', 'editor', 'viewer'] as const),
})

type InviteFormValues = z.infer<typeof inviteSchema>

function InviteForm({ onInvite, inviting, error }: { onInvite: (p: InvitePayload) => void; inviting: boolean; error: string | null }) {
  const { register, control, handleSubmit, reset, formState: { errors, isValid } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    mode: 'onChange',
    defaultValues: { email: '', role: 'editor' },
  })

  function onSubmit(values: InviteFormValues) {
    onInvite({ email: values.email, role: values.role })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex gap-2 items-end flex-wrap">
      <div className="flex-1 min-w-[220px]">
        <label className="cms-label" htmlFor="invite-email">Email address</label>
        <input
          {...register('email')}
          id="invite-email"
          type="email"
          className="cms-input h-[34px]"
          placeholder="colleague@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'invite-email-error' : undefined}
        />
        {errors.email && (
          <p id="invite-email-error" role="alert" className="mt-[3px] text-[11px] text-[var(--s-danger)] font-body">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="w-[130px]">
        <label className="cms-label" htmlFor="invite-role">Role</label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select
              id="invite-role"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={ROLES.filter(r => r !== 'owner').map(r => ({ value: r, label: ROLE_LABELS[r].label }))}
            />
          )}
        />
      </div>
      <button type="submit" disabled={inviting || !isValid} className="cms-btn cms-btn-primary cms-btn-sm">
        <UserPlus size={13} /> {inviting ? 'Sending…' : 'Invite'}
      </button>
      {error && (
        <div role="alert" className="w-full px-[10px] py-[6px] rounded bg-[var(--cms-danger-bg)] text-xs text-[var(--cms-danger)]">
          {error}
        </div>
      )}
    </form>
  )
}

function MemberAvatar({ member }: { member: TeamMember }) {
  const initials = (member.full_name ?? member.email).split(/[\s@]/)[0]?.slice(0, 2).toUpperCase() ?? '?'
  return member.avatar_url ? (
    <AppImageThumb src={member.avatar_url} alt={member.full_name ?? ''} size={32} radius="50%" skeleton={false} />
  ) : (
    <div className="w-8 h-8 rounded-full bg-[rgba(212,168,83,0.12)] flex items-center justify-center text-[11px] font-semibold text-[var(--lito-gold-deep)] shrink-0">
      {initials}
    </div>
  )
}

function buildMemberColumns(onChangeRole: (id: string, role: OrgRole) => void, onRemove: (id: string) => void): EDTColumn<TeamMember>[] {
  return [
    {
      key: 'full_name',
      label: 'Member',
      sortable: true,
      render: (member) => (
        <div className="flex items-center gap-[10px]">
          <MemberAvatar member={member} />
          <div>
            <div className="font-body text-[13px] font-medium text-[var(--text-muted)]">
              {member.full_name ?? '—'}
            </div>
            <div className="font-body text-[11px] text-[var(--text-muted)]">
              {member.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (member) => <RoleBadge role={member.role} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (member) => <StatusDot status={member.status} />,
    },
    {
      key: 'joined_at',
      label: 'Joined',
      sortable: true,
      render: (member) => (
        <span className="text-xs text-[var(--text-muted)]">
          {new Date(member.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 48,
      render: (member) => (
        member.role !== 'owner' && (
          <MemberActions
            onChangeRole={(role) => onChangeRole(member.id, role)}
            onRemove={() => onRemove(member.id)}
          />
        )
      ),
    },
  ]
}

export function TeamPageView({
  members, isLoading, onInvite, inviting, inviteError,
  onChangeRole, onRemove,
}: Props) {
  const columns = buildMemberColumns(onChangeRole, onRemove)

  return (
    <div className="cms-page p-8 overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-normal text-[var(--text-muted)]">Team</h1>
        <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="cms-card px-6 py-5 mb-6">
        <h2 className="font-body text-[13px] font-medium text-[var(--text-muted)] mb-3">
          Invite a team member
        </h2>
        <InviteForm onInvite={onInvite} inviting={inviting} error={inviteError} />
      </div>

      <EnterpriseDataTable<TeamMember>
        skin="cms"
        columns={columns}
        data={members}
        loading={isLoading}
        searchKeys={['full_name', 'email']}
        searchPlaceholder="Search members…"
        emptyIcon={<Users className="w-6 h-6 text-[var(--lito-gold)]" aria-hidden />}
        emptyTitle="No team members"
        emptyDescription="Invite colleagues to collaborate on this workspace"
      />
    </div>
  )
}
