import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      <FileQuestion size={48} className="text-[var(--text-muted)] mb-4" />
      <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)] mt-0 mb-2">
        Page not found
      </h1>
      <p className="font-body text-sm text-[var(--text-muted)] mt-0 mb-6 max-w-[400px]">
        The page you're looking for doesn't exist or has been moved.
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
