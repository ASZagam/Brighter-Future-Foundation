'use client';

/**
 * Last-resort boundary: renders when the root layout itself throws, so it must
 * supply its own <html>/<body> and cannot rely on the root layout, AuthProvider
 * or the shared stylesheet having loaded.
 *
 * The card styles below are deliberately duplicated from
 * `app/components/auth/auth-card.css` rather than imported. This is the one place
 * where self-containment matters more than a single source of truth: importing
 * the shared component here would mean the fallback page depends on the very
 * assets whose failure triggered it. If the card's appearance changes, change
 * both.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--bg-page)',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          color: 'var(--text-primary)',
        }}
      >
        <main
          style={{
            maxWidth: 480,
            margin: '4rem auto',
            padding: '2.5rem',
            background: 'var(--bg-surface)',
            borderRadius: 24,
            boxShadow: '0 20px 60px rgba(15,23,42,0.1)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.8rem',
              letterSpacing: '0.12em',
              fontWeight: 600,
              color: 'var(--danger-text)',
            }}
          >
            Error
          </p>
          <h1 style={{ fontSize: '1.6rem', lineHeight: 1.25, margin: '0.5rem 0 0.4rem' }}>
            The application could not start
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Reloading usually clears this. If it persists, contact a foundation administrator.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: 14,
                borderRadius: 14,
                background: 'var(--accent-solid)',
                color: 'var(--text-inverse)',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
            <a
              href="/"
              style={{
                padding: 14,
                borderRadius: 14,
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Back to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
