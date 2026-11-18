import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, SectionHeading } from '@/app/components/public/Primitives';
import { getCapabilities, getOrganization, getPrograms } from '@/lib/publicApi';

export const revalidate = 0;

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

  const aboutDisciplines = org
    ? org.about_disciplines
    : capabilities.map((cap, index) => ({
        id: String(cap.id),
        name: cap.name,
        description: cap.description,
        display_order: index,
        is_published: true,
      }));
  const locations = Array.from(
    new Set(
      programs
        .filter((program) => program.status === 'active')
        .map((program) => program.state_name)
        .filter((value): value is string => Boolean(value))
    )
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
        <div className="pub-container">
          <div className="pub-prose">
            {org?.about_intro
              ? org.about_intro.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)
              : null}

            <h2>Mission</h2>
            {org?.mission ? (
              org.mission.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)
            ) : (
              <EmptyState
                title="Mission statement pending publication"
                detail="This page is populated from the organization's published profile."
              />
            )}

            <h2>Vision</h2>
            {org?.vision ? (
              org.vision.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)
            ) : (
              <EmptyState
                title="Vision statement pending publication"
                detail="This page is populated from the organization's published profile."
              />
            )}

            <h2>Our history</h2>
            {org?.history ? (
              org.history.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)
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
        </div>
      </section>

      <section className="pub-section pub-section-soft">
        <div className="pub-container">
          <SectionHeading
            eyebrow="What we do"
            title="Our disciplines"
            lede={org?.disciplines_intro || 'Our work is organized around programme and development areas that address community challenges and support sustainable impact.'}
          />
          {aboutDisciplines.length > 0 ? (
            <ul className="pub-card-grid">
              {aboutDisciplines.map((discipline) => (
                <li className="pub-card" key={discipline.id}>
                  <h3>{discipline.name}</h3>
                  <p>{discipline.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Discipline pillars not published yet"
              detail="Published programme and development areas will appear here."
            />
          )}
        </div>
      </section>

      <section className="pub-section" id="contact">
        <div className="pub-container">
          <SectionHeading eyebrow="Contact" title="Reach the foundation" />
          {org?.contact_intro ? <div className="pub-prose">{org.contact_intro.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div> : null}
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
