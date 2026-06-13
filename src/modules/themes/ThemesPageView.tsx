import { Palette, Check } from 'lucide-react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState'
import type { Theme } from '@/services/theme.service'

interface Props {
  themes: Theme[]
  activeThemeId: string | null
  isLoading: boolean
  onApplyTheme: (id: string) => void
  applying: boolean
  applyError: string | null
  applySuccess: boolean
}

function ThemeCard({ theme, isActive, onApply, applying }: {
  theme: Theme
  isActive: boolean
  onApply: () => void
  applying: boolean
}) {
  return (
    <div style={{
      border: `2px solid ${isActive ? 'var(--lito-gold)' : 'var(--lito-border)'}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: 'var(--cms-card-bg)',
      transition: 'border-color 150ms',
      cursor: isActive ? 'default' : 'pointer',
    }}
      onClick={isActive ? undefined : onApply}
    >
      {/* Preview image */}
      <div style={{ height: 140, background: 'var(--lito-cream-alt)', position: 'relative', overflow: 'hidden' }}>
        {theme.preview_image ? (
          <img src={theme.preview_image} alt={theme.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Palette size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          </div>
        )}
        {isActive && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'var(--lito-gold)', borderRadius: '50%',
            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={13} color="#fff" />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 4 }}>
          {theme.name}
        </div>
        {theme.description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            {theme.description}
          </p>
        )}
        {isActive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--lito-gold-deep)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            <Check size={13} /> Active theme
          </div>
        ) : (
          <button type="button" onClick={(e) => { e.stopPropagation(); onApply() }} disabled={applying}
            style={{ padding: '6px 16px', borderRadius: 999, border: '1px solid var(--lito-border)', background: 'transparent', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', color: 'var(--text-primary)', opacity: applying ? 0.5 : 1 }}>
            Apply theme
          </button>
        )}
      </div>
    </div>
  )
}

export function ThemesPageView({ themes, activeThemeId, isLoading, onApplyTheme, applying, applyError, applySuccess }: Props) {
  return (
    <div className="cms-page" style={{ padding: 32, overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)' }}>Themes</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
          Choose a visual theme for your website
        </p>
      </div>

      {applySuccess && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 6, background: 'rgba(26,74,90,0.08)', border: '1px solid rgba(26,74,90,0.15)', fontSize: 13, color: 'var(--s-pub-fg)', fontFamily: 'var(--font-body)' }}>
          Theme applied successfully.
        </div>
      )}
      {applyError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 6, background: 'var(--cms-danger-bg)', border: '1px solid var(--cms-danger)', fontSize: 13, color: 'var(--cms-danger)', fontFamily: 'var(--font-body)' }}>
          {applyError}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="cms-card" style={{ overflow: 'hidden' }}>
              <Skeleton className="h-36 w-full" style={{ borderRadius: 0 }} />
              <div style={{ padding: '14px 16px' }}>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-3" />
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : themes.length === 0 ? (
        <EmptyState icon={Palette} title="No themes available" description="Themes will appear here once they are configured" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {themes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={theme.id === activeThemeId}
              onApply={() => onApplyTheme(theme.id)}
              applying={applying}
            />
          ))}
        </div>
      )}
    </div>
  )
}
