'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Password reset link sent to your email.');
        setEmail('');
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to send reset link.');
      }
    } catch (err) {
      setMessage('An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '4rem auto', padding: 24, background: '#fff', borderRadius: 24 }}>
      <h1>Reset Password</h1>
      <p style={{ color: '#475569' }}>Enter your email address to receive a password reset link.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label>Email Address</label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 16, color: message.includes('sent') ? '#16a34a' : '#b91c1c' }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: 24, color: '#475569' }}>
        Remember your password? <Link href='/auth/login' style={{ color: '#2563eb' }}>Sign in</Link>
      </p>
    </div>
  );
}
