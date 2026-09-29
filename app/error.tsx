'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AuthCard } from '@/app/components/auth/AuthCard';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces the failure in the server log rather than only in the browser.
    console.error(error);
  }, [error]);

  return (
    <AuthCard center lockupSubtitle="Something went wrong">
      <p className="ac-eyebrow ac-eyebrow--danger">Error</p>
      <h1 className="ac-title">This page ran into a problem</h1>
      <p className="ac-lede">
        The issue has been logged. Try again, and if it keeps happening contact a foundation administrator.
      </p>

      {error.digest ? (
        <p className="ac-notice">
          Reference: <strong>{error.digest}</strong>
        </p>
      ) : null}

      <div className="ac-actions">
        <button className="ac-button" type="button" onClick={reset}>
          Try again
        </button>
        <Link className="ac-button ac-button--secondary" href="/">
          Back to home
        </Link>
      </div>
    </AuthCard>
  );
}
