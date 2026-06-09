import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, ChevronRight, GripVertical } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import type { NavigationMenu, NavItem } from '@/services/navigation.service'

interface Props {
  menus: NavigationMenu[]
  activeMenu: NavigationMenu | null
  activeLocation: string
  isLoading: boolean
  isSaving: boolean
  onSelectLocation: (location: string) => void
  onSave: (items: NavItem[]) => void
}

const LOCATIONS = [
  { value: 'primary', label: 'Primary Menu' },
  { value: 'footer',  label: 'Footer Menu' },
  { value: 'social',  label: 'Social Links' },
]

function NavItemRow({
  item,
  onRemove,
  onChange,
}: {
  item: NavItem
  onRemove: () => void
  onChange: (updated: NavItem) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
      background: 'var(--cms-card-bg)',
      border: '1px solid var(--lito-border)',
      borderRadius: 8,
      marginBottom: 6,
    }}>
      <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, cursor: 'grab' }} />
      <input
        value={item.label}
        onChange={(e) => onChange({ ...item, label: e.target.value })}
        placeholder="Label"
        style={{
          flex: 1, fontFamily: 'var(--font-body)', fontSize: 13,
          color: 'var(--text-primary)', background: 'transparent',
          border: 'none', outline: 'none', minWidth: 0,
        }}
      />
      <ChevronRight size={12} style={{ color: 'var(--lito-border)', flexShrink: 0 }} />
      <input
        value={item.url}
        onChange={(e) => onChange({ ...item, url: e.target.value })}
        placeholder="URL"
        style={{
          flex: 2, fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--text-muted)', background: 'transparent',
          border: 'none', outline: 'none', minWidth: 0,
        }}
      />
      <select
        value={item.target ?? '_self'}
        onChange={(e) => onChange({ ...item, target: e.target.value as '_blank' | '_self' })}
        style={{
          fontFamily: 'var(--font-body)', fontSize: 11,
          color: 'var(--text-muted)', background: 'var(--cms-card-bg)',
          border: '1px solid var(--lito-border)',
          borderRadius: 4, padding: '2px 4px', cursor: 'pointer',
        }}
      >
        <option value="_self">Same tab</option>
        <option value="_blank">New tab</option>
      </select>
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 4, borderRadius: 4,
          display: 'flex', alignItems: 'center',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#A33028' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

export function NavigationPageView({
  menus,
  activeMenu,
  activeLocation,
  isLoading,
  isSaving,
  onSelectLocation,
  onSave,
}: Props) {
  const [items, setItems] = useState<NavItem[]>(activeMenu?.items ?? [])

  // Sync items when active menu changes
  useEffect(() => {
    setItems(activeMenu?.items ?? [])
  }, [activeMenu])

  function addItem() {
    const newItem: NavItem = {
      id:         crypto.randomUUID(),
      label:      '',
      url:        '/',
      target:     '_self',
      sort_order: items.length,
    }
    setItems((prev) => [...prev, newItem])
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateItem(id: string, updated: NavItem) {
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>
            Navigation
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Manage menus and navigation links for your website.
          </p>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onSave(items)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px',
            background: isSaving ? 'var(--lito-border)' : 'var(--lito-ink)',
            color: 'var(--lito-cream)',
            border: 'none', borderRadius: 8,
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
            cursor: isSaving ? 'not-allowed' : 'pointer',
          }}
        >
          <Save size={14} />
          {isSaving ? 'Saving…' : 'Save Menu'}
        </button>
      </div>

      {/* Location tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--lito-border)' }}>
        {LOCATIONS.map((loc) => {
          const hasMenu = menus.some((m) => m.location === loc.value)
          return (
            <button
              key={loc.value}
              type="button"
              onClick={() => onSelectLocation(loc.value)}
              style={{
                padding: '8px 16px',
                fontFamily: 'var(--font-body)', fontSize: 13,
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeLocation === loc.value ? 'var(--lito-teal)' : 'var(--text-muted)',
                borderBottom: activeLocation === loc.value ? '2px solid var(--lito-teal)' : '2px solid transparent',
                marginBottom: -1,
                fontWeight: activeLocation === loc.value ? 500 : 400,
                opacity: hasMenu ? 1 : 0.5,
              }}
            >
              {loc.label}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <Skeleton lines={5} />
      ) : (
        <div style={{
          background: 'var(--cms-card-bg)',
          border: '1px solid var(--lito-border)',
          borderRadius: 12, padding: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={addItem}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 12px',
                background: 'transparent',
                border: '1px solid var(--lito-border)',
                borderRadius: 6,
                fontFamily: 'var(--font-body)', fontSize: 12,
                color: 'var(--text-primary)', cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              Add item
            </button>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                No items yet. Click "Add item" to get started.
              </p>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <NavItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onChange={(updated) => updateItem(item.id, updated)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
