'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { resolvePostLoginPath } from '@/lib/auth/navigation';
import { AuthCard, AuthField, AuthStatus, AuthSubmit } from '@/app/components/auth/AuthCard';

function safeNext(): string | null {
  if (typeof window === 'undefined') return null;
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const requestedPath = safeNext();

  useEffect(() => {
    if (authLoading || !user) return;
    router.replace(resolvePostLoginPath(user, safeNext()));
  }, [authLoading, user, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const signedIn = await login(username, password);
      router.push(resolvePostLoginPath(signedIn, safeNext()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard>
      <h1 className="ac-title">Login to your workspace</h1>
      <p className="ac-lede">
        Access your dashboard, membership, volunteering and giving tools.
      </p>

      {requestedPath ? (
        <p className="ac-notice">
          Sign in to continue to <strong>{requestedPath}</strong>. You will be returned there when your role allows access.
        </p>
      ) : null}

      <form className="ac-form" onSubmit={handleSubmit}>
        <AuthField
          label="Username or email"
          value={username}
          onChange={setUsername}
          required
          autoComplete="username"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />

        {error ? <AuthStatus tone="error">{error}</AuthStatus> : null}

        <AuthSubmit loading={isLoading}>{isLoading ? 'Signing in…' : 'Sign In'}</AuthSubmit>
      </form>

      <div className="ac-footer">
        <p>
          Don&apos;t have an account? <Link className="ac-link" href="/auth/register">Register here</Link>
        </p>
        <p>
          Forgot password? <Link className="ac-link" href="/auth/request-password-reset">Reset it</Link>
        </p>
      </div>
    </AuthCard>
  );
}
