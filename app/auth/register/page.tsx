'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, password })
    });

    if (response.ok) {
      router.push('/dashboard');
    } else {
      const body = await response.json();
      setError(body.error || 'Unable to create account');
    }

    setIsLoading(false);
  }

  return (
    <div style={{ maxWidth: 520, margin: '4rem auto', padding: '2rem', background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(15,23,42,0.1)' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create your BFF account</h1>
      <p style={{ color: '#475569', fontSize: '0.9rem' }}>Register for membership and access foundation tools.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <label style={{ display: 'grid', gap: 8, fontSize: '0.9rem' }}>
          Full Name
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} type="text" required style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
        </label>

        <label style={{ display: 'grid', gap: 8, fontSize: '0.9rem' }}>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
        </label>

        <label style={{ display: 'grid', gap: 8, fontSize: '0.9rem' }}>
          Phone
          <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
        </label>

        <label style={{ display: 'grid', gap: 8, fontSize: '0.9rem' }}>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
        </label>

        {error && <div style={{ color: '#b91c1c', fontSize: '0.85rem' }}>{error}</div>}
        <button type="submit" disabled={isLoading} style={{ padding: '14px', borderRadius: 14, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
          {isLoading ? 'Creating account…' : 'Register'}
        </button>
      </form>
    </div>
  );
}
