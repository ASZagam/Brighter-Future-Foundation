'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../BFF_logo-removebg-preview.png';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

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

        <nav className='desktop-nav'>
          <Link href='/'>Home</Link>
          <Link href='/members'>Members</Link>
          <Link href='/volunteers'>Volunteers</Link>
          <Link href='/donations'>Donations</Link>
          <Link href='/events'>Events</Link>
          <Link href='/news'>News</Link>
          <Link href='/dashboard'>Dashboard</Link>
          <Link href='/core'>Core</Link>
          <Link href='/auth/login'>Login</Link>
        </nav>

        <button
          type='button'
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label='Toggle navigation menu'
          className='menu-toggle'
        >
          <span className={mobileOpen ? 'bar bar-top open' : 'bar bar-top'} />
          <span className={mobileOpen ? 'bar bar-mid open' : 'bar bar-mid'} />
          <span className={mobileOpen ? 'bar bar-bot open' : 'bar bar-bot'} />
        </button>
      </div>

      <nav className={mobileOpen ? 'mobile-nav open' : 'mobile-nav'}>
        <Link href='/' onClick={() => setMobileOpen(false)}>Home</Link>
        <Link href='/members' onClick={() => setMobileOpen(false)}>Members</Link>
        <Link href='/volunteers' onClick={() => setMobileOpen(false)}>Volunteers</Link>
        <Link href='/donations' onClick={() => setMobileOpen(false)}>Donations</Link>
        <Link href='/events' onClick={() => setMobileOpen(false)}>Events</Link>
        <Link href='/news' onClick={() => setMobileOpen(false)}>News</Link>
        <Link href='/dashboard' onClick={() => setMobileOpen(false)}>Dashboard</Link>
        <Link href='/core' onClick={() => setMobileOpen(false)}>Core</Link>
      </nav>

      <style jsx>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 50;
          width: 100%;
          background: rgba(233, 243, 255, 0.96);
          border-bottom: 1px solid rgba(37, 99, 235, 0.16);
          backdrop-filter: blur(16px);
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

        .desktop-nav {
          display: none;
          flex-direction: row;
          gap: 28px;
          align-items: center;
        }

        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 18px;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          padding: 0 1.5rem;
          transition: max-height 0.25s ease, opacity 0.25s ease, padding 0.25s ease;
          border-bottom: 1px solid transparent;
        }

        .mobile-nav.open {
          max-height: 500px;
          opacity: 1;
          padding: 1rem 1.5rem 1.25rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        .desktop-nav a,
        .mobile-nav a {
          color: #0f172a;
          font-weight: 600;
          font-size: 0.98rem;
          text-decoration: none;
          transition: color 0.2s ease, transform 0.15s ease;
        }

        .desktop-nav a:hover,
        .mobile-nav a:hover {
          color: #2563eb;
          transform: translateY(-1px);
        }

        .desktop-nav a:active,
        .mobile-nav a:active {
          color: #1d4ed8;
          transform: translateY(1px);
        }

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
          .desktop-nav {
            display: flex;
          }

          .mobile-nav,
          .menu-toggle {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
