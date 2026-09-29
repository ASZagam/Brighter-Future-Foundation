import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './public-site.css';
import LayoutShell from './LayoutShell';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Brighter Future Foundation',
  description: 'Foundation platform with authentication, membership, volunteers, donations, and admin dashboard.',
};

/**
 * Inter is the one typeface for the whole product (public site, operations
 * console, role workspaces and the auth pages). Exposed as a CSS variable so
 * `--font-sans` can reference it; previously each family declared its own
 * stack and none of them actually loaded a webfont, so rendering varied by OS.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/**
 * Resolves the theme before the first paint.
 *
 * A stored choice wins; otherwise the OS preference is followed. This has to run
 * as a blocking script in <head> — resolving the theme in a React effect instead
 * means the browser paints a light page first and then flips, which is a visible
 * flash on every load in dark mode.
 */
const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('bff-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=(s==='dark'||s==='light')?s:(d?'dark':'light');}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the script above mutates <html> before React
    // hydrates, so the server and client markup intentionally differ here.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
