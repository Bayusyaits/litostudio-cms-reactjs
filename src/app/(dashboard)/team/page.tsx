'use client'
// apps/cms/src/app/(dashboard)/team/page.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  PageHeader, Button, Card, CardContent, Avatar, AvatarImage, AvatarFallback,
  Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  getInitials,
} from '@litostudio/ui'
import { api } from '@/lib/api'

interface Member {
  id: string
  user_id: string
  name: string
  email: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joined_at: string
}

const ROLE_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  editor: 'secondary',
  viewer: 'outline',
}

const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.enum(['admin', 'editor', 'viewer']),
})
type InviteValues = z.infer<typeof inviteSchema>

export default function TeamPage() {
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => api.get<{ data: Member[] }>('/api/v1/cms/organizations/members'),
  })
  const members = data?.data ?? []

  const { register, handleSubmit, reset: resetForm, setValue, watch, formState: { errors } } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'editor' },
  })

  const invite = useMutation({
    mutationFn: (v: InviteValues) => api.post('/api/v1/cms/organizations/invites', v),
    onSuccess: () => {
      toast.success('Invitation sent')
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      setInviteOpen(false)
      resetForm()
    },
    onError: () => toast.error('Failed to send invite'),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Team" description="Manage your team members and permissions.">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite member
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full animate-pulse bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-32 animate-pulse bg-muted rounded" />
                    <div className="h-2.5 w-48 animate-pulse bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.avatar_url} />
                    <AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <Badge variant={ROLE_COLORS[m.role] ?? 'outline'} className="capitalize text-xs shrink-0">
                    {m.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input id="invite-email" type="email" {...register('email')} placeholder="colleague@example.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={watch('role')} onValueChange={(v) => setValue('role', v as InviteValues['role'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit((v) => invite.mutate(v))} disabled={invite.isPending}>
              {invite.isPending ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
