'use client';

import { useEffect, useState } from 'react';

export default function LogoutPage() {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function logout() {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCompleted(true);
    }

    logout();
  }, []);

  return (
    <div style={{ maxWidth: 620, margin: '4rem auto', padding: 24, background: '#fff', borderRadius: 24, boxShadow: '0 20px 60px rgba(15,23,42,0.08)' }}>
      <h1>Signing out</h1>
      <p style={{ color: '#475569' }}>{completed ? 'You have been signed out.' : 'Please wait while we sign you out.'}</p>
      {completed ? <a href="/auth/login" style={{ color: '#2563eb' }}>Go to sign in</a> : null}
    </div>
  );
}
