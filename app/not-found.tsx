import Link from 'next/link';
import { AuthCard } from '@/app/components/auth/AuthCard';

export default function NotFound() {
  return (
    <AuthCard center lockupSubtitle="Page not found">
      <p className="ac-eyebrow ac-eyebrow--danger">404</p>
      <h1 className="ac-title">We can&apos;t find that page</h1>
      <p className="ac-lede">
        The link may be out of date, or the page may have moved.
      </p>

      <div className="ac-actions">
        <Link className="ac-button" href="/">
          Back to home
        </Link>
        <Link className="ac-button ac-button--secondary" href="/programs">
          Browse programs
        </Link>
      </div>
    </AuthCard>
  );
}
