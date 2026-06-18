
import { Button } from '@/components/atoms/Button'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    leftIcon?: React.ReactNode
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 text-center"
      role="status"
      aria-label={title}
    >
      {Icon && (
        <div className="mb-4 w-14 h-14 rounded-full bg-[var(--lito-gold-soft)] flex items-center justify-center">
          <Icon className="w-6 h-6 text-[var(--lito-gold)]" aria-hidden />
        </div>
      )}
      <h3 className="font-body text-sm font-medium text-[var(--text-muted)] mb-1">{title}</h3>
      {description && (
        <p className="font-body text-sm text-[var(--text-muted)] mb-5 max-w-xs">{description}</p>
      )}
      {action && (
        <Button size="sm" leftIcon={action.leftIcon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
