'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthCard, AuthField, AuthStatus, AuthSubmit } from '@/app/components/auth/AuthCard';

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

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password })
      });

      if (response.ok) {
        // Registration does not sign the user in, and a new account has no role
        // yet, so send them to sign in rather than to a route that would bounce
        // them straight back to /forbidden.
        router.push('/auth/login');
      } else {
        const body = await response.json();
        setError(body.error || 'Unable to create account');
      }
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard lockupSubtitle="Create your foundation account">
      <h1 className="ac-title">Create your BFF account</h1>
      <p className="ac-lede">Register for membership and access foundation tools.</p>

      <form className="ac-form" onSubmit={handleSubmit}>
        <AuthField
          label="Full name"
          value={fullName}
          onChange={setFullName}
          required
          autoComplete="name"
        />
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <AuthField
          label="Phone"
          type="tel"
          value={phone}
          onChange={setPhone}
          autoComplete="tel"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="new-password"
        />

        {error ? <AuthStatus tone="error">{error}</AuthStatus> : null}

        <AuthSubmit loading={isLoading}>{isLoading ? 'Creating account…' : 'Register'}</AuthSubmit>
      </form>

      <div className="ac-footer">
        <p>
          Already have an account? <Link className="ac-link" href="/auth/login">Sign in</Link>
        </p>
      </div>
    </AuthCard>
  );
}
