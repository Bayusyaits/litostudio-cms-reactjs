// apps/cms/src/app/(dashboard)/layout.tsx
// Protected shell — reads the session from the backend, renders DashboardShell.
// No Supabase dependency.
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { QueryProvider } from '@/providers/query-provider'
import { Toaster } from 'sonner'
import { SESSION_COOKIE } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface SessionUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

async function getSessionUser(token: string): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const { data } = await res.json() as { data: SessionUser }
    return data
  } catch {
    return null
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) redirect('/login')

  const user = await getSessionUser(token)
  if (!user) redirect('/login')

  const name = user.full_name ?? user.email

  return (
    <QueryProvider>
      <DashboardShell user={{ email: user.email, name, avatarUrl: user.avatar_url ?? undefined }}>
        {children}
      </DashboardShell>
      <Toaster richColors position="top-right" />
    </QueryProvider>
  )
}
