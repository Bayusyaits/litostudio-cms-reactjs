import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'

export default function ComingSoonPage() {
  const { pathname } = useLocation()
  const name = pathname.replace(/^\//, '').replace(/-/g, ' ')

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">
      <Construction size={48} className="text-[var(--lito-gold-deep)] mb-4 opacity-80" />
      <h1 className="font-display text-[22px] font-semibold text-[var(--text-primary)] mt-0 mb-2 capitalize">
        {name || 'This page'} is coming soon
      </h1>
      <p className="font-body text-sm text-[var(--text-muted)] max-w-[380px] m-0">
        This feature is under development and will be available in a future release.
      </p>
    </div>
  )
}
