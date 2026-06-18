import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <ShieldOff size={48} className="text-[var(--text-muted)] mb-4" />
      <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-0 mb-2">
        Access denied
      </h1>
      <p className="font-body text-sm text-[var(--text-muted)] mt-0 mb-6 max-w-[400px]">
        You don't have permission to view this page. Contact your organization owner if you need access.
      </p>
      <Link
        to="/dashboard"
        className="font-body text-sm font-medium text-[var(--lito-teal)] underline underline-offset-2"
      >
        ← Back to Dashboard
      </Link>
    </div>
  )
}
