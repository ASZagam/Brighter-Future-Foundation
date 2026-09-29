'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { canAccessPath } from '@/lib/auth/route-access';

/**
 * Client-side route guard for authenticated/role-gated areas.
 *
 * Middleware handles the "no session at all" case; this component resolves the
 * current user's roles and bounces unauthorised users to /forbidden.
 */
export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const allowed = !loading && !!user && canAccessPath(user, pathname);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!canAccessPath(user, pathname)) {
      router.replace('/forbidden');
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Checking access…
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
