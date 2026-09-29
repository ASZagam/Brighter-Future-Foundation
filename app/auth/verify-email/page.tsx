'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthCard, AuthStatus } from '@/app/components/auth/AuthCard';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    async function verify() {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully. You can now sign in.');
        } else {
          setStatus('error');
          const error = await response.json();
          setMessage(error.error || 'Verification failed.');
        }
      } catch {
        setStatus('error');
        setMessage('Unable to reach the server. Please try again.');
      }
    }

    verify();
  }, [token]);

  return (
    <AuthCard center lockupSubtitle="Account verification">
      <h1 className="ac-title">Verify your email</h1>

      {status === 'loading' ? <p className="ac-lede">Verifying…</p> : null}

      {status === 'success' ? (
        <>
          <AuthStatus tone="success">{message}</AuthStatus>
          <div className="ac-actions">
            <Link className="ac-button" href="/auth/login">
              Sign in
            </Link>
          </div>
        </>
      ) : null}

      {status === 'error' ? (
        <>
          <AuthStatus tone="error">{message}</AuthStatus>
          <div className="ac-actions">
            <Link className="ac-button" href="/auth/register">
              Back to register
            </Link>
          </div>
        </>
      ) : null}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="ac-loading">Loading…</p>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
