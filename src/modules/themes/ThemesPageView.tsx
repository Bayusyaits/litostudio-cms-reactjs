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
    <div
      className={`border-2 rounded-[10px] overflow-hidden bg-[var(--cms-card-bg)] transition-[border-color] duration-150 ${isActive ? 'border-[var(--lito-gold)] cursor-default' : 'border-[var(--lito-border)] cursor-pointer'}`}
      onClick={isActive ? undefined : onApply}
    >
      <div className="h-[140px] bg-[var(--lito-cream-alt)] relative overflow-hidden">
        {theme.preview_image ? (
          <img src={theme.preview_image} alt={theme.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Palette size={32} className="text-[var(--text-muted)] opacity-40" />
          </div>
        )}
        {isActive && (
          <div className="absolute top-[10px] right-[10px] bg-[var(--lito-gold)] rounded-full w-6 h-6 flex items-center justify-center">
            <Check size={13} color="#fff" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="font-display text-base font-normal text-[var(--text-primary)] mb-1">
          {theme.name}
        </div>
        {theme.description && (
          <p className="font-body text-xs text-[var(--text-muted)] mb-3">
            {theme.description}
          </p>
        )}
        {isActive ? (
          <div className="flex items-center gap-[6px] text-xs text-[var(--lito-gold-deep)] font-body font-medium">
            <Check size={13} /> Active theme
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onApply() }}
            disabled={applying}
            className={`px-4 py-[6px] rounded-full border border-[var(--lito-border)] bg-transparent text-xs font-body cursor-pointer text-[var(--text-primary)] transition-opacity duration-150 ${applying ? 'opacity-50' : 'opacity-100'}`}
          >
            Apply theme
          </button>
        )}
      </div>
    </div>
  )
}

export function ThemesPageView({ themes, activeThemeId, isLoading, onApplyTheme, applying, applyError, applySuccess }: Props) {
  return (
    <div className="cms-page p-8 overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-normal text-[var(--text-primary)]">Themes</h1>
        <p className="font-body text-xs text-[var(--text-muted)] mt-[3px]">
          Choose a visual theme for your website
        </p>
      </div>

      {applySuccess && (
        <div className="mb-4 px-[14px] py-[10px] rounded-md bg-[rgba(26,74,90,0.08)] border border-[rgba(26,74,90,0.15)] text-[13px] text-[var(--s-pub-fg)] font-body">
          Theme applied successfully.
        </div>
      )}
      {applyError && (
        <div className="mb-4 px-[14px] py-[10px] rounded-md bg-[var(--cms-danger-bg)] border border-[var(--cms-danger)] text-[13px] text-[var(--cms-danger)] font-body">
          {applyError}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="cms-card overflow-hidden">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="p-4">
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
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
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
