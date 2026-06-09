'use client'
// apps/cms/src/app/(dashboard)/settings/page.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  PageHeader, Button, Input, Label, Card, CardContent, CardHeader, CardTitle,
  Separator, Avatar, AvatarFallback, getInitials,
} from '@litostudio/ui'
import { api } from '@/lib/api'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
})
type ProfileValues = z.infer<typeof profileSchema>

const orgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
})
type OrgValues = z.infer<typeof orgSchema>

interface UserProfile { id: string; email: string; full_name: string | null; avatar_url: string | null }
interface OrgSettings  { id: string; name: string; slug: string }

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [profileEmail, setProfileEmail] = useState('')

  const { data: profile } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await api.get<{ data: UserProfile }>('/api/v1/auth/me')
      const user = (res as unknown as { data: UserProfile }).data ?? (res as unknown as UserProfile)
      setProfileEmail(user.email ?? '')
      return user
    },
  })

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => api.get<OrgSettings>('/api/v1/cms/organizations/settings'),
  })

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '' },
    values: profile ? { full_name: profile.full_name ?? '' } : undefined,
  })

  const orgForm = useForm<OrgValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: '', slug: '' },
    values: org ? { name: (org as unknown as OrgSettings).name ?? '', slug: (org as unknown as OrgSettings).slug ?? '' } : undefined,
  })

  const saveProfile = useMutation({
    mutationFn: (v: ProfileValues) => api.patch('/api/v1/auth/me', v),
    onSuccess: () => {
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: ['auth-me'] })
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const saveOrg = useMutation({
    mutationFn: (v: OrgValues) => api.patch('/api/v1/cms/organizations/settings', v),
    onSuccess: () => {
      toast.success('Organization settings saved')
      queryClient.invalidateQueries({ queryKey: ['org-settings'] })
    },
    onError: () => toast.error('Failed to save settings'),
  })

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader title="Settings" description="Manage your account and organization settings." />

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-sm">
                {getInitials(profileForm.watch('full_name') || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">Profile photo is pulled from your Google account.</div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" {...profileForm.register('full_name')} />
            {profileForm.formState.errors.full_name && (
              <p className="text-xs text-destructive">{profileForm.formState.errors.full_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profileEmail} readOnly disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here. Manage it through Google.</p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={profileForm.handleSubmit((v) => saveProfile.mutate(v))}
              disabled={saveProfile.isPending}
              size="sm"
            >
              {saveProfile.isPending ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Organization</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {orgLoading ? (
            <div className="space-y-3">
              <div className="h-8 animate-pulse bg-muted/40 rounded" />
              <div className="h-8 animate-pulse bg-muted/40 rounded" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="org_name">Organization name</Label>
                <Input id="org_name" {...orgForm.register('name')} />
                {orgForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{orgForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="org_slug">Slug</Label>
                <Input id="org_slug" {...orgForm.register('slug')} className="font-mono text-xs" />
                {orgForm.formState.errors.slug && (
                  <p className="text-xs text-destructive">{orgForm.formState.errors.slug.message}</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={orgForm.handleSubmit((v) => saveOrg.mutate(v))}
                  disabled={saveOrg.isPending}
                  size="sm"
                >
                  {saveOrg.isPending ? 'Saving…' : 'Save organization'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader><CardTitle className="text-sm font-semibold text-destructive">Danger zone</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete organization</p>
              <p className="text-xs text-muted-foreground">Permanently delete this organization and all its data. This cannot be undone.</p>
            </div>
            <Button variant="destructive" size="sm" disabled>Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
