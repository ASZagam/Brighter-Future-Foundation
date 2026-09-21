import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from './LayoutShell';

export const metadata: Metadata = {
  title: 'Brighter Future Foundation',
  description: 'Foundation platform with authentication, membership, volunteers, donations, and admin dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
