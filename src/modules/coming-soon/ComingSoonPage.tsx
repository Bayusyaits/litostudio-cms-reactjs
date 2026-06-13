import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'

/**
 * Coming Soon stub — shown for routes that exist in the sidebar but whose
 * module hasn't been built yet (e.g. /analytics, /campaigns, /seo).
 * Prevents sidebar links from hitting the catch-all and redirecting to /dashboard.
 */
export default function ComingSoonPage() {
  const { pathname } = useLocation()
  const name = pathname.replace(/^\//, '').replace(/-/g, ' ')

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        flex:           1,
        padding:        '64px 24px',
        textAlign:      'center',
      }}
    >
      <Construction
        size={48}
        style={{ color: 'var(--lito-gold-deep)', marginBottom: 16, opacity: 0.8 }}
      />
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize:   22,
          fontWeight: 600,
          color:      'var(--text-primary)',
          margin:     '0 0 8px',
          textTransform: 'capitalize',
        }}
      >
        {name || 'This page'} is coming soon
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize:   14,
          color:      'var(--text-muted)',
          maxWidth:   380,
          margin:     0,
        }}
      >
        This feature is under development and will be available in a future release.
      </p>
    </div>
  )
}
