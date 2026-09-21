'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, password_confirm: passwordConfirm }),
      });

      if (response.ok) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => router.push('/auth/login'), 2000);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Reset failed.');
      }
    } catch (err) {
      setMessage('An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 600, margin: '4rem auto', padding: 24, textAlign: 'center' }}>
        <p style={{ color: '#b91c1c' }}>Invalid reset link.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '4rem auto', padding: 24, background: '#fff', borderRadius: 24 }}>
      <h1>Set New Password</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label>New Password</label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #d1d5db', marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>Confirm Password</label>
          <input
            type='password'
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #d1d5db', marginTop: 8 }}
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 12,
            background: loading ? '#9ca3af' : '#1d4ed8',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 16, color: message.includes('successful') ? '#16a34a' : '#b91c1c' }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 600, margin: '4rem auto', padding: 24 }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
