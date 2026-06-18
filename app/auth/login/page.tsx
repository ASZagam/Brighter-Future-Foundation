'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      router.push('/dashboard');
    } else {
      const body = await response.json();
      setError(body.error || 'Unable to sign in');
    }

    setIsLoading(false);
  }

  return (
    <div style={{ maxWidth: 520, margin: '4rem auto', padding: '2rem', background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(15,23,42,0.1)' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Login to BFF Platform</h1>
      <p style={{ color: '#475569', fontSize: '0.9rem' }}>Access your dashboard, donations, membership and volunteer tools.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <label style={{ display: 'grid', gap: 8, fontSize: '0.9rem' }}>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} type="text" required style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
        </label>

        <label style={{ display: 'grid', gap: 8, fontSize: '0.9rem' }}>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
        </label>

        {error && <div style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{error}</div>}
        <button type="submit" disabled={isLoading} style={{ padding: '14px', borderRadius: 14, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: 24, color: '#475569', lineHeight: 1.8, fontSize: '0.85rem' }}>
        <p>
          Don&apos;t have an account? <Link href='/auth/register' style={{ color: '#2563eb' }}>Register here</Link>
        </p>
        <p>
          Forgot password? <Link href='/auth/request-password-reset' style={{ color: '#2563eb' }}>Reset it</Link>
        </p>
      </div>
    </div>
  );
}
