import Link from 'next/link';
import type { PublicOrganization } from '@/lib/publicApi';

const PROGRAM_LINKS = { href: '/programs', label: 'Our Programs' };
const IMPACT_LINKS = { href: '/impact', label: 'Impact' };
const NEWS_LINKS = { href: '/news', label: 'Newsroom' };
const TRANSPARENCY_LINKS = { href: '/transparency', label: 'Transparency' };
const ABOUT_LINKS = { href: '/about', label: 'About Us' };
const CONTACT_LINKS = { href: '/about#contact', label: 'Contact' };

export default function PublicFooter({ org }: { org: PublicOrganization | null }) {
  const year = new Date().getFullYear();
  const name = org?.name || 'Brighter Future Foundation';

  const socials = [
    { href: org?.facebook, label: 'Facebook' },
    { href: org?.twitter, label: 'X (Twitter)' },
    { href: org?.linkedin, label: 'LinkedIn' },
    { href: org?.instagram, label: 'Instagram' },
  ].filter((s) => Boolean(s.href));

  return (
    <footer className="pub-footer">
      <div className="pub-footer-inner">
        <div className="pub-footer-brand">
          <p className="pub-footer-name">{name}</p>
          {org?.slogan ? <p className="pub-footer-slogan">{org.slogan}</p> : null}
          {org?.mission ? (
            <p className="pub-footer-mission">{org.mission}</p>
          ) : null}
        </div>

        <nav className="pub-footer-col" aria-label="Organization">
          <h2>Organization</h2>
          <ul>
            <li>
              <Link href={ABOUT_LINKS.href}>{ABOUT_LINKS.label}</Link>
            </li>
            <li>
              <Link href={CONTACT_LINKS.href}>{CONTACT_LINKS.label}</Link>
            </li>
            <li>
              <Link href={NEWS_LINKS.href}>{NEWS_LINKS.label}</Link>
            </li>
            <li>
              <Link href={TRANSPARENCY_LINKS.href}>{TRANSPARENCY_LINKS.label}</Link>
            </li>
          </ul>
        </nav>

        <nav className="pub-footer-col" aria-label="Our work">
          <h2>Our Work</h2>
          <ul>
            <li>
              <Link href={PROGRAM_LINKS.href}>{PROGRAM_LINKS.label}</Link>
            </li>
            <li>
              <Link href={IMPACT_LINKS.href}>{IMPACT_LINKS.label}</Link>
            </li>
            <li>
              <Link href="/donate">Donate</Link>
            </li>
          </ul>
        </nav>

        <div className="pub-footer-col">
          <h2>Get in touch</h2>
          {org?.email ? (
            <p>
              <a href={`mailto:${org.email}`}>{org.email}</a>
            </p>
          ) : null}
          {org?.phone ? (
            <p>
              <a href={`tel:${org.phone.replace(/[^+\d]/g, '')}`}>{org.phone}</a>
            </p>
          ) : null}
          {org?.address ? <p className="pub-footer-address">{org.address}</p> : null}
          {!org?.email && !org?.phone && !org?.address ? (
            <p className="pub-footer-muted">Contact details pending publication.</p>
          ) : null}

          {socials.length > 0 ? (
            <ul className="pub-footer-socials">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} rel="noopener noreferrer nofollow" target="_blank">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="pub-footer-legal">
        <p>
          &copy; {year} {name}. All rights reserved.
        </p>
        <ul>
          <li>
            <Link href="/transparency">Financial transparency</Link>
          </li>
          <li>
            <Link href="/auth/login">Staff sign in</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
