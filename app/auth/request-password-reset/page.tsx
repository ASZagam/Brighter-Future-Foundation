'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthCard, AuthField, AuthStatus, AuthSubmit } from '@/app/components/auth/AuthCard';

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  // 'idle' | 'success' | 'error', so the styling is not inferred from the
  // message text the way it used to be.
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setStatus('success');
        setMessage('If that email address has an account, a reset link is on its way.');
        setEmail('');
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.error || 'Failed to send reset link.');
      }
    } catch {
      setStatus('error');
      setMessage('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard lockupSubtitle="Account recovery">
      <h1 className="ac-title">Reset your password</h1>
      <p className="ac-lede">Enter your email address to receive a password reset link.</p>

      <form className="ac-form" onSubmit={handleSubmit}>
        <AuthField
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
          disabled={loading}
        />
        <AuthSubmit loading={loading}>{loading ? 'Sending…' : 'Send reset link'}</AuthSubmit>
      </form>

      {status !== 'idle' ? <AuthStatus tone={status === 'success' ? 'success' : 'error'}>{message}</AuthStatus> : null}

      <div className="ac-footer">
        <p>
          Remember your password? <Link className="ac-link" href="/auth/login">Sign in</Link>
        </p>
      </div>
    </AuthCard>
  );
}
