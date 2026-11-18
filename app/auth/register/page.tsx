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
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, password, password2 })
      });

      if (response.ok) {
        // Registration does not sign the user in, and a new account has no role
        // yet, so send them to sign in rather than to a route that would bounce
        // them straight back to /forbidden.
        router.push('/auth/login');
      } else {
        const body = await response.json();
        setError(typeof body.error === 'string' ? body.error : 'Registration could not be completed. Please review your details and try again.');
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
          placeholder="e.g. member@example.org"
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
          placeholder="Example: Cedar!Orbit7426"
          minLength={8}
        />
        <p className="ac-muted">Password must be at least 8 characters. Choose a unique password.</p>
        <AuthField
          label="Re-enter password"
          type="password"
          value={password2}
          onChange={setPassword2}
          required
          autoComplete="new-password"
          placeholder="Re-enter your password"
          minLength={8}
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
