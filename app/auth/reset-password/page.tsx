'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthCard, AuthField, AuthStatus, AuthSubmit } from '@/app/components/auth/AuthCard';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password !== passwordConfirm) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, password_confirm: passwordConfirm })
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Password reset successful. Taking you to sign in…');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        const error = await response.json();
        setStatus('error');
        setMessage(error.error || 'Reset failed.');
      }
    } catch {
      setStatus('error');
      setMessage('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthCard center lockupSubtitle="Account recovery">
        <p className="ac-eyebrow ac-eyebrow--danger">Invalid link</p>
        <h1 className="ac-title">This reset link is not valid</h1>
        <p className="ac-lede">
          The link may have expired or already been used. Request a new one to continue.
        </p>
        <div className="ac-actions">
          <a className="ac-button" href="/auth/request-password-reset">
            Request a new link
          </a>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard lockupSubtitle="Account recovery">
      <h1 className="ac-title">Set a new password</h1>
      <p className="ac-lede">Choose a password you have not used before.</p>

      <form className="ac-form" onSubmit={handleSubmit}>
        <AuthField
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="new-password"
        />
        <AuthField
          label="Confirm password"
          type="password"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          required
          autoComplete="new-password"
        />

        <AuthSubmit loading={loading}>{loading ? 'Resetting…' : 'Reset password'}</AuthSubmit>
      </form>

      {status !== 'idle' ? <AuthStatus tone={status === 'success' ? 'success' : 'error'}>{message}</AuthStatus> : null}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="ac-loading">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
