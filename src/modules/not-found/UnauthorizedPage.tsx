import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

/**
 * 403 Unauthorized — shown when a user lacks permission for a resource.
 * Reached via handleForbidden() in http/auth.ts on 403 API responses.
 */
export default function UnauthorizedPage() {
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
      <ShieldOff
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
        Access denied
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
        You don't have permission to view this page. Contact your organization owner if you need access.
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
