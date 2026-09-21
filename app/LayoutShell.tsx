'use client';

import { usePathname } from 'next/navigation';
import Header from './components/Header';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOperationsShell =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/programs') ||
    pathname.startsWith('/members') ||
    pathname.startsWith('/volunteers') ||
    pathname.startsWith('/core') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/donations') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/news') ||
    pathname.startsWith('/references') ||
    pathname.startsWith('/file-uploads') ||
    pathname.startsWith('/beneficiaries');

  if (isOperationsShell) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f8fafc', color: '#0f172a' }}>
      <Header />
      <main className='app-main'>
        {children}
      </main>
      <footer className='site-footer'>
        <div className='footer-inner'>
          <p>&copy; 2026 Brighter Future Foundation</p>
          <p>Built to support mission-driven programs with clean, secure management.</p>
        </div>
      </footer>
    </div>
  );
}
