import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

/**
 * 404 Not Found — shown when a route doesn't match any registered path.
 * Replaces the old catch-all <Navigate to="/dashboard"> which silently
 * swallowed all unknown URLs.
 */
export default function NotFoundPage() {
  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        flex:           1,
        padding:        '48px 24px',
        textAlign:      'center',
      }}
    >
      <FileQuestion
        size={48}
        style={{ color: 'var(--text-muted)', marginBottom: 16 }}
      />
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize:   24,
          fontWeight: 600,
          color:      'var(--text-primary)',
          margin:     '0 0 8px',
        }}
      >
        Page not found
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize:   14,
          color:      'var(--text-muted)',
          margin:     '0 0 24px',
          maxWidth:   400,
        }}
      >
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        style={{
          fontFamily:      'var(--font-body)',
          fontSize:        14,
          fontWeight:      500,
          color:           'var(--lito-teal)',
          textDecoration:  'underline',
          textUnderlineOffset: 2,
        }}
      >
        ← Back to Dashboard
      </Link>
    </div>
  )
}
