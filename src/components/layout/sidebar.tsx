'use client'
// apps/cms/src/components/layout/sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Globe,
  FileText,
  ImageIcon,
  ClipboardList,
  Megaphone,
  Rocket,
  Users,
  Settings,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@litostudio/ui'
import { Separator } from '@litostudio/ui'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  matchExact?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, matchExact: true },
  { label: 'Websites', href: '/websites', icon: Globe },
  { label: 'Content', href: '/content', icon: FileText },
  { label: 'Media', href: '/media', icon: ImageIcon },
  { label: 'Forms', href: '/forms', icon: ClipboardList },
  { label: 'Marketing', href: '/marketing', icon: Megaphone },
  { label: 'Deployments', href: '/deployments', icon: Rocket },
]

const bottomItems: NavItem[] = [
  { label: 'Team', href: '/team', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  function isActive(item: NavItem) {
    if (item.matchExact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-sm">L</span>
            </div>
            <span className="font-semibold text-sidebar-foreground text-sm">Lito Studio</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item)} />
          ))}

          <Separator className="my-3 bg-sidebar-border" />

          {bottomItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item)} />
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/50 truncate">Lito Studio CMS</p>
        </div>
      </aside>
    </>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
    </Link>
  )
}
