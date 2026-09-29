'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ThemeToggle from '@/app/components/ThemeToggle';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/programs', label: 'Programs' },
  { href: '/impact', label: 'Impact' },
  { href: '/news', label: 'News' },
  { href: '/transparency', label: 'Transparency' },
];

export default function PublicHeader({ orgName }: { orgName?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="pub-header">
      <div className="pub-header-inner">
        <Link href="/" className="pub-brand" aria-label={`${orgName || 'Home'} home`}>
          <span className="pub-brand-mark" aria-hidden="true">
            BFF
          </span>
          <span className="pub-brand-name">{orgName || 'Brighter Future Foundation'}</span>
        </Link>

        <nav className="pub-nav" aria-label="Primary">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={isActive(item.href) ? 'is-active' : undefined}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pub-header-actions">
          <ThemeToggle className="pub-theme-toggle" />
          {!loading && !isAuthenticated && (
            <Link href="/auth/login" className="pub-btn pub-btn-ghost">
              Sign In
            </Link>
          )}
          {!loading && isAuthenticated && (
            <Link href="/admin" className="pub-btn pub-btn-ghost">
              Dashboard
            </Link>
          )}
          <Link href="/donate" className="pub-btn pub-btn-solid">
            Donate
          </Link>
          <button
            type="button"
            className="pub-menu-toggle"
            aria-expanded={open}
            aria-controls="pub-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="pub-sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <span className="pub-burger" aria-hidden="true" data-open={open} />
          </button>
        </div>
      </div>

      <div
        id="pub-mobile-nav"
        className="pub-mobile-nav"
        data-open={open}
        hidden={!open}
      >
        <nav aria-label="Mobile">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={isActive(item.href) ? 'is-active' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/donate">Donate</Link>
            </li>
            {!loading && !isAuthenticated && (
              <li>
                <Link href="/auth/login">Sign In</Link>
              </li>
            )}
            {!loading && isAuthenticated && (
              <li>
                <Link href="/admin">Dashboard</Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
