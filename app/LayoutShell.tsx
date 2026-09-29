'use client';

import { usePathname } from 'next/navigation';
import RoleGuard from './components/RoleGuard';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOperationsShell =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/members') ||
    pathname.startsWith('/volunteers') ||
    pathname.startsWith('/core') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/donations') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/references') ||
    pathname.startsWith('/file-uploads') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/beneficiaries') ||
    pathname.startsWith('/volunteer') ||
    pathname.startsWith('/member') ||
    pathname.startsWith('/donor');

  // Public marketing pages render their own header/footer in app/(public).
  const isPublicSite =
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/impact' ||
    pathname === '/donate' ||
    pathname === '/transparency' ||
    pathname.startsWith('/programs') ||
    pathname.startsWith('/news');

  if (isOperationsShell) {
    return <RoleGuard>{children}</RoleGuard>;
  }

  if (isPublicSite) {
    return <>{children}</>;
  }

  // Everything else is a standalone page: the auth flow, /forbidden, the 404 and
  // the error boundaries. These must NOT inherit the console chrome — a sign-in
  // form wrapped in the operations header and nav is both confusing and a
  // distraction. It also must not sit behind RoleGuard, or a logged-out visitor
  // would be bounced from /auth/login straight back to /auth/login.
  return (
    <div className='standalone-shell'>
      <main className='standalone-main'>{children}</main>
    </div>
  );
}
