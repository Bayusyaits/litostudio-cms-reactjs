import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FileText, BookOpen, Image, Film, MapPin,
  Megaphone, Globe, Settings, Users, BarChart2, Search,
  LogOut, ChevronRight, Tag, Hash, Palette,
  Package, Layers, MessageSquare, HelpCircle, Puzzle,
  Briefcase, Quote, DollarSign, Tv2, MessageCircle,
  ShoppingBag, Mail, Inbox, Bot, Link2, Rocket, FileSpreadsheet,
  Building2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useThemeStore } from '@/stores/theme.store'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'

interface NavItem { label: string; icon: React.ElementType; to: string }
interface NavSection { section: string; items: NavItem[] }

const NAV: NavSection[] = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
      { label: 'Analytics',  icon: BarChart2,       to: '/analytics' },
    ],
  },
  {
    section: 'Content',
    items: [
      { label: 'Stories',      icon: FileText, to: '/stories' },
      { label: 'Journal',      icon: BookOpen, to: '/journal' },
      { label: 'Gallery',      icon: Image,    to: '/gallery' },
      { label: 'Media',        icon: Film,     to: '/media' },
      { label: 'Destinations', icon: MapPin,   to: '/destinations' },
      { label: 'Categories',   icon: Tag,      to: '/categories' },
      { label: 'Tags',         icon: Hash,     to: '/tags' },
    ],
  },
  {
    section: 'Commerce',
    items: [
      { label: 'Products',    icon: Package,       to: '/products' },
      { label: 'Collections', icon: Layers,        to: '/collections' },
      { label: 'Orders',      icon: ShoppingBag,   to: '/orders' },
      { label: 'Reviews',     icon: MessageSquare, to: '/reviews' },
    ],
  },
  {
    section: 'Services',
    items: [
      { label: 'Services',      icon: Briefcase,    to: '/services' },
      { label: 'Testimonials',  icon: Quote,        to: '/testimonials' },
      { label: 'Pricing',       icon: DollarSign,   to: '/pricing' },
    ],
  },
  {
    section: 'Engagement',
    items: [
      { label: 'Messages',    icon: Inbox,         to: '/messages' },
      { label: 'Newsletter',  icon: Mail,          to: '/newsletter' },
      { label: 'FAQs',        icon: HelpCircle,    to: '/faqs' },
      { label: 'Comments',    icon: MessageCircle, to: '/comments' },
    ],
  },
  {
    section: 'Marketing',
    items: [
      { label: 'Campaigns', icon: Megaphone, to: '/campaigns' },
      { label: 'SEO',       icon: Search,    to: '/seo' },
    ],
  },
  {
    section: 'Website',
    items: [
      { label: 'Hero Slides', icon: Tv2,          to: '/hero' },
      { label: 'Pages',       icon: Globe,        to: '/pages' },
      { label: 'Navigation',  icon: ChevronRight, to: '/navigation' },
      { label: 'Themes',      icon: Palette,      to: '/themes' },
      { label: 'Add-Ons',     icon: Puzzle,       to: '/addons' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { label: 'Team',          icon: Users,          to: '/team' },
      { label: 'Organizations', icon: Building2,       to: '/organizations' },
      { label: 'Domains',       icon: Link2,           to: '/domains' },
      { label: 'Deployments',   icon: Rocket,          to: '/deployments' },
      { label: 'CSV Import',    icon: FileSpreadsheet, to: '/csv' },
      { label: 'AI Assistant',  icon: Bot,             to: '/ai-assistant' },
    ],
  },
  {
    section: 'Settings',
    items: [
      { label: 'Settings', icon: Settings, to: '/settings' },
    ],
  },
]

function UserWidget() {
  const { user, logout } = useAuthStore()
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div style={{
      borderTop: '1px solid var(--cms-sidebar-div)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      {/* Avatar */}
      {user?.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.full_name ?? 'User'}
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(212,168,83,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 12, fontWeight: 500,
          color: 'var(--lito-gold)',
        }}>
          {initials}
        </div>
      )}

      {/* Name + role */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12, fontWeight: 500,
          color: 'rgba(247,244,238,0.80)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user?.full_name ?? user?.email ?? 'User'}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          color: 'var(--cms-sidebar-label)',
          textTransform: 'capitalize',
        }}>
          {user?.role ?? 'Member'}
        </div>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={logout}
        title="Log out"
        aria-label="Log out"
        style={{
          background: 'none',
          border: 'none',
          padding: 6,
          cursor: 'pointer',
          color: 'var(--cms-sidebar-label)',
          display: 'flex',
          borderRadius: 4,
          transition: 'color 150ms, background 150ms',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#A33028'
          e.currentTarget.style.background = 'rgba(163,48,40,0.1)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--cms-sidebar-label)'
          e.currentTarget.style.background = 'none'
        }}
      >
        <LogOut size={14} />
      </button>
    </div>
  )
}

export function AppSidebar() {
  const { sidebarOpen } = useThemeStore()

  if (!sidebarOpen) return null

  return (
    <aside style={{
      width: 'var(--cms-sidebar-w)',
      flexShrink: 0,
      height: '100vh',
      background: 'var(--cms-sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(247,244,238,0.04)',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid rgba(247,244,238,0.06)',
        flexShrink: 0,
      }}>
        <img
          src="/logo/logo-horizontal-white.png"
          alt="Lito Studio"
          style={{ height: 22, objectFit: 'contain', objectPosition: 'left' }}
        />
      </div>

      {/* Workspace switcher */}
      <WorkspaceSwitcher />

      {/* Nav */}
      <nav className="cms-scroll" style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 4 }}>
            {/* Section label */}
            <div style={{
              padding: '10px 20px 4px',
              fontSize: 10,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: 'var(--cms-sidebar-label)',
              fontFamily: 'var(--font-body)',
            }}>
              {section}
            </div>

            {items.map(({ label, icon: Icon, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `cms-nav-item ${isActive ? 'active' : ''}`}
                style={{ display: 'flex' }}
              >
                <Icon size={15} style={{ flexShrink: 0, opacity: 0.85 }} />
                <span style={{ lineHeight: 1 }}>{label}</span>
              </NavLink>
            ))}

            <div style={{ height: 1, margin: '6px 16px 0', background: 'var(--cms-sidebar-div)' }} />
          </div>
        ))}
      </nav>

      {/* User widget */}
      <UserWidget />
    </aside>
  )
}
