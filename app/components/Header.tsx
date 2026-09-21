'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import logo from '../../BFF_logo-removebg-preview.png';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();
  const navigation = [
    { href: '/dashboard', label: 'Overview', icon: '◈' },
    { href: '/core', label: 'Operations', icon: '⌘' },
    { href: '/members', label: 'Members', icon: '◎' },
    { href: '/volunteers', label: 'Volunteers', icon: '◇' },
    { href: '/donations', label: 'Donations', icon: '₦' },
    { href: '/events', label: 'Events', icon: '□' },
    { href: '/news', label: 'News', icon: '≡' },
  ];
  const utilityNavigation = [
    { href: '/notifications', label: 'Notifications' },
    { href: '/file-uploads', label: 'Files' },
    { href: '/references', label: 'References' },
    { href: '/settings', label: 'Settings' },
  ];

  const closeMenu = () => setMobileOpen(false);
  const currentPage = navigation.find((item) => pathname === item.href)?.label || 'BFF Ops';

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('bff-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    window.localStorage.setItem('bff-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  function Navigation({ mobile = false }: { mobile?: boolean }) {
    return (
      <nav className={mobile ? 'mobile-nav open' : 'sidebar-nav'} aria-label={mobile ? 'Mobile navigation' : 'Primary navigation'}>
        <p className='nav-section-label'>Workspace</p>
        {navigation.map((item) => (
          <Link key={item.href} href={item.href} onClick={closeMenu} className='nav-item'>
            <span className='nav-icon' aria-hidden='true'>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <p className='nav-section-label nav-section-spaced'>Manage</p>
        {utilityNavigation.map((item) => (
          <Link key={item.href} href={item.href} onClick={closeMenu} className='nav-item'>
            <span className='nav-icon' aria-hidden='true'>•</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <header className='site-header'>
      <div className='header-inner'>
        <Link href='/' className='brand'>
          <Image src={logo} alt='BFF logo' width={52} height={52} style={{ borderRadius: 12 }} />
          <div>
            <p className='brand-title'>Brighter Future Foundation</p>
            <p className='brand-tag'>Empower. Engage. Elevate.</p>
          </div>
        </Link>

        <div className='mobile-page-context' aria-live='polite'>
          <strong>{currentPage}</strong>
          <span>BFF Ops</span>
        </div>

        <button
          type='button'
          className='theme-toggle'
          onClick={() => setDarkMode((enabled) => !enabled)}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span aria-hidden='true'>{darkMode ? '☀' : '◐'}</span>
        </button>

        <button
          type='button'
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label='Toggle navigation menu'
          aria-expanded={mobileOpen}
          aria-controls='mobile-navigation'
          className='menu-toggle'
        >
          <span className={mobileOpen ? 'bar bar-top open' : 'bar bar-top'} />
          <span className={mobileOpen ? 'bar bar-mid open' : 'bar bar-mid'} />
          <span className={mobileOpen ? 'bar bar-bot open' : 'bar bar-bot'} />
        </button>
      </div>

      <aside className='desktop-sidebar'>
        <Navigation />
        <div className='sidebar-account'>
          <span className='account-avatar' aria-hidden='true'>B</span>
          <div><strong>BFF workspace</strong><span>Secure operations</span></div>
          <Link href='/auth/logout' aria-label='Log out' className='logout-mark'>↗</Link>
        </div>
      </aside>

      <div id='mobile-navigation' className={mobileOpen ? 'mobile-drawer visible' : 'mobile-drawer'}>
        <Navigation mobile />
      </div>

      <nav className='mobile-bottom-nav' aria-label='Quick navigation'>
        {navigation.slice(0, 4).map((item) => (
          <Link key={item.href} href={item.href} className={pathname === item.href ? 'bottom-nav-item active' : 'bottom-nav-item'} aria-current={pathname === item.href ? 'page' : undefined}>
            <span aria-hidden='true'>{item.icon}</span>
            <small>{item.label}</small>
          </Link>
        ))}
        <button type='button' className={mobileOpen ? 'bottom-nav-item active' : 'bottom-nav-item'} onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls='mobile-navigation'>
          <span aria-hidden='true'>+</span>
          <small>More</small>
        </button>
      </nav>

      <style jsx>{`
        .site-header {
          position: relative;
          top: 0;
          z-index: 20;
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #dfe7df;
        }

        .header-inner {
          max-width: 1180px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }

        .brand-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }

        .brand-tag {
          margin: 0;
          font-size: 0.85rem;
          color: #475569;
        }

        .mobile-page-context { display: none; flex: 1; text-align: center; }
        .mobile-page-context strong, .mobile-page-context span { display: block; }
        .mobile-page-context strong { color: #17221d; font-size: .88rem; }
        .mobile-page-context span { color: #718077; font-size: .68rem; margin-top: 2px; }

        .desktop-sidebar { display: none; }
        .sidebar-nav, .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .nav-section-label { margin: 0 0 8px; color: #7b8b82; font-size: .7rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .nav-section-spaced { margin-top: 22px; }
        .nav-item { display: flex; align-items: center; gap: 12px; min-height: 43px; padding: 0 13px; border-radius: 11px; color: #52645a; font-size: .92rem; font-weight: 700; transition: background .2s ease, color .2s ease, transform .2s ease; }
        .nav-item:hover { color: #176b4d; background: #eef7f1; transform: translateX(2px); }
        .nav-icon { width: 20px; color: #789184; text-align: center; font-size: 1.1rem; }
        .sidebar-account { display: flex; align-items: center; gap: 10px; margin-top: auto; padding: 14px 0 0; border-top: 1px solid #dfe7df; }
        .account-avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: #176b4d; color: white; font-weight: 800; }
        .sidebar-account div { display: grid; gap: 2px; flex: 1; }
        .sidebar-account strong { font-size: .78rem; color: #23332a; }
        .sidebar-account span { color: #829188; font-size: .72rem; }
        .logout-mark { color: #9b3030; font-weight: 800; }
        .mobile-drawer { display: grid; grid-template-rows: 0fr; overflow: hidden; background: #fbfdfb; transition: grid-template-rows .25s ease; }
        .mobile-drawer.visible { grid-template-rows: 1fr; border-top: 1px solid #eef2ee; }
        .mobile-drawer .mobile-nav { min-height: 0; padding: 0 1.5rem; overflow: hidden; }
        .mobile-drawer.visible .mobile-nav { padding: 1rem 1.5rem 1.25rem; }
        .mobile-bottom-nav { display: none; }

        .menu-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 14px;
          background: #ffffff;
          cursor: pointer;
          padding: 0;
        }

        .theme-toggle { display: inline-grid; place-items: center; width: 40px; height: 40px; padding: 0; border: 1px solid #dfe7df; border-radius: 11px; background: transparent; color: #52645a; cursor: pointer; font-size: 1.05rem; }
        .theme-toggle:hover { background: #eef7f1; color: #176b4d; }

        .bar {
          display: block;
          width: 20px;
          height: 2px;
          background: #0f172a;
          border-radius: 1px;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .bar + .bar {
          margin-top: 4px;
        }

        .bar-top.open {
          transform: translateY(6px) rotate(45deg);
        }

        .bar-mid.open {
          opacity: 0;
        }

        .bar-bot.open {
          transform: translateY(-6px) rotate(-45deg);
        }

        @media (min-width: 900px) {
          .site-header { min-height: 74px; }
          .menu-toggle, .mobile-drawer { display: none; }
          .desktop-sidebar { position: fixed; top: 74px; bottom: 0; left: 0; display: flex; flex-direction: column; width: 238px; padding: 28px 18px 20px; background: #ffffff; border-right: 1px solid #dfe7df; }
        }

        @media (max-width: 899px) {
          .brand > div { display: none; }
          .brand img { width: 38px; height: 38px; }
          .mobile-page-context { display: block; }
          .header-inner { min-height: 64px; padding: .75rem 1rem; }
          .theme-toggle { width: 38px; height: 38px; }
          .mobile-bottom-nav { position: fixed; right: 0; bottom: 0; left: 0; z-index: 30; display: flex; align-items: center; min-height: 70px; padding: .35rem .4rem calc(.35rem + env(safe-area-inset-bottom, 0px)); background: rgba(255,255,255,.94); border-top: 1px solid #dfe7df; box-shadow: 0 -8px 24px rgba(36,62,48,.08); backdrop-filter: blur(16px); }
          .bottom-nav-item { display: grid; place-items: center; flex: 1; min-height: 52px; gap: 3px; border: 0; background: transparent; color: #7a8980; font-size: 1.15rem; cursor: pointer; }
          .bottom-nav-item small { font-size: .65rem; font-weight: 700; }
          .bottom-nav-item.active { color: #176b4d; }
        }
      `}</style>
    </header>
  );
}
