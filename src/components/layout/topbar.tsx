'use client'
// apps/cms/src/components/layout/topbar.tsx
import { Menu, Bell, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Avatar, AvatarFallback, AvatarImage,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  getInitials,
} from '@litostudio/ui'
import { SESSION_COOKIE } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface TopbarProps {
  onMenuClick: () => void
  user: { email: string; name: string; avatarUrl?: string }
}

export function Topbar({ onMenuClick, user }: TopbarProps) {
  const router = useRouter()

  async function handleSignOut() {
    try {
      const match = new RegExp(String.raw`(?:^|;\s*)${SESSION_COOKIE}=([^;]+)`).exec(document.cookie)
      const token = match ? decodeURIComponent(match[1]) : null

      if (token) {
        await fetch(`${API_URL}/api/v1/auth/sign-out`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } finally {
      // Always clear the cookie and redirect, even if the backend call fails
      document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          className="hidden sm:flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
          <span>Search…</span>
          <kbd className="hidden lg:inline-flex items-center rounded border border-border px-1.5 text-[10px] font-mono opacity-70">⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="text-xs bg-stone-900 text-white">
                  {getInitials(user.name || user.email)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name || 'Team Member'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><a href="/settings">Settings</a></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onSelect={handleSignOut}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
