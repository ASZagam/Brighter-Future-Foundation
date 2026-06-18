import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header';

export const metadata: Metadata = {
  title: 'Brighter Future Foundation',
  description: 'Foundation platform with authentication, membership, volunteers, donations, and admin dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f8fafc', color: '#0f172a' }}>
          <Header />
          <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: '2.5rem 1.5rem 3rem' }}>
            {children}
          </main>
          <footer className='site-footer'>
            <div className='footer-inner'>
              <p>© 2026 Brighter Future Foundation</p>
              <p>Built to support mission-driven programs with clean, secure management.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
