import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, SectionHeading } from '@/app/components/public/Primitives';
import { getCapabilities, getOrganization, getPrograms } from '@/lib/publicApi';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrganization();
  const name = org?.name || 'Brighter Future Foundation';
  return {
    title: `About ${name} | Mission, vision and governance`,
    description: org?.mission || `About ${name}: mission, vision, history and contact details.`,
    alternates: { canonical: '/about' },
  };
}

export default async function AboutPage() {
  const [org, capabilities, programs] = await Promise.all([
    getOrganization(),
    getCapabilities(),
    getPrograms(),
  ]);

  const disciplines = capabilities.length > 0 ? capabilities.length : 6;
  const locations = Array.from(
    new Set(programs.map((p) => p.state_name).filter((v): v is string => Boolean(v)))
  );

  return (
    <>
      <section className="pub-page-hero">
        <div className="pub-container">
          <p className="pub-eyebrow">About us</p>
          <h1>{org?.name || 'Brighter Future Foundation'}</h1>
          {org?.slogan ? <p className="pub-page-lede">{org.slogan}</p> : null}
        </div>
      </section>

      <section className="pub-section">
        <div className="pub-container pub-prose">
          <h2>Mission</h2>
          {org?.mission ? (
            <p>{org.mission}</p>
          ) : (
            <EmptyState
              title="Mission statement pending publication"
              detail="This page is populated from the organization's published profile."
            />
          )}

          <h2>Vision</h2>
          {org?.vision ? (
            <p>{org.vision}</p>
          ) : (
            <EmptyState
              title="Vision statement pending publication"
              detail="This page is populated from the organization's published profile."
            />
          )}

          <h2>Our history</h2>
          {org?.history ? (
            <p>{org.history}</p>
          ) : (
            <EmptyState
              title="Organizational history pending publication"
              detail="This page is populated from the organization's published profile."
            />
          )}

          {org?.founder_name ? (
            <>
              <h2>Leadership</h2>
              <p>
                <strong>{org.founder_name}</strong>
                {org.founder_title ? ` — ${org.founder_title}` : ''}
              </p>
            </>
          ) : null}
        </div>
      </section>

      <section className="pub-section pub-section-soft">
        <div className="pub-container">
          <SectionHeading
            eyebrow="What we do"
            title="Our disciplines"
            lede="Programme areas maintained in the platform."
          />
          {capabilities.length > 0 ? (
            <ul className="pub-card-grid">
              {capabilities.map((cap) => (
                <li className="pub-card" key={cap.id}>
                  <h3>{cap.name}</h3>
                  <p>{cap.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Discipline pillars not published yet"
              detail={`The platform is structured around ${disciplines} capability areas, which appear here once published.`}
            />
          )}
        </div>
      </section>

      <section className="pub-section" id="contact">
        <div className="pub-container">
          <SectionHeading eyebrow="Contact" title="Reach the foundation" />
          {org?.email || org?.phone || org?.address ? (
            <dl className="pub-contact-list">
              {org.email ? (
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${org.email}`}>{org.email}</a>
                  </dd>
                </div>
              ) : null}
              {org.phone ? (
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${org.phone.replace(/[^+\d]/g, '')}`}>{org.phone}</a>
                  </dd>
                </div>
              ) : null}
              {org.address ? (
                <div>
                  <dt>Address</dt>
                  <dd>{org.address}</dd>
                </div>
              ) : null}
              {locations.length > 0 ? (
                <div>
                  <dt>Active locations</dt>
                  <dd>{locations.join(', ')}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <EmptyState
              title="Contact details pending publication"
              detail="Contact information is published from the organization's public profile."
            />
          )}

          <p className="pub-section-cta">
            <Link href="/donate" className="pub-btn pub-btn-solid">
              Support our work
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
