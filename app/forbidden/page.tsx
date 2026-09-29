'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS, userRoles } from '@/lib/auth/roles';
import { AuthCard } from '@/app/components/auth/AuthCard';

export default function ForbiddenPage() {
  const { user, landingPath, logout } = useAuth();
  const router = useRouter();
  const roles = userRoles(user);
  const hasWorkspace = landingPath !== '/';

  async function signOut() {
    await logout();
    router.push('/auth/login');
  }

  return (
    <AuthCard center lockupSubtitle="Secure platform access">
      <p className="ac-eyebrow ac-eyebrow--danger">403</p>
      <h1 className="ac-title">Access denied</h1>

      {user ? (
        <>
          <p className="ac-body">
            Your account <strong>{user.username}</strong> does not have permission to view this area.
          </p>
          <p className="ac-muted" style={{ marginTop: 8 }}>
            {roles.length
              ? `Current role${roles.length > 1 ? 's' : ''}: ${roles
                  .map((role) => ROLE_LABELS[role] ?? role)
                  .join(', ')}.`
              : 'This account has no role assigned yet, so no workspace has been granted.'}{' '}
            Contact a foundation administrator if you expected access.
          </p>
        </>
      ) : (
        <p className="ac-body">
          You are not signed in, or your session has expired. Sign in to continue.
        </p>
      )}

      <div className="ac-actions">
        <Link className="ac-button" href={hasWorkspace ? landingPath : '/'}>
          {hasWorkspace ? 'Back to my workspace' : 'Back to home'}
        </Link>

        {user ? (
          <button className="ac-button ac-button--secondary" type="button" onClick={signOut}>
            Sign in as someone else
          </button>
        ) : (
          <Link className="ac-button ac-button--secondary" href="/auth/login">
            Sign in
          </Link>
        )}
      </div>
    </AuthCard>
  );
}
