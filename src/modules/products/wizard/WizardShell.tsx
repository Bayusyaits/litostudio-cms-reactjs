/**
 * WizardShell — step tab bar for the product wizard. Free navigation: every
 * step is always clickable regardless of completion (grill-me decision,
 * 2026-07-22) — the only real gate is that child-resource steps (variants,
 * attributes, inventory, SEO) need a saved product id first, which each of
 * those steps communicates itself with its own inline message.
 */
interface WizardStepDef {
  id: string
  label: string
}

interface WizardShellProps {
  steps: WizardStepDef[]
  activeStepId: string
  onStepChange: (id: string) => void
  children: React.ReactNode
}

export function WizardShell({ steps, activeStepId, onStepChange, children }: WizardShellProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5 border-b border-[var(--lito-border)] pb-2">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepChange(step.id)}
            className={
              step.id === activeStepId
                ? 'cms-btn cms-btn-primary cms-btn-sm'
                : 'cms-btn cms-btn-ghost cms-btn-sm'
            }
          >
            {step.label}
          </button>
        ))}
      </div>
      <div>{children}</div>
    </div>
  )
}
