'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthCard } from '@/app/components/auth/AuthCard';

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
    <AuthCard lockupSubtitle="Secure platform access">
      <h1 className="ac-title">Signing out</h1>
      <p className="ac-lede">
        {completed ? 'You have been signed out.' : 'Please wait while we sign you out.'}
      </p>
      {completed ? (
        <div className="ac-actions">
          <Link className="ac-button" href="/auth/login">
            Go to sign in
          </Link>
        </div>
      ) : null}
    </AuthCard>
  );
}
