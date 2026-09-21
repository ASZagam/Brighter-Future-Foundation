'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';

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
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully! You can now sign in.');
        } else {
          setStatus('error');
          const error = await response.json();
          setMessage(error.error || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    }

    verify();
  }, [token]);

  return (
    <div style={{ maxWidth: 600, margin: '4rem auto', padding: 24, background: '#fff', borderRadius: 24, textAlign: 'center' }}>
      <h1>Verify Your Email</h1>
      {status === 'loading' && <p>Verifying...</p>}
      {status === 'success' && (
        <>
          <p style={{ color: '#16a34a' }}>{message}</p>
          <Link href='/auth/login' style={{ color: '#2563eb' }}>Sign in</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <p style={{ color: '#b91c1c' }}>{message}</p>
          <Link href='/auth/register' style={{ color: '#2563eb' }}>Back to register</Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 600, margin: '4rem auto', padding: 24 }}>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
